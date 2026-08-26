require('dotenv').config();

const db = require('../src/config/db');

const expectedTables = [
  'cronograma',
  'frota',
  'funcionarios',
  'obras',
  'password_reset_requests',
  'password_reset_tokens',
  'sedes',
  'suprimentos',
  'usuarios'
];

const expectedColumns = {
  usuarios: ['must_change_password', 'session_version', 'temporary_password_expires_at'],
  password_reset_requests: ['contact_type', 'contact_value', 'status', 'verification_note']
};

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
    const columnsResult = await db.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
      [Object.keys(expectedColumns)]
    );
    const availableColumns = new Set(columnsResult.rows.map((row) => `${row.table_name}.${row.column_name}`));
    const missingColumns = Object.entries(expectedColumns).flatMap(([table, columns]) => (
      columns
        .filter((column) => !availableColumns.has(`${table}.${column}`))
        .map((column) => `${table}.${column}`)
    ));
    console.log(JSON.stringify({ connected: true, connectionMode, tables, missing, missingColumns }, null, 2));
    process.exitCode = missing.length === 0 && missingColumns.length === 0 ? 0 : 2;
  } catch (error) {
    console.error(JSON.stringify({ connected: false, connectionMode, code: error.code, message: error.message }));
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

check();
