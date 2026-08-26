const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');

const db = require('../config/db');
const { verifyFirebaseIdToken } = require('../config/firebase');
const { normalizePermissions, signUserToken } = require('../middleware/auth');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const genericManualResetMessage = 'Se os dados corresponderem a uma conta ativa, a solicitacao sera analisada pelo suporte.';
const genericResetMessage = 'Se o e-mail estiver cadastrado, vocÃª receberÃ¡ as instruÃ§Ãµes em instantes.';

function publicUser(user, token) {
  const nivel = String(user.nivel || 'comum').toLowerCase().trim();
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    nivel: nivel === 'administrador' ? 'admin' : nivel,
    permissoes: normalizePermissions(user.permissoes),
    mustChangePassword: user.must_change_password === true,
    ...(user.must_change_password === true ? { temporaryPasswordExpiresAt: user.temporary_password_expires_at } : {}),
    ...(token ? { token } : {})
  };
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[char]);
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function handleDatabaseError(res, error, context, duplicateMessage) {
  if (error.code === '23505' && duplicateMessage) {
    return res.status(409).json({ error: duplicateMessage });
  }
  console.error(`${context}:`, error);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
}

async function ownsDestination(userId, obraId, sedeId) {
  const { rows } = await db.query(
    `SELECT
       ($2::integer IS NOT NULL AND EXISTS (
         SELECT 1 FROM obras WHERE id = $2 AND usuario_id = $1
       )) OR
       ($3::integer IS NOT NULL AND EXISTS (
         SELECT 1 FROM sedes WHERE id = $3 AND usuario_id = $1
       )) AS owned`,
    [userId, obraId, sedeId]
  );
  return rows[0]?.owned === true;
}

function generateTemporaryPassword(length = 16) {
  const groups = [
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    'abcdefghijkmnopqrstuvwxyz',
    '23456789',
    '!@#$%'
  ];
  const characters = groups.map((group) => group[crypto.randomInt(group.length)]);
  const alphabet = groups.join('');
  while (characters.length < length) {
    characters.push(alphabet[crypto.randomInt(alphabet.length)]);
  }
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.randomInt(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }
  return characters.join('');
}

const requestPasswordReset = async (req, res) => {
  const { email, contactType, contact } = req.body;
  try {
    const { rows } = await db.query(
      "SELECT id FROM usuarios WHERE lower(email) = lower($1) AND status = 'ativo' LIMIT 1",
      [email]
    );
    const user = rows[0];
    if (user) {
      await db.query(
        `INSERT INTO password_reset_requests (usuario_id, contact_type, contact_value)
         VALUES ($1, $2, $3)
         ON CONFLICT (usuario_id) WHERE status = 'pending'
         DO NOTHING`,
        [user.id, contactType, contact]
      );
    }
    return res.status(202).json({ message: genericManualResetMessage });
  } catch (error) {
    return handleDatabaseError(res, error, 'Erro ao registrar solicitacao de recuperacao');
  }
};

const registrarUsuarioTeste = async (req, res) => {
  const { nome, email, senha } = req.body;
  try {
    const senhaHash = await bcrypt.hash(senha, 12);
    await db.query(
      `INSERT INTO usuarios (nome, email, senha, nivel, status)
       VALUES ($1, $2, $3, 'comum', 'ativo')`,
      [nome, email, senhaHash]
    );
    return res.status(201).json({ message: 'Ambiente de testes liberado para o usuÃ¡rio.' });
  } catch (error) {
    return handleDatabaseError(res, error, 'Erro no registro', 'Este e-mail jÃ¡ estÃ¡ registrado.');
  }
};

const forgotPassword = async (req, res) => {
  if (!resend || !process.env.RESEND_FROM) {
    console.warn('RecuperaÃ§Ã£o indisponÃ­vel: configure RESEND_API_KEY e RESEND_FROM.');
    return res.status(503).json({ error: 'ServiÃ§o de e-mail temporariamente indisponÃ­vel.' });
  }

  const { email } = req.body;
  let tokenHash;
  try {
    const { rows } = await db.query(
      "SELECT id, nome, email FROM usuarios WHERE lower(email) = lower($1) AND status = 'ativo' LIMIT 1",
      [email]
    );
    const usuario = rows[0];
    if (!usuario) return res.json({ message: genericResetMessage });

    const token = crypto.randomBytes(32).toString('hex');
    tokenHash = hashResetToken(token);
    await db.query('DELETE FROM password_reset_tokens WHERE usuario_id = $1 OR expires_at <= now()', [usuario.id]);
    await db.query(
      `INSERT INTO password_reset_tokens (token_hash, usuario_id, expires_at)
       VALUES ($1, $2, now() + interval '30 minutes')`,
      [tokenHash, usuario.id]
    );

    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) throw new Error('FRONTEND_URL nÃ£o configurada.');
    const resetUrl = new URL('/reset-password', frontendUrl);
    resetUrl.searchParams.set('token', token);

    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM,
      to: usuario.email,
      subject: 'RedefiniÃ§Ã£o de senha - Houzen',
      html: `
        <div style="font-family:Arial,sans-serif;background:#09090b;color:#fff;padding:24px">
          <div style="max-width:520px;margin:auto;background:#151518;padding:32px;border-radius:12px">
            <h2 style="margin-top:0">OlÃ¡, ${escapeHtml(usuario.nome)}!</h2>
            <p>Recebemos uma solicitaÃ§Ã£o para redefinir sua senha.</p>
            <p><a href="${resetUrl.toString()}" style="display:inline-block;background:#f97316;color:#111;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold">Criar nova senha</a></p>
            <p style="color:#a1a1aa;font-size:14px">O link expira em 30 minutos e pode ser usado uma Ãºnica vez. Se vocÃª nÃ£o fez a solicitaÃ§Ã£o, ignore este e-mail.</p>
          </div>
        </div>`
    });
    if (emailError) throw emailError;

    return res.json({ message: genericResetMessage });
  } catch (error) {
    if (tokenHash) {
      await db.query('DELETE FROM password_reset_tokens WHERE token_hash = $1', [tokenHash]).catch(() => {});
    }
    console.error('Erro na recuperaÃ§Ã£o de senha:', error);
    return res.status(500).json({ error: 'NÃ£o foi possÃ­vel processar a solicitaÃ§Ã£o.' });
  }
};

const login = async (req, res) => {
  const { email, senha } = req.body;
  try {
    const { rows } = await db.query(
      'SELECT id, nome, email, senha, nivel, status, permissoes, must_change_password, temporary_password_expires_at, session_version FROM usuarios WHERE lower(email) = lower($1) LIMIT 1',
      [email]
    );
    const user = rows[0];
    const senhaCorreta = user?.senha ? await bcrypt.compare(senha, user.senha).catch(() => false) : false;
    if (!user || !senhaCorreta) return res.status(401).json({ message: 'Credenciais incorretas.' });
    if (String(user.status || '').toLowerCase().trim() !== 'ativo') {
      return res.status(403).json({ message: 'Sua conta estÃ¡ suspensa ou inativa.' });
    }

    if (user.must_change_password === true && (
      !user.temporary_password_expires_at || new Date(user.temporary_password_expires_at) <= new Date()
    )) {
      return res.status(403).json({
        message: 'A senha temporaria expirou. Solicite uma nova recuperacao.',
        code: 'TEMPORARY_PASSWORD_EXPIRED'
      });
    }

    return res.json(publicUser(user, signUserToken(user.id, user.session_version)));
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ message: 'Erro interno no login.' });
  }
};

const resetPassword = async (req, res) => {
  const { token, novaSenha } = req.body;
  const tokenHash = hashResetToken(token);
  try {
    const senhaHash = await bcrypt.hash(novaSenha, 12);
    const { rows } = await db.query(
      `WITH consumed AS (
         DELETE FROM password_reset_tokens
         WHERE token_hash = $1 AND expires_at > now()
         RETURNING usuario_id
       )
       UPDATE usuarios
       SET senha = $2
       WHERE id = (SELECT usuario_id FROM consumed)
       RETURNING id`,
      [tokenHash, senhaHash]
    );
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Link invÃ¡lido ou expirado. Solicite um novo link.' });
    }
    return res.json({ message: 'Senha atualizada com sucesso.' });
  } catch (error) {
    return handleDatabaseError(res, error, 'Erro ao redefinir senha');
  }
};

const googleLogin = async (req, res) => {
  try {
    const decoded = await verifyFirebaseIdToken(req.body.idToken);
    if (!decoded.email || decoded.email_verified !== true) {
      return res.status(401).json({ message: 'Conta Google sem e-mail verificado.' });
    }

    const { rows } = await db.query(
      `SELECT id, nome, email, firebase_uid, nivel, status, permissoes, must_change_password, temporary_password_expires_at, session_version
       FROM usuarios
       WHERE firebase_uid = $1 OR lower(email) = lower($2)
       LIMIT 1`,
      [decoded.uid, decoded.email]
    );
    let user = rows[0];

    if (!user) {
      const senhaInutilizavel = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
      const inserted = await db.query(
        `INSERT INTO usuarios (nome, email, senha, firebase_uid, nivel, status)
         VALUES ($1, $2, $3, $4, 'comum', 'ativo')
         RETURNING id, nome, email, nivel, status, permissoes, must_change_password, temporary_password_expires_at, session_version`,
        [decoded.name || 'UsuÃ¡rio Google', decoded.email, senhaInutilizavel, decoded.uid]
      );
      user = inserted.rows[0];
    } else if (!user.firebase_uid) {
      await db.query('UPDATE usuarios SET firebase_uid = $1 WHERE id = $2', [decoded.uid, user.id]);
    }

    if (String(user.status || '').toLowerCase().trim() !== 'ativo') {
      return res.status(403).json({ message: 'Conta inativa.' });
    }
    return res.json(publicUser(user, signUserToken(user.id, user.session_version)));
  } catch (error) {
    if (error.code === 'FIREBASE_NOT_CONFIGURED') {
      return res.status(503).json({ message: 'Login Google temporariamente indisponÃ­vel.' });
    }
    if (error.code === 'FIREBASE_INVALID_TOKEN') {
      return res.status(401).json({ message: 'Token do Google invÃ¡lido ou expirado.' });
    }
    return handleDatabaseError(res, error, 'Erro no login Google');
  }
};

const getSession = (req, res) => res.json(publicUser(req.user));
const getUsuarioId = (req) => req.user.id;

const getDashboardResumo = async (req, res) => {
  const usuarioId = getUsuarioId(req);
  try {
    const [financeiro, statusObras, funcs, equips, listaObras] = await Promise.all([
      db.query('SELECT COALESCE(SUM(receitas), 0) AS receitas, COALESCE(SUM(despesas), 0) AS despesas FROM obras WHERE usuario_id = $1', [usuarioId]),
      db.query("SELECT COUNT(*) FILTER (WHERE status = 'Em Andamento') AS em_andamento, COUNT(*) FILTER (WHERE status = 'Finalizada') AS finalizadas FROM obras WHERE usuario_id = $1", [usuarioId]),
      db.query('SELECT COUNT(f.id) AS total FROM funcionarios f JOIN obras o ON f.obra_id = o.id WHERE o.usuario_id = $1', [usuarioId]),
      db.query('SELECT COUNT(f.id) AS total FROM frota f LEFT JOIN obras o ON f.obra_id = o.id LEFT JOIN sedes s ON f.sede_id = s.id WHERE o.usuario_id = $1 OR s.usuario_id = $1', [usuarioId]),
      db.query('SELECT id, nome, status, receitas, despesas, (receitas - despesas) AS lucro FROM obras WHERE usuario_id = $1 ORDER BY id DESC', [usuarioId])
    ]);
    return res.json({
      despesas: financeiro.rows[0].despesas,
      receitas: financeiro.rows[0].receitas,
      obras_andamento: statusObras.rows[0].em_andamento,
      obras_finalizadas: statusObras.rows[0].finalizadas,
      funcionarios: funcs.rows[0].total,
      equipamentos: equips.rows[0].total,
      lista_obras: listaObras.rows
    });
  } catch (error) {
    return handleDatabaseError(res, error, 'Erro no dashboard');
  }
};

const getObras = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM obras WHERE usuario_id = $1 ORDER BY id DESC', [getUsuarioId(req)]);
    return res.json(rows);
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao listar obras'); }
};

const criarObra = async (req, res) => {
  const { nome, receitas = 0, despesas = 0, status = 'Em Andamento' } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO obras (nome, receitas, despesas, status, usuario_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [nome, receitas, despesas, status, getUsuarioId(req)]
    );
    return res.status(201).json({ id: rows[0].id });
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao cadastrar obra'); }
};

const editarObra = async (req, res) => {
  const { nome, receitas = 0, despesas = 0, status = 'Em Andamento' } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE obras SET nome=$1, receitas=$2, despesas=$3, status=$4 WHERE id=$5 AND usuario_id=$6 RETURNING id',
      [nome, receitas, despesas, status, req.params.id, getUsuarioId(req)]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Obra nÃ£o encontrada.' });
    return res.json({ id: rows[0].id, nome, receitas, despesas, status });
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao editar obra'); }
};

const deletarObra = async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM obras WHERE id=$1 AND usuario_id=$2', [req.params.id, getUsuarioId(req)]);
    if (!rowCount) return res.status(404).json({ error: 'Obra nÃ£o encontrada.' });
    return res.json({ message: 'Obra excluÃ­da.' });
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao excluir obra'); }
};

const getFuncionarios = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT f.*, o.nome AS obra_nome, o.status AS obra_status FROM funcionarios f JOIN obras o ON f.obra_id=o.id WHERE o.usuario_id=$1 ORDER BY f.id DESC',
      [getUsuarioId(req)]
    );
    return res.json(rows);
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao listar funcionÃ¡rios'); }
};

const criarFuncionario = async (req, res) => {
  const { nome, cargo, departamento, horas, salario, status, obra_id: obraId } = req.body;
  try {
    if (!await ownsDestination(getUsuarioId(req), obraId, null)) return res.status(403).json({ error: 'Obra invÃ¡lida.' });
    const { rows } = await db.query(
      'INSERT INTO funcionarios (nome,cargo,departamento,horas,salario,status,obra_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [nome, cargo, departamento, horas, salario, status, obraId]
    );
    return res.status(201).json({ id: rows[0].id });
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao salvar funcionÃ¡rio'); }
};

const editarFuncionario = async (req, res) => {
  const { nome, cargo, departamento, horas, salario, status, obra_id: obraId } = req.body;
  const userId = getUsuarioId(req);
  try {
    if (!await ownsDestination(userId, obraId, null)) return res.status(403).json({ error: 'Obra invÃ¡lida.' });
    const { rows } = await db.query(
      `UPDATE funcionarios f SET nome=$1,cargo=$2,departamento=$3,horas=$4,salario=$5,status=$6,obra_id=$7
       WHERE f.id=$8 AND EXISTS (SELECT 1 FROM obras o WHERE o.id=f.obra_id AND o.usuario_id=$9) RETURNING f.id`,
      [nome, cargo, departamento, horas, salario, status, obraId, req.params.id, userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'FuncionÃ¡rio nÃ£o encontrado.' });
    return res.json({ id: rows[0].id });
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao atualizar funcionÃ¡rio'); }
};

const deletarFuncionario = async (req, res) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM funcionarios f USING obras o WHERE f.obra_id=o.id AND f.id=$1 AND o.usuario_id=$2',
      [req.params.id, getUsuarioId(req)]
    );
    if (!rowCount) return res.status(404).json({ error: 'FuncionÃ¡rio nÃ£o encontrado.' });
    return res.json({ message: 'FuncionÃ¡rio removido.' });
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao excluir funcionÃ¡rio'); }
};

const getSuprimentos = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT sp.*, o.nome AS obra_nome, sd.nome AS sede_nome FROM suprimentos sp
       LEFT JOIN obras o ON sp.obra_id=o.id LEFT JOIN sedes sd ON sp.sede_id=sd.id
       WHERE o.usuario_id=$1 OR sd.usuario_id=$1 ORDER BY sp.id DESC`,
      [getUsuarioId(req)]
    );
    return res.json({ itens: rows, notificacoes: [] });
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao listar suprimentos'); }
};

async function saveOwnedAsset(req, res, table) {
  const { nome, obra_id: obraId, sede_id: sedeId } = req.body;
  const userId = getUsuarioId(req);
  if (!await ownsDestination(userId, obraId, sedeId)) return res.status(403).json({ error: 'Destino invÃ¡lido.' });

  if (table === 'suprimentos') {
    const { categoria, qtd, preco, fornecedor, status } = req.body;
    const params = [nome, categoria, qtd, preco, fornecedor, status, obraId, sedeId];
    if (req.params.id) {
      const { rows } = await db.query(
        `UPDATE suprimentos sp SET nome=$1,categoria=$2,qtd=$3,preco=$4,fornecedor=$5,status=$6,obra_id=$7,sede_id=$8
         WHERE sp.id=$9 AND (EXISTS (SELECT 1 FROM obras o WHERE o.id=sp.obra_id AND o.usuario_id=$10)
           OR EXISTS (SELECT 1 FROM sedes sd WHERE sd.id=sp.sede_id AND sd.usuario_id=$10)) RETURNING sp.id`,
        [...params, req.params.id, userId]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Suprimento nÃ£o encontrado.' });
      return res.json({ id: rows[0].id, message: 'Material atualizado.' });
    }
    const { rows } = await db.query(
      'INSERT INTO suprimentos (nome,categoria,qtd,preco,fornecedor,status,obra_id,sede_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id', params
    );
    return res.status(201).json({ id: rows[0].id });
  }

  const { tipo, codigo, operador, manutencao, status } = req.body;
  const params = [nome, tipo, codigo, operador, manutencao, status, obraId, sedeId];
  if (req.params.id) {
    const { rows } = await db.query(
      `UPDATE frota f SET nome=$1,tipo=$2,codigo=$3,operador=$4,manutencao=$5,status=$6,obra_id=$7,sede_id=$8
       WHERE f.id=$9 AND (EXISTS (SELECT 1 FROM obras o WHERE o.id=f.obra_id AND o.usuario_id=$10)
         OR EXISTS (SELECT 1 FROM sedes sd WHERE sd.id=f.sede_id AND sd.usuario_id=$10)) RETURNING f.id`,
      [...params, req.params.id, userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Item da frota nÃ£o encontrado.' });
    return res.json({ id: rows[0].id });
  }
  const { rows } = await db.query(
    'INSERT INTO frota (nome,tipo,codigo,operador,manutencao,status,obra_id,sede_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id', params
  );
  return res.status(201).json({ id: rows[0].id });
}

const criarSuprimento = async (req, res) => {
  try { return await saveOwnedAsset(req, res, 'suprimentos'); }
  catch (error) { return handleDatabaseError(res, error, 'Erro ao criar suprimento'); }
};
const editarSuprimento = async (req, res) => {
  try { return await saveOwnedAsset(req, res, 'suprimentos'); }
  catch (error) { return handleDatabaseError(res, error, 'Erro ao editar suprimento'); }
};

async function deleteOwnedAsset(req, res, table, label) {
  const alias = table === 'frota' ? 'f' : 'sp';
  const { rowCount } = await db.query(
    `DELETE FROM ${table} ${alias} WHERE ${alias}.id=$1 AND (
       EXISTS (SELECT 1 FROM obras o WHERE o.id=${alias}.obra_id AND o.usuario_id=$2)
       OR EXISTS (SELECT 1 FROM sedes sd WHERE sd.id=${alias}.sede_id AND sd.usuario_id=$2))`,
    [req.params.id, getUsuarioId(req)]
  );
  if (!rowCount) return res.status(404).json({ error: `${label} nÃ£o encontrado.` });
  return res.json({ message: `${label} removido.` });
}

const deletarSuprimento = async (req, res) => {
  try { return await deleteOwnedAsset(req, res, 'suprimentos', 'Suprimento'); }
  catch (error) { return handleDatabaseError(res, error, 'Erro ao excluir suprimento'); }
};

const getSedes = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM sedes WHERE usuario_id=$1 ORDER BY id DESC', [getUsuarioId(req)]);
    return res.json(rows);
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao listar sedes'); }
};

const criarSede = async (req, res) => {
  try {
    const { rows } = await db.query('INSERT INTO sedes (nome,usuario_id) VALUES ($1,$2) RETURNING id', [req.body.nome, getUsuarioId(req)]);
    return res.status(201).json({ id: rows[0].id });
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao criar sede'); }
};

const getFrota = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT f.*, o.nome AS obra_nome, s.nome AS sede_nome FROM frota f
       LEFT JOIN obras o ON f.obra_id=o.id LEFT JOIN sedes s ON f.sede_id=s.id
       WHERE o.usuario_id=$1 OR s.usuario_id=$1 ORDER BY f.id DESC`,
      [getUsuarioId(req)]
    );
    return res.json(rows);
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao listar frota'); }
};

const criarFrota = async (req, res) => {
  try { return await saveOwnedAsset(req, res, 'frota'); }
  catch (error) { return handleDatabaseError(res, error, 'Erro ao criar item da frota'); }
};
const editarFrota = async (req, res) => {
  try { return await saveOwnedAsset(req, res, 'frota'); }
  catch (error) { return handleDatabaseError(res, error, 'Erro ao editar item da frota'); }
};
const deletarFrota = async (req, res) => {
  try { return await deleteOwnedAsset(req, res, 'frota', 'Item da frota'); }
  catch (error) { return handleDatabaseError(res, error, 'Erro ao excluir item da frota'); }
};

const getCronograma = async (req, res) => {
  try {
    const params = [getUsuarioId(req)];
    const filter = req.query.obra_id ? ' AND c.obra_id=$2' : '';
    if (req.query.obra_id) params.push(req.query.obra_id);
    const { rows } = await db.query(
      `SELECT c.* FROM cronograma c JOIN obras o ON c.obra_id=o.id WHERE o.usuario_id=$1${filter} ORDER BY c.ordem ASC`, params
    );
    return res.json(rows);
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao listar cronograma'); }
};

const criarCronograma = async (req, res) => {
  const { fase, descricao, prazo, status, ordem, obra_id: obraId } = req.body;
  try {
    if (!await ownsDestination(getUsuarioId(req), obraId, null)) return res.status(403).json({ error: 'Obra invÃ¡lida.' });
    const { rows } = await db.query(
      'INSERT INTO cronograma (fase,descricao,prazo,status,ordem,obra_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [fase, descricao, prazo, status, ordem, obraId]
    );
    return res.status(201).json({ id: rows[0].id });
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao criar etapa'); }
};

const atualizarStatusCronograma = async (req, res) => {
  try {
    const { rowCount } = await db.query(
      `UPDATE cronograma c SET status=$1 WHERE c.id=$2 AND EXISTS (
         SELECT 1 FROM obras o WHERE o.id=c.obra_id AND o.usuario_id=$3)`,
      [req.body.status, req.params.id, getUsuarioId(req)]
    );
    if (!rowCount) return res.status(404).json({ error: 'Etapa nÃ£o encontrada.' });
    return res.json({ message: 'Status atualizado.' });
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao atualizar etapa'); }
};

const deletarCronograma = async (req, res) => {
  try {
    const { rowCount } = await db.query(
      `DELETE FROM cronograma c WHERE c.id=$1 AND EXISTS (
         SELECT 1 FROM obras o WHERE o.id=c.obra_id AND o.usuario_id=$2)`,
      [req.params.id, getUsuarioId(req)]
    );
    if (!rowCount) return res.status(404).json({ error: 'Etapa nÃ£o encontrada.' });
    return res.json({ message: 'Etapa removida.' });
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao excluir etapa'); }
};

const listarUsuariosAdmin = async (_req, res) => {
  try {
    const { rows } = await db.query('SELECT id,nome,email,nivel,status,permissoes,must_change_password,temporary_password_expires_at FROM usuarios ORDER BY id DESC');
    return res.json(rows.map((user) => publicUser(user)));
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao listar usuÃ¡rios'); }
};

const criarUsuarioEmpresa = async (req, res) => {
  const { nome, email, senha, nivel = 'empresa', status = 'ativo', permissoes = [] } = req.body;
  try {
    const senhaHash = await bcrypt.hash(senha, 12);
    await db.query(
      'INSERT INTO usuarios (nome,email,senha,nivel,status,permissoes) VALUES ($1,$2,$3,$4,$5,$6)',
      [nome, email, senhaHash, nivel, status, JSON.stringify(permissoes)]
    );
    return res.status(201).json({ message: 'UsuÃ¡rio cadastrado.' });
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao criar usuÃ¡rio', 'Este e-mail jÃ¡ estÃ¡ registrado.'); }
};

const atualizarAcessoUsuario = async (req, res) => {
  const targetId = Number(req.params.id);
  const { nivel, status, permissoes } = req.body;
  const targetResult = await db.query('SELECT nivel FROM usuarios WHERE id = $1 LIMIT 1', [targetId]);
  const target = targetResult.rows[0];
  if (!target) return res.status(404).json({ error: 'Usuario nao encontrado.' });
  if (req.user.nivel !== 'superadmin' && (target.nivel === 'superadmin' || nivel === 'superadmin')) {
    return res.status(403).json({ error: 'Somente um SuperAdmin pode alterar este perfil.' });
  }
  const ownRequiredLevel = req.user.nivel === 'administrador' ? 'admin' : req.user.nivel;
  if (targetId === req.user.id && (nivel !== ownRequiredLevel || status !== 'ativo')) {
    return res.status(400).json({ error: 'VocÃª nÃ£o pode remover o prÃ³prio acesso administrativo.' });
  }
  try {
    const { rowCount } = await db.query(
      'UPDATE usuarios SET nivel=$1,status=$2,permissoes=$3 WHERE id=$4',
      [nivel, status, JSON.stringify(permissoes), targetId]
    );
    if (!rowCount) return res.status(404).json({ error: 'UsuÃ¡rio nÃ£o encontrado.' });
    return res.json({ message: 'Acessos atualizados.' });
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao atualizar acessos'); }
};

const excluirUsuario = async (req, res) => {
  const targetId = Number(req.params.id);
  const targetResult = await db.query('SELECT nivel FROM usuarios WHERE id = $1 LIMIT 1', [targetId]);
  const target = targetResult.rows[0];
  if (!target) return res.status(404).json({ error: 'Usuario nao encontrado.' });
  if (target.nivel === 'superadmin' && req.user.nivel !== 'superadmin') {
    return res.status(403).json({ error: 'Somente um SuperAdmin pode excluir este perfil.' });
  }
  if (targetId === req.user.id) return res.status(400).json({ error: 'VocÃª nÃ£o pode excluir a prÃ³pria conta.' });
  try {
    const { rowCount } = await db.query('DELETE FROM usuarios WHERE id=$1', [targetId]);
    if (!rowCount) return res.status(404).json({ error: 'UsuÃ¡rio nÃ£o encontrado.' });
    return res.json({ message: 'UsuÃ¡rio removido.' });
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao excluir usuÃ¡rio'); }
};

const getObrasAdmin = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM obras WHERE usuario_id=$1 ORDER BY id DESC', [req.params.id]);
    return res.json(rows);
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao listar obras da empresa'); }
};

const getSedesAdmin = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM sedes WHERE usuario_id=$1 ORDER BY id DESC', [req.params.id]);
    return res.json(rows);
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao listar sedes da empresa'); }
};

async function targetUserExists(userId) {
  const { rowCount } = await db.query('SELECT 1 FROM usuarios WHERE id=$1', [userId]);
  return rowCount > 0;
}

const popularObraAdmin = async (req, res) => {
  const { usuario_id: userId, nome, receitas = 0, despesas = 0, status = 'Em Andamento' } = req.body;
  try {
    if (!await targetUserExists(userId)) return res.status(404).json({ error: 'UsuÃ¡rio alvo nÃ£o encontrado.' });
    const { rows } = await db.query(
      'INSERT INTO obras (nome,receitas,despesas,status,usuario_id) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [nome, receitas || 0, despesas || 0, status, userId]
    );
    return res.status(201).json({ id: rows[0].id });
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao criar obra para empresa'); }
};

const popularSedeAdmin = async (req, res) => {
  const { usuario_id: userId, nome } = req.body;
  try {
    if (!await targetUserExists(userId)) return res.status(404).json({ error: 'UsuÃ¡rio alvo nÃ£o encontrado.' });
    const { rows } = await db.query('INSERT INTO sedes (nome,usuario_id) VALUES ($1,$2) RETURNING id', [nome, userId]);
    return res.status(201).json({ id: rows[0].id });
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao criar sede para empresa'); }
};

const popularFuncionarioAdmin = async (req, res) => {
  const { usuario_id: userId, obra_id: obraId, nome, cargo, salario, status = 'Ativo' } = req.body;
  try {
    if (!await ownsDestination(userId, obraId, null)) return res.status(403).json({ error: 'Obra nÃ£o pertence ao usuÃ¡rio alvo.' });
    const { rows } = await db.query(
      `INSERT INTO funcionarios (obra_id,nome,cargo,departamento,horas,salario,status)
       VALUES ($1,$2,$3,'OperaÃ§Ãµes','176h',$4,$5) RETURNING id`,
      [obraId, nome, cargo, salario, status]
    );
    return res.status(201).json({ id: rows[0].id });
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao criar funcionÃ¡rio para empresa'); }
};

const popularSuprimentoAdmin = async (req, res) => {
  const { usuario_id: userId, obra_id: obraId, sede_id: sedeId, nome, qtd, preco } = req.body;
  try {
    if (!await ownsDestination(userId, obraId, sedeId)) return res.status(403).json({ error: 'Destino nÃ£o pertence ao usuÃ¡rio alvo.' });
    const { rows } = await db.query(
      `INSERT INTO suprimentos (obra_id,sede_id,nome,categoria,qtd,preco,fornecedor,status)
       VALUES ($1,$2,$3,'Outros',$4,$5,'NÃ£o informado','DisponÃ­vel') RETURNING id`,
      [obraId, sedeId, nome, qtd, preco]
    );
    return res.status(201).json({ id: rows[0].id });
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao criar suprimento para empresa'); }
};

const popularFrotaAdmin = async (req, res) => {
  const { usuario_id: userId, obra_id: obraId, sede_id: sedeId, nome, tipo, codigo, status = 'DisponÃ­vel' } = req.body;
  try {
    if (!await ownsDestination(userId, obraId, sedeId)) return res.status(403).json({ error: 'Destino nÃ£o pertence ao usuÃ¡rio alvo.' });
    const { rows } = await db.query(
      `INSERT INTO frota (obra_id,sede_id,nome,tipo,codigo,status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [obraId, sedeId, nome, tipo, codigo, status]
    );
    return res.status(201).json({ id: rows[0].id });
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao criar frota para empresa'); }
};

const popularCronogramaAdmin = async (req, res) => {
  const { usuario_id: userId, obra_id: obraId, fase, prazo } = req.body;
  try {
    if (!await ownsDestination(userId, obraId, null)) return res.status(403).json({ error: 'Obra nÃ£o pertence ao usuÃ¡rio alvo.' });
    const { rows } = await db.query(
      `INSERT INTO cronograma (obra_id,fase,descricao,prazo,status,ordem)
       VALUES ($1,$2,$2,$3,'Pendente',10) RETURNING id`,
      [obraId, fase, prazo]
    );
    return res.status(201).json({ id: rows[0].id });
  } catch (error) { return handleDatabaseError(res, error, 'Erro ao criar cronograma para empresa'); }
};

const listPasswordResetRequests = async (_req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.id, r.contact_type, r.contact_value, r.status, r.requested_at,
              u.id AS usuario_id, u.nome, u.email
       FROM password_reset_requests r
       JOIN usuarios u ON u.id = r.usuario_id
       WHERE r.status = 'pending'
       ORDER BY r.requested_at ASC`
    );
    return res.json(rows);
  } catch (error) {
    return handleDatabaseError(res, error, 'Erro ao listar solicitacoes de recuperacao');
  }
};

const resolvePasswordResetRequest = async (req, res) => {
  let client;
  try {
    client = await db.connect();
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT r.id, r.usuario_id, r.contact_type, r.contact_value, u.nome, u.email
       FROM password_reset_requests r
       JOIN usuarios u ON u.id = r.usuario_id
       WHERE r.id = $1 AND r.status = 'pending'
       FOR UPDATE`,
      [req.params.id]
    );
    const request = rows[0];
    if (!request) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Solicitacao pendente nao encontrada.' });
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    await client.query(
      "UPDATE usuarios SET senha = $1, must_change_password = true, temporary_password_expires_at = now() + interval '24 hours', session_version = session_version + 1 WHERE id = $2",
      [passwordHash, request.usuario_id]
    );
    await client.query(
      `UPDATE password_reset_requests
       SET status = 'completed', processed_at = now(), processed_by = $1, verification_note = $2
       WHERE id = $3`,
      [req.user.id, req.body.verificationNote, request.id]
    );
    await client.query('DELETE FROM password_reset_tokens WHERE usuario_id = $1', [request.usuario_id]);
    await client.query('COMMIT');

    return res.json({
      requestId: request.id,
      temporaryPassword,
      contactType: request.contact_type,
      contact: request.contact_value,
      user: { id: request.usuario_id, nome: request.nome, email: request.email }
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    return handleDatabaseError(res, error, 'Erro ao gerar senha temporaria');
  } finally {
    client?.release();
  }
};

const rejectPasswordResetRequest = async (req, res) => {
  try {
    const { rowCount } = await db.query(
      `UPDATE password_reset_requests
       SET status = 'rejected', processed_at = now(), processed_by = $1, rejection_reason = $2
       WHERE id = $3 AND status = 'pending'`,
      [req.user.id, req.body.reason || null, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Solicitacao pendente nao encontrada.' });
    return res.json({ message: 'Solicitacao rejeitada.' });
  } catch (error) {
    return handleDatabaseError(res, error, 'Erro ao rejeitar solicitacao de recuperacao');
  }
};

const changeTemporaryPassword = async (req, res) => {
  if (req.user.must_change_password !== true) {
    return res.status(409).json({ error: 'A conta nao possui troca de senha pendente.' });
  }
  try {
    const current = await db.query('SELECT senha FROM usuarios WHERE id = $1', [req.user.id]);
    const reused = await bcrypt.compare(req.body.novaSenha, current.rows[0].senha).catch(() => false);
    if (reused) {
      return res.status(400).json({ error: 'A nova senha deve ser diferente da senha temporaria.' });
    }

    const passwordHash = await bcrypt.hash(req.body.novaSenha, 12);
    const { rows } = await db.query(
      `UPDATE usuarios
       SET senha = $1, must_change_password = false, temporary_password_expires_at = NULL, session_version = session_version + 1
       WHERE id = $2
       RETURNING id, nome, email, nivel, status, permissoes, must_change_password, temporary_password_expires_at, session_version`,
      [passwordHash, req.user.id]
    );
    await db.query('DELETE FROM password_reset_tokens WHERE usuario_id = $1', [req.user.id]);
    return res.json(publicUser(rows[0], signUserToken(req.user.id, rows[0].session_version)));
  } catch (error) {
    return handleDatabaseError(res, error, 'Erro ao trocar senha temporaria');
  }
};

module.exports = {
  requestPasswordReset,
  listPasswordResetRequests,
  resolvePasswordResetRequest,
  rejectPasswordResetRequest,
  changeTemporaryPassword,
  registrarUsuarioTeste,
  forgotPassword,
  login,
  resetPassword,
  googleLogin,
  getSession,
  getDashboardResumo,
  getObras,
  criarObra,
  editarObra,
  deletarObra,
  getFuncionarios,
  criarFuncionario,
  editarFuncionario,
  deletarFuncionario,
  getSuprimentos,
  criarSuprimento,
  editarSuprimento,
  deletarSuprimento,
  getSedes,
  criarSede,
  getFrota,
  criarFrota,
  editarFrota,
  deletarFrota,
  getCronograma,
  criarCronograma,
  atualizarStatusCronograma,
  deletarCronograma,
  listarUsuariosAdmin,
  criarUsuarioEmpresa,
  atualizarAcessoUsuario,
  excluirUsuario,
  getObrasAdmin,
  getSedesAdmin,
  popularObraAdmin,
  popularSedeAdmin,
  popularFuncionarioAdmin,
  popularSuprimentoAdmin,
  popularFrotaAdmin,
  popularCronogramaAdmin
};
