const jwt = require('jsonwebtoken');
const db = require('../config/db');

const TOKEN_ISSUER = 'houzen-api';
const TOKEN_AUDIENCE = 'houzen-web';

function normalizePermissions(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function signUserToken(userId) {
  return jwt.sign(
    {},
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
      'SELECT id, nome, email, nivel, status, permissoes FROM usuarios WHERE id = $1 LIMIT 1',
      [payload.sub]
    );
    const user = rows[0];
    if (!user || String(user.status || '').toLowerCase().trim() !== 'ativo') {
      return res.status(401).json({ error: 'SessÃ£o invÃ¡lida ou conta inativa.' });
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
  if (req.user?.nivel !== 'admin' && req.user?.nivel !== 'administrador') {
    return res.status(403).json({ error: 'PermissÃ£o de administrador obrigatÃ³ria.' });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin, signUserToken, normalizePermissions };

