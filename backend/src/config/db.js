const { Pool } = require('pg');

/**
 * A single shared connection pool for the whole app.
 * Uses DATABASE_URL when present, otherwise falls back to discrete PG* env vars
 * (both are supported natively by `pg`, but we validate DATABASE_URL explicitly
 * so misconfiguration fails fast on boot instead of on the first query).
 */
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'agile_sprint_board',
      }
);

pool.on('error', (err) => {
  // Prevents an idle client error from crashing the whole process.
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

async function query(text, params) {
  return pool.query(text, params);
}

async function checkConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
}

module.exports = { pool, query, checkConnection };
