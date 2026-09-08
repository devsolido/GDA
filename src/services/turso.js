const { createClient } = require('@libsql/client');
const config = require('../config');

let client;
let schemaPromise;

const sectionKeys = [
  'gda_presencas_atrasadas', 'gda_ocorrencias', 'gda_presencas', 'gda_atividades',
  'gda_frequencias', 'gda_relatorios', 'gda_checklist', 'gda_historico_panico',
  'gda_atendimentos', 'gda_assuntos'
];
const mapSectionKeys = new Set(['gda_checklist', 'gda_assuntos']);

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

function getSectionTable(key) {
  if (!sectionKeys.includes(key)) throw new Error('Seção inválida');
  return key;
}

async function ensureSectionSchema(key) {
  const database = getClient();
  if (!database) throw new Error('Turso não configurado');
  const table = getSectionTable(key);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS ${table} (
      record_id TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      record_order INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    )
  `);
  return database;
}

function parseRows(key, rows) {
  if (mapSectionKeys.has(key)) {
    return Object.fromEntries(rows.map((row) => [row.record_id, JSON.parse(row.value)]));
  }
  return rows.map((row) => JSON.parse(row.value));
}

async function getSectionValue(key) {
  const database = await ensureSectionSchema(key);
  const result = await database.execute({
    sql: 'SELECT record_id, value FROM ' + getSectionTable(key) + ' ORDER BY record_order, record_id',
    args: []
  });
  if (result.rows.length) return parseRows(key, result.rows);

  const legacyValue = await getValue(key);
  if (legacyValue === null) return null;
  await setSectionValue(key, legacyValue, false);
  return legacyValue;
}

async function setSectionValue(key, value, keepLegacy = true) {
  const database = await ensureSectionSchema(key);
  const table = getSectionTable(key);
  const now = new Date().toISOString();
  const entries = mapSectionKeys.has(key)
    ? Object.entries(value || {})
    : (Array.isArray(value) ? value : []).map((item, index) => [String(item?.id || index + 1), item]);
  await database.batch([
    { sql: 'DELETE FROM ' + table, args: [] },
    ...entries.map(([recordId, recordValue], index) => ({
      sql: `INSERT INTO ${table} (record_id, value, record_order, updated_at) VALUES (?, ?, ?, ?)`,
      args: [String(recordId), JSON.stringify(recordValue), index, now]
    }))
  ], 'write');
  if (keepLegacy) await setValue(key, value);
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
  await Promise.all(sectionKeys.map((key) => ensureSectionSchema(key)));
  await ensureNotasSchema();
  await database.execute('SELECT 1');
  return true;
}

module.exports = {
  checkConnection, getValue, setValue, deleteValue, getSectionValue, setSectionValue,
  getNotas, setNotas
};
