// src/middleware/ipFilter.js
//
// Bloqueio por IP simples via variável de ambiente. 
//
// Uso no .env (opcional, deixe vazio se não quiser usar):
//   BLOCKED_IPS=1.2.3.4,5.6.7.8
//
// Se algum dia você quiser trocar pra allowlist (só esses IPs podem acessar),
// troque a lógica pra usar ALLOWED_IPS e inverter a condição
 
const blockedIps = (process.env.BLOCKED_IPS || '')
  .split(',')
  .map((ip) => ip.trim())
  .filter(Boolean);
 
function ipFilter(req, res, next) {
  if (blockedIps.length === 0) return next();
 
  // Com "trust proxy" configurado no index.js, req.ip já vem correto
  // mesmo atrás do proxy do Render.
  const clientIp = req.ip;
 
  if (blockedIps.includes(clientIp)) {
    return res.status(403).json({ error: 'Acesso negado.' });
  }
 
  next();
}
 
module.exports = ipFilter;