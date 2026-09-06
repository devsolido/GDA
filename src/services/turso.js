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

async function deleteValue(key) {
  const database = await ensureSchema();
  await database.execute({
    sql: 'DELETE FROM gda_sync_data WHERE key = ?',
    args: [key]
  });
}

async function ensureNotasSchema() {
  const database = getClient();
  if (!database) throw new Error('Turso não configurado');
  await database.execute(`
    CREATE TABLE IF NOT EXISTS gda_notas (
      codigo TEXT PRIMARY KEY NOT NULL,
      b1 TEXT NOT NULL DEFAULT '',
      b2 TEXT NOT NULL DEFAULT '',
      b3 TEXT NOT NULL DEFAULT '',
      b4 TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    )
  `);
  return database;
}

async function getNotas() {
  const database = await ensureNotasSchema();
  const result = await database.execute('SELECT codigo, b1, b2, b3, b4 FROM gda_notas');
  if (result.rows.length) {
    return Object.fromEntries(result.rows.map((row) => [row.codigo, {
      b1: row.b1,
      b2: row.b2,
      b3: row.b3,
      b4: row.b4
    }]));
  }

  const legacyNotas = await getValue('gda_notas');
  if (!legacyNotas || typeof legacyNotas !== 'object') return {};
  await setNotas(legacyNotas);
  await deleteValue('gda_notas');
  return legacyNotas;
}

async function setNotas(notas) {
  const database = await ensureNotasSchema();
  const entries = Object.entries(notas || {});
  await database.batch([
    { sql: 'DELETE FROM gda_notas', args: [] },
    ...entries.map(([codigo, nota]) => ({
      sql: `
        INSERT INTO gda_notas (codigo, b1, b2, b3, b4, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [codigo, nota.b1 || '', nota.b2 || '', nota.b3 || '', nota.b4 || '', new Date().toISOString()]
    }))
  ], 'write');
}

async function checkConnection() {
  const database = await ensureSchema();
  await database.execute('SELECT 1');
  return true;
}

module.exports = { checkConnection, getValue, setValue, deleteValue, getNotas, setNotas };
