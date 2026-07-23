const { Pool } = require("pg");

// Accept either a single DATABASE_URL or discrete DB_* vars.
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || "taskuser",
        password: process.env.DB_PASSWORD || "taskpass",
        database: process.env.DB_NAME || "tasksdb",
      }
);

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id         SERIAL PRIMARY KEY,
      title      TEXT NOT NULL,
      priority   TEXT NOT NULL DEFAULT 'medium',
      done       BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

module.exports = { pool, initDb };
