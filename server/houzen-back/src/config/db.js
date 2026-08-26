const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL nÃ£o configurada.');
}

const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false';
const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, '\n');

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized,
    ...(ca ? { ca } : {})
  },
  max: Number(process.env.DATABASE_POOL_MAX || 5),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

db.on('error', (error) => {
  console.error('Erro inesperado no pool de conexÃµes do Postgres:', error.message);
});

async function checkDatabaseConnection() {
  await db.query('SELECT 1');
}

module.exports = db;
module.exports.checkDatabaseConnection = checkDatabaseConnection;
