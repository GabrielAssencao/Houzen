require('dotenv').config();

const db = require('../src/config/db');

const expectedTables = [
  'cronograma',
  'frota',
  'funcionarios',
  'obras',
  'password_reset_tokens',
  'sedes',
  'suprimentos',
  'usuarios'
];

const databaseHost = new URL(process.env.DATABASE_URL).hostname;
const connectionMode = databaseHost.startsWith('db.')
  ? 'direct'
  : databaseHost.includes('pooler.supabase.com')
    ? 'pooler'
    : 'other';

async function check() {
  try {
    const { rows } = await db.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       ORDER BY table_name`
    );
    const tables = rows.map((row) => row.table_name);
    const missing = expectedTables.filter((table) => !tables.includes(table));
    console.log(JSON.stringify({ connected: true, connectionMode, tables, missing }, null, 2));
    process.exitCode = missing.length === 0 ? 0 : 2;
  } catch (error) {
    console.error(JSON.stringify({ connected: false, connectionMode, code: error.code, message: error.message }));
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

check();
