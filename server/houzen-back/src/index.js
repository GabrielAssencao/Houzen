require('dotenv').config();

const cors = require('cors');
const express = require('express');
const helmet = require('helmet');

const db = require('./config/db');
const ipFilter = require('./middleware/ipFilter');
const { generalLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/authRoutes');

const app = express();
const port = Number(process.env.PORT || 3001);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET deve estar configurado com pelo menos 32 caracteres.');
}

const configuredOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = new Set(configuredOrigins);
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://127.0.0.1:5173');
}

app.disable('x-powered-by');
app.set('trust proxy', Number(process.env.TRUST_PROXY || 1));
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin.replace(/\/+$/, ''))) {
      return callback(null, true);
    }
    return callback(new Error('Origem nÃ£o permitida pelo CORS.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));
app.use(express.json({ limit: '100kb' }));
app.use(ipFilter);
app.use(generalLimiter);

app.get('/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (_error) {
    res.status(503).json({ status: 'unavailable' });
  }
});

app.use('/api/auth', authRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Rota nÃ£o encontrada.' });
});

app.use((error, _req, res, _next) => {
  if (error.message === 'Origem nÃ£o permitida pelo CORS.') {
    return res.status(403).json({ error: error.message });
  }
  console.error('Erro nÃ£o tratado:', error);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
});

let server;

async function start() {
  await db.checkDatabaseConnection();
  console.log('ConexÃ£o com o Supabase estabelecida com sucesso.');
  server = app.listen(port, () => {
    console.log(`API Houzen ouvindo na porta ${port}.`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} recebido. Encerrando a API.`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await db.end();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch(async (error) => {
  console.error('Falha ao iniciar a API:', error.message);
  await db.end();
  process.exit(1);
});

module.exports = app;
