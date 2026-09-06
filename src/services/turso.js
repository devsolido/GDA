const { createClient } = require('@libsql/client');
const config = require('../config');

let client;
let schemaPromise;

function getClient() {
  if (!config.dbUrl || !config.dbToken) return null;
  if (!client) {
    const url = config.dbUrl.replace(/^turso:\/\//, 'libsql://');
    client = createClient({ url, authToken: config.dbToken });
  }
  return client;
}

async function ensureSchema() {
  const database = getClient();
  if (!database) throw new Error('Turso não configurado');
  if (!schemaPromise) {
    schemaPromise = database.execute(`
      CREATE TABLE IF NOT EXISTS gda_sync_data (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `).catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
  return database;
}

async function getValue(key) {
  const database = await ensureSchema();
  const result = await database.execute({
    sql: 'SELECT value FROM gda_sync_data WHERE key = ?',
    args: [key]
  });
  if (!result.rows.length) return null;
  return JSON.parse(result.rows[0].value);
}

async function setValue(key, value) {
  const database = await ensureSchema();
  await database.execute({
    sql: `
      INSERT INTO gda_sync_data (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `,
    args: [key, JSON.stringify(value), new Date().toISOString()]
  });
}

async function checkConnection() {
  const database = await ensureSchema();
  await database.execute('SELECT 1');
  return true;
}

module.exports = { checkConnection, getValue, setValue };
