const jwt = require('jsonwebtoken');
const db = require('../config/db');

const TOKEN_ISSUER = 'houzen-api';
const TOKEN_AUDIENCE = 'houzen-web';
const ADMIN_LEVELS = new Set(['admin', 'administrador', 'superadmin']);

function normalizePermissions(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function signUserToken(userId, sessionVersion = 0) {
  return jwt.sign(
    { sv: Number(sessionVersion) },
    process.env.JWT_SECRET,
    {
      algorithm: 'HS256',
      subject: String(userId),
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    }
  );
}

async function requireAuth(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ error: 'AutenticaÃ§Ã£o obrigatÃ³ria.' });
  }

  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE
    });

    if (!/^\d+$/.test(payload.sub || '')) {
      return res.status(401).json({ error: 'SessÃ£o invÃ¡lida.' });
    }

    const { rows } = await db.query(
      'SELECT id, nome, email, nivel, status, permissoes, must_change_password, temporary_password_expires_at, session_version, theme_preference, account_status_reason FROM usuarios WHERE id = $1 LIMIT 1',
      [payload.sub]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'SessÃ£o invÃ¡lida.' });
    }

    if (String(user.status || '').toLowerCase().trim() !== 'ativo') {
      return res.status(403).json({
        error: user.account_status_reason || 'Conta suspensa. Entre em contato com o suporte.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    if (!Number.isInteger(payload.sv) || payload.sv !== user.session_version) {
      return res.status(401).json({ error: 'Sessao revogada. Entre novamente.' });
    }

    req.user = {
      ...user,
      nivel: String(user.nivel || 'comum').toLowerCase().trim(),
      permissoes: normalizePermissions(user.permissoes)
    };
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'SessÃ£o invÃ¡lida ou expirada.' });
    }
    return next(error);
  }
}

function requireAdmin(req, res, next) {
  if (!ADMIN_LEVELS.has(req.user?.nivel)) {
    return res.status(403).json({ error: 'PermissÃ£o de administrador obrigatÃ³ria.' });
  }
  return next();
}

function requireAnyModulePermission(...moduleIds) {
  return (req, res, next) => {
    if (ADMIN_LEVELS.has(req.user?.nivel)) return next();
    const permissions = Array.isArray(req.user?.permissoes) ? req.user.permissoes : [];
    if (moduleIds.some((moduleId) => permissions.includes(moduleId))) return next();
    return res.status(403).json({
      error: 'Este módulo não está liberado para sua conta.',
      code: 'MODULE_ACCESS_DENIED',
      requiredPermissions: moduleIds
    });
  };
}

function requireSuperAdmin(req, res, next) {
  if (req.user?.nivel !== 'superadmin') {
    return res.status(403).json({ error: 'Permissao de SuperAdmin obrigatoria.' });
  }
  return next();
}

function requirePasswordChangeCompleted(req, res, next) {
  if (req.user?.must_change_password === true) {
    return res.status(403).json({
      error: 'Troque a senha temporaria antes de acessar o sistema.',
      code: 'PASSWORD_CHANGE_REQUIRED'
    });
  }
  return next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireSuperAdmin,
  requirePasswordChangeCompleted,
  requireAnyModulePermission,
  signUserToken,
  normalizePermissions
};
