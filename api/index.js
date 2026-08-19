// api/index.js
// Servidor completo para Vercel com conexão ao Turso

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const PDFDocument = require('pdfkit');
const path = require('path');
console.log("🔍 VARIÁVEIS CARREGADAS:");
console.log("  GDA_AUTH_USERNAME:", process.env.GDA_AUTH_USERNAME ? "✅ DEFINIDO" : "❌ INDEFINIDO");
console.log("  TURSO_URL:", process.env.TURSO_URL ? "✅ DEFINIDO" : "❌ INDEFINIDO");
console.log("  TURSO_TOKEN:", process.env.TURSO_TOKEN ? "✅ DEFINIDO" : "❌ INDEFINIDO");
console.log("  JWT_SECRET:", process.env.JWT_SECRET ? "✅ DEFINIDO" : "❌ INDEFINIDO");
const app = express();
const ROOT_DIR = path.resolve(__dirname, '..');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const DEFAULT_ALLOWED_ORIGINS = [
    'https://gda-kappa.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
];
const SENSITIVE_PATHS = [
    /^\/\.env(?:$|\/)/i,
    /^\/\.git(?:$|\/)/i,
    /^\/(?:package\.json|vercel\.json|\.htaccess|web\.config|config\.json|secrets\.json|credentials\.json|\.env\.local|\.env\.production|\.env\.development|\.env\.test)(?:$|\/)/i,
    /^\/(?:admin|administrator|login|wp-admin|cgi-bin|phpmyadmin|backup|config|server-status)(?:$|\/)/i
];

function sqlValue(value) {
    if (value === null || typeof value === 'undefined') {
        return 'NULL';
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    if (typeof value === 'string') {
        return `'${String(value).replace(/'/g, "''")}'`;
    }

    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
}

function isSensitivePath(requestPath) {
    if (!requestPath || requestPath === '/') {
        return false;
    }

    if (requestPath.includes('..')) {
        return true;
    }

    return SENSITIVE_PATHS.some((pattern) => pattern.test(requestPath));
}

function logSecurityEvent(event, details = {}) {
    console.warn(JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        ...details
    }));
}

function applySecurityHeaders(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('Cache-Control', 'no-store');
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
}

function getAllowedOrigins() {
    const configured = (process.env.CORS_ALLOWED_ORIGINS || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

    return configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;
}

function isAllowedOrigin(origin) {
    if (!origin) {
        return true;
    }

    const allowedOrigins = getAllowedOrigins();
    return allowedOrigins.includes(origin);
}

// ============================================================
// CONFIGURAÇÃO TURSO (usando variáveis de ambiente da Vercel)
// ============================================================
const TURSO_URL = process.env.TURSO_URL;
const TURSO_TOKEN = process.env.TURSO_TOKEN;

function getJwtSecret() {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres.');
    }
    return process.env.JWT_SECRET;
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function safeEqual(left, right) {
    const leftBuffer = Buffer.from(String(left || ''));
    const rightBuffer = Buffer.from(String(right || ''));
    return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

async function ensureSessionsTable() {
    await queryTurso(`
        CREATE TABLE IF NOT EXISTS gda_sessions (
            session_id TEXT PRIMARY KEY,
            token_hash TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            revoked_at TEXT
        )
    `);
}

async function storeSession(token, username, sessionId, expiresAt) {
    await ensureSessionsTable();
    await queryTurso(`
        INSERT INTO gda_sessions (session_id, token_hash, username, expires_at)
        VALUES (${sqlValue(sessionId)}, ${sqlValue(hashToken(token))}, ${sqlValue(username)}, ${sqlValue(expiresAt)})
    `);
}

async function isActiveSession(token, sessionId) {
    await ensureSessionsTable();
    const result = await queryTurso(`
        SELECT session_id FROM gda_sessions
        WHERE session_id = ${sqlValue(sessionId)}
          AND token_hash = ${sqlValue(hashToken(token))}
          AND revoked_at IS NULL
          AND expires_at > CURRENT_TIMESTAMP
        LIMIT 1
    `);
    return (result.results[0]?.response?.result?.rows || []).length > 0;
}

function canonicalJson(value) {
    if (Array.isArray(value)) {
        return value.map(canonicalJson);
    }
    if (value && typeof value === 'object') {
        return Object.keys(value).sort().reduce((result, key) => {
            result[key] = canonicalJson(value[key]);
            return result;
        }, {});
    }
    return value;
}

function sha256(value) {
    return crypto.createHash('sha256').update(JSON.stringify(canonicalJson(value))).digest('hex');
}

async function ensureIntegrityTable() {
    await queryTurso(`
        CREATE TABLE IF NOT EXISTS gda_integrity_records (
            integrity_id TEXT PRIMARY KEY,
            record_type TEXT NOT NULL,
            record_id TEXT NOT NULL,
            content_hash TEXT NOT NULL,
            integrity_hash TEXT NOT NULL,
            previous_hash TEXT,
            payload TEXT NOT NULL,
            event_type TEXT NOT NULL,
            issued_by TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    `);
}

async function registerIntegrityRecord(recordType, recordId, payload, eventType, username) {
    try {
        await ensureIntegrityTable();
        const previousResult = await queryTurso(`
            SELECT integrity_hash FROM gda_integrity_records
            WHERE record_type = ${sqlValue(recordType)} AND record_id = ${sqlValue(String(recordId))}
            ORDER BY created_at DESC, integrity_id DESC LIMIT 1
        `);
        const previousHash = previousResult.results[0]?.response?.result?.rows?.[0]?.[0]?.value || null;
        const createdAt = new Date().toISOString();
        const contentHash = sha256(payload);
        const integrityHash = sha256({ recordType, recordId: String(recordId), contentHash, previousHash, eventType, createdAt });
        const integrityId = crypto.randomUUID();

        await queryTurso(`
            INSERT INTO gda_integrity_records
                (integrity_id, record_type, record_id, content_hash, integrity_hash, previous_hash, payload, event_type, issued_by, created_at)
            VALUES (${sqlValue(integrityId)}, ${sqlValue(recordType)}, ${sqlValue(String(recordId))},
                ${sqlValue(contentHash)}, ${sqlValue(integrityHash)}, ${sqlValue(previousHash)},
                ${sqlValue(JSON.stringify(canonicalJson(payload)))}, ${sqlValue(eventType)},
                ${sqlValue(username || 'sistema')}, ${sqlValue(createdAt)})
        `);
        return { integrity_id: integrityId, content_hash: contentHash, integrity_hash: integrityHash, created_at: createdAt };
    } catch (err) {
        logSecurityEvent('integrity_record_error', { recordType, recordId: String(recordId), error: err.message });
        return null;
    }
}

async function getLatestIntegrityRecord(recordType, recordId) {
    await ensureIntegrityTable();
    const result = await queryTurso(`
        SELECT integrity_id, record_type, record_id, content_hash, integrity_hash, previous_hash,
               payload, event_type, issued_by, created_at
        FROM gda_integrity_records
        WHERE record_type = ${sqlValue(recordType)} AND record_id = ${sqlValue(String(recordId))}
        ORDER BY created_at DESC, integrity_id DESC LIMIT 1
    `);
    const row = result.results[0]?.response?.result?.rows?.[0];
    if (!row) return null;
    const values = row.map((cell) => cell?.value ?? cell);
    const [integrityId, type, id, contentHash, integrityHash, previousHash, payload, eventType, issuedBy, createdAt] = values;
    return {
        integrity_id: integrityId,
        record_type: type,
        record_id: id,
        content_hash: contentHash,
        integrity_hash: integrityHash,
        previous_hash: previousHash,
        payload: JSON.parse(payload),
        event_type: eventType,
        issued_by: issuedBy,
        created_at: createdAt
    };
}

async function migrateLegacyIntegrity(username) {
    const sources = [
        ['turmas', 'cod'],
        ['presencas', 'id'],
        ['presencas-atrasadas', 'id'],
        ['ocorrencias', 'id'],
        ['atividades', 'id'],
        ['notas', 'disciplina_cod'],
        ['relatorios', 'id'],
        ['checklist', 'id'],
        ['historico_panico', 'id'],
        ['atendimentos', 'id'],
        ['assuntos', 'id'],
        ['gda_sync', 'data_key']
    ];
    await ensureIntegrityTable();
    let migrated = 0;
    for (const [table, idColumn] of sources) {
        const result = await queryTurso(`SELECT * FROM ${table}`);
        const rows = result.results[0]?.response?.result?.rows || [];
        const cols = result.results[0]?.response?.result?.cols || [];
        for (const row of rows) {
            const record = {};
            row.forEach((cell, index) => { record[cols[index].name] = cell?.value ?? cell; });
            const recordId = record[idColumn];
            if (recordId === null || typeof recordId === 'undefined') continue;
            const existing = await queryTurso(`
                SELECT integrity_id FROM gda_integrity_records
                WHERE record_type = ${sqlValue(table)} AND record_id = ${sqlValue(String(recordId))}
                LIMIT 1
            `);
            if ((existing.results[0]?.response?.result?.rows || []).length) continue;
            if (await registerIntegrityRecord(table, recordId, record, 'legacy_import', username)) migrated += 1;
        }
    }
    return migrated;
}

function sendIntegrityPdf(res, record) {
    const document = new PDFDocument({ margin: 50 });
    const safeType = String(record.record_type).replace(/[^a-z0-9_-]/gi, '_');
    const safeId = String(record.record_id).replace(/[^a-z0-9_-]/gi, '_');
    res.type('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="gda-certidao-${safeType}-${safeId}.pdf"`);
    document.pipe(res);
    document.fontSize(18).text('GDA - CERTIDAO DE INTEGRIDADE', { align: 'center' });
    document.moveDown();
    document.fontSize(11).text('Documento de verificacao de integridade de registro academico');
    document.moveDown();
    document.text(`Tipo: ${record.record_type}`);
    document.text(`Identificador: ${record.record_id}`);
    document.text(`Evento: ${record.event_type}`);
    document.text(`Emitido por: ${record.issued_by}`);
    document.text(`Data UTC: ${record.created_at}`);
    document.moveDown();
    document.font('Courier').fontSize(9).text(`Hash do conteudo (SHA-256): ${record.content_hash}`);
    document.text(`Hash de integridade: ${record.integrity_hash}`);
    document.text(`Hash anterior: ${record.previous_hash || 'GENESIS'}`);
    document.font('Helvetica').fontSize(9).moveDown();
    document.text('Verificacao: recalcule o SHA-256 do JSON canonico do registro e confira a cadeia de hashes no endpoint de integridade.', { align: 'justify' });
    document.moveDown();
    document.text('Esta certidao comprova a integridade e a origem registrada no sistema GDA. Nao constitui, por si so, assinatura digital ICP-Brasil ou declaracao juridica de fe publica.', { align: 'justify' });
    document.end();
}

function normalizeTursoUrl(value) {
    if (!value) return '';
    return value.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

function getTursoBaseUrl() {
    const host = normalizeTursoUrl(TURSO_URL);
    if (!host) {
        throw new Error('TURSO_URL não configurado. Defina a variável de ambiente no painel da Vercel.');
    }
    return `https://${host}`;
}

function buildTursoError(err) {
    const message = err && err.message ? err.message : 'Erro desconhecido ao acessar o Turso.';
    return {
        error: message,
        status: 'turso_error'
    };
}

async function ensureSyncTable() {
    try {
        const sql = `
            CREATE TABLE IF NOT EXISTS gda_sync (
                id TEXT PRIMARY KEY,
                data_key TEXT UNIQUE,
                payload TEXT,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await queryTurso(sql);
        return true;
    } catch (err) {
        console.error('❌ Falha ao preparar tabela de sincronização:', err && err.message ? err.message : err);
        return false;
    }
}

// Função para executar queries no Turso
async function queryTurso(sql) {
    try {
        if (!TURSO_URL || !TURSO_TOKEN) {
            throw new Error('TURSO_URL ou TURSO_TOKEN não configurados. Verifique as variáveis de ambiente da Vercel.');
        }

        const url = getTursoBaseUrl();
        console.log(`📡 Conectando a: ${url}`);

        const response = await fetch(`${url}/v2/pipeline`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TURSO_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requests: [{
                    type: 'execute',
                    stmt: { sql: sql }
                }]
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${JSON.stringify(data)}`);
        }
        return data;
    } catch (err) {
        console.error('❌ Erro na query:', err && err.message ? err.message : err);
        throw err;
    }
}

// ============================================================
// MIDDLEWARE
// ============================================================
app.disable('x-powered-by');
app.set('trust proxy', 1);
const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) => {
        logSecurityEvent('rate_limit_exceeded', { ip: req.ip, path: req.path });
        res.status(429).json({ error: 'Too Many Requests' });
    }
});
const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) => {
        logSecurityEvent('login_rate_limit_exceeded', { ip: req.ip });
        res.status(429).json({ error: 'Too Many Requests' });
    }
});
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            objectSrc: ["'none'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: []
        }
    }
}));
app.use(applySecurityHeaders);
app.use(apiRateLimiter);
app.use((req, res, next) => {
    if (isSensitivePath(req.path)) {
        return res.status(404).json({ error: 'Not found' });
    }
    next();
});
app.use(express.json({ limit: '1mb' }));
app.use(express.static(ROOT_DIR, { dotfiles: 'ignore', index: false }));

app.get('/', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

app.head('/', (req, res) => {
    res.status(200).end();
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

app.head('/index.html', (req, res) => {
    res.status(200).end();
});

app.get(/^\/(?!api).*/, (req, res) => {
    const requestPath = req.path || '/';
    const hasExtension = /\.[a-z0-9]+$/i.test(requestPath);
    if (hasExtension) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

app.head(/^\/(?!api).*/, (req, res) => {
    const requestPath = req.path || '/';
    const hasExtension = /\.[a-z0-9]+$/i.test(requestPath);
    if (hasExtension) {
        return res.status(404).end();
    }
    res.status(200).end();
});

app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin) {
        if (!isAllowedOrigin(origin)) {
            logSecurityEvent('cors_rejected', { ip: req.ip, origin, path: req.path });
            return res.status(403).json({ error: 'Origin not allowed' });
        }

        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }

    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    if (req.method === 'TRACE' || req.method === 'CONNECT') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
        return res.status(405).set('Allow', 'GET, POST, DELETE, OPTIONS, HEAD').json({ error: 'Method Not Allowed' });
    }

    next();
});

app.use(cors({
    origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

app.post('/api/auth/login', loginRateLimiter, async (req, res) => {
    const { username, password } = req.body || {};
    const configuredUsername = process.env.GDA_AUTH_USERNAME;
    const configuredPassword = process.env.GDA_AUTH_PASSWORD;

    if (!configuredUsername || !configuredPassword || !process.env.JWT_SECRET) {
        logSecurityEvent('login_unavailable', { ip: req.ip });
        return res.status(503).json({ error: 'Autenticação não configurada.' });
    }

    if (!safeEqual(username, configuredUsername) || !safeEqual(password, configuredPassword)) {
        logSecurityEvent('login_failed', { ip: req.ip, username: String(username || '').slice(0, 80) });
        return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    try {
        const sessionId = crypto.randomUUID();
        const token = jwt.sign({ sub: configuredUsername, sid: sessionId }, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
        const payload = jwt.decode(token);
        await storeSession(token, configuredUsername, sessionId, new Date(payload.exp * 1000).toISOString());
        logSecurityEvent('login_succeeded', { ip: req.ip, username: configuredUsername });
        return res.json({ token, expires_at: new Date(payload.exp * 1000).toISOString() });
    } catch (err) {
        logSecurityEvent('login_error', { ip: req.ip, error: err.message });
        return res.status(503).json({ error: 'Serviço de autenticação indisponível.' });
    }
});

async function authenticateApi(req, res, next) {
    const authorization = req.headers.authorization || '';
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) {
        logSecurityEvent('authentication_failed', { ip: req.ip, path: req.path, reason: 'missing_token' });
        return res.status(401).json({ error: 'Token de autenticação obrigatório.' });
    }

    try {
        const token = match[1];
        const payload = jwt.verify(token, getJwtSecret());
        if (!payload.sid || !(await isActiveSession(token, payload.sid))) {
            logSecurityEvent('authentication_failed', { ip: req.ip, path: req.path, reason: 'inactive_session' });
            return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
        }
        req.user = { username: payload.sub, sessionId: payload.sid, expiresAt: new Date(payload.exp * 1000).toISOString() };
        return next();
    } catch (err) {
        logSecurityEvent('authentication_failed', { ip: req.ip, path: req.path, reason: err.name || 'invalid_token' });
        if (/TURSO|fetch|pipeline|JWT_SECRET/i.test(err.message || '')) {
            return res.status(503).json({ error: 'Serviço de autenticação indisponível.' });
        }
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
}

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: require('../package.json').version, environment: process.env.NODE_ENV || 'production' });
});

app.get('/api/ping', (req, res) => {
    res.json({ pong: true, timestamp: new Date().toISOString() });
});

app.get('/api/version', (req, res) => {
    res.json({
        version: require('../package.json').version,
        commit: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
        buildDate: process.env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN ? new Date().toISOString() : 'local'
    });
});

app.use('/api', authenticateApi);

app.get('/api/auth/verify', (req, res) => {
    res.json({
        valid: true,
        user: { username: req.user.username },
        expiresIn: req.user.expiresAt
    });
});

app.get('/api/turso/status', async (req, res) => {
    try {
        const result = await queryTurso("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name");
        const rows = result.results[0]?.response?.result?.rows || [];
        const tables = rows.map((row) => row[0]?.value ?? row[0]).filter(Boolean);
        return res.json({
            status: 'online',
            database: normalizeTursoUrl(TURSO_URL) || 'configured',
            connections: 'serverless',
            tables
        });
    } catch (err) {
        return res.status(503).json({ status: 'offline', error: 'Banco de dados indisponível.' });
    }
});

app.get('/api/integridade/status', async (req, res) => {
    try {
        await ensureIntegrityTable();
        const result = await queryTurso(`
            SELECT integrity_id, record_type, record_id, content_hash, integrity_hash,
                   previous_hash, payload, event_type, created_at
            FROM gda_integrity_records ORDER BY created_at ASC, integrity_id ASC
        `);
        const rows = result.results[0]?.response?.result?.rows || [];
        let chainValid = true;
        let previousByRecord = new Map();
        let ultimoHash = null;
        for (const row of rows) {
            const values = row.map((cell) => cell?.value ?? cell);
            const [integrityId, recordType, recordId, contentHash, integrityHash, previousHash, payload, eventType, createdAt] = values;
            const key = `${recordType}:${recordId}`;
            const expectedPrevious = previousByRecord.get(key) || null;
            const expectedIntegrity = sha256({ recordType, recordId: String(recordId), contentHash, previousHash, eventType, createdAt });
            if (previousHash !== expectedPrevious || integrityHash !== expectedIntegrity) chainValid = false;
            previousByRecord.set(key, integrityHash);
            ultimoHash = integrityHash;
        }
        return res.json({ status: 'online', total: rows.length, ultimoHash, chainValid });
    } catch (err) {
        return res.status(503).json({ status: 'offline', error: 'Integridade indisponível.' });
    }
});

app.post('/api/auth/logout', async (req, res) => {
    try {
        await queryTurso(`
            UPDATE gda_sessions
            SET revoked_at = CURRENT_TIMESTAMP
            WHERE session_id = ${sqlValue(req.user.sessionId)}
        `);
        logSecurityEvent('logout_succeeded', { ip: req.ip, username: req.user.username });
        return res.status(204).end();
    } catch (err) {
        logSecurityEvent('logout_error', { ip: req.ip, error: err.message });
        return res.status(503).json({ error: 'Serviço de autenticação indisponível.' });
    }
});

app.get('/api/integridade/:tipo/:id', async (req, res) => {
    try {
        const record = await getLatestIntegrityRecord(req.params.tipo, req.params.id);
        if (!record) return res.status(404).json({ error: 'Registro de integridade não encontrado.' });
        return res.json(record);
    } catch (err) {
        return res.status(503).json({ error: 'Serviço de integridade indisponível.' });
    }
});

app.post('/api/integridade/migrar-legado', async (req, res) => {
    try {
        const migrated = await migrateLegacyIntegrity(req.user.username);
        logSecurityEvent('legacy_integrity_migration', { ip: req.ip, username: req.user.username, migrated });
        return res.json({ ok: true, migrated });
    } catch (err) {
        logSecurityEvent('legacy_integrity_migration_error', { ip: req.ip, error: err.message });
        return res.status(503).json({ error: 'Migração de integridade indisponível.' });
    }
});

app.get('/api/integridade/:tipo/:id/pdf', async (req, res) => {
    try {
        const record = await getLatestIntegrityRecord(req.params.tipo, req.params.id);
        if (!record) return res.status(404).json({ error: 'Registro de integridade não encontrado.' });
        return sendIntegrityPdf(res, record);
    } catch (err) {
        return res.status(503).json({ error: 'Serviço de integridade indisponível.' });
    }
});

app.use((err, req, res, next) => {
    console.error('Erro da API:', err);
    const isTursoError = err && err.message && /TURSO|Turso|fetch|Authorization|pipeline/i.test(err.message);
    res.status(err.status || 500).json({
        error: err.message || 'Erro interno do servidor',
        turso: isTursoError,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ============================================================
// ROTAS DA API - TODAS AS FUNCIONALIDADES DO GDA
// ============================================================

// ============================================================
// 1. TURMAS
// ============================================================
app.get('/api/turmas', async (req, res) => {
    try {
        const result = await queryTurso('SELECT * FROM turmas ORDER BY nome');
        const rows = result.results[0]?.response?.result?.rows || [];
        const cols = result.results[0]?.response?.result?.cols || [];
        const dados = rows.map(row => {
            const obj = {};
            row.forEach((cell, i) => obj[cols[i].name] = cell.value);
            return obj;
        });
        res.json(dados);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// 2. PRESENÇAS
// ============================================================
app.get('/api/presencas', async (req, res) => {
    try {
        const result = await queryTurso('SELECT * FROM presencas ORDER BY data DESC, hora DESC');
        const rows = result.results[0]?.response?.result?.rows || [];
        const cols = result.results[0]?.response?.result?.cols || [];
        const dados = rows.map(row => {
            const obj = {};
            row.forEach((cell, i) => obj[cols[i].name] = cell.value);
            return obj;
        });
        res.json(dados);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/presencas', async (req, res) => {
    try {
        const { id, data, hora, tipo, justificativa, nome, curso, atestado } = req.body;
        const sql = `
            INSERT OR REPLACE INTO presencas 
            (id, data, hora, tipo, justificativa, nome, curso, atestado)
            VALUES (${sqlValue(id)}, ${sqlValue(data)}, ${sqlValue(hora)}, ${sqlValue(tipo)}, ${sqlValue(justificativa || '')}, 
                    ${sqlValue(nome)}, ${sqlValue(curso || '')}, ${sqlValue(atestado ? 1 : 0)})
        `;
        await queryTurso(sql);
        const integrity = await registerIntegrityRecord('presencas', id, req.body, 'upsert', req.user.username);
        res.json({ success: true, id, integrity });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/presencas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await queryTurso(`DELETE FROM presencas WHERE id = ${sqlValue(id)}`);
        const integrity = await registerIntegrityRecord('presencas', id, { id }, 'delete', req.user.username);
        res.json({ success: true, integrity });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// 3. PRESENÇAS ATRASADAS
// ============================================================
app.get('/api/presencas-atrasadas', async (req, res) => {
    try {
        const result = await queryTurso('SELECT * FROM presencas_atrasadas ORDER BY data DESC');
        const rows = result.results[0]?.response?.result?.rows || [];
        const cols = result.results[0]?.response?.result?.cols || [];
        const dados = rows.map(row => {
            const obj = {};
            row.forEach((cell, i) => obj[cols[i].name] = cell.value);
            return obj;
        });
        res.json(dados);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/presencas-atrasadas', async (req, res) => {
    try {
        const { id, data, hora, tipo, justificativa, usuario } = req.body;
        const sql = `
            INSERT OR REPLACE INTO presencas_atrasadas 
            (id, data, hora, tipo, justificativa, usuario, registrado_em)
            VALUES (${sqlValue(id)}, ${sqlValue(data)}, ${sqlValue(hora)}, ${sqlValue(tipo)}, ${sqlValue(justificativa)}, 
                    ${sqlValue(usuario || 'Igor Veras Morais')}, ${sqlValue(new Date().toISOString().split('T')[0])})
        `;
        await queryTurso(sql);
        const integrity = await registerIntegrityRecord('presencas-atrasadas', id, req.body, 'upsert', req.user.username);
        res.json({ success: true, id, integrity });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// 4. OCORRÊNCIAS
// ============================================================
app.get('/api/ocorrencias', async (req, res) => {
    try {
        const result = await queryTurso('SELECT * FROM ocorrencias ORDER BY data DESC');
        const rows = result.results[0]?.response?.result?.rows || [];
        const cols = result.results[0]?.response?.result?.cols || [];
        const dados = rows.map(row => {
            const obj = {};
            row.forEach((cell, i) => obj[cols[i].name] = cell.value);
            return obj;
        });
        res.json(dados);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/ocorrencias', async (req, res) => {
    try {
        const { id, data, disciplina, tipo, descricao, para_coordenacao, usuario } = req.body;
        const sql = `
            INSERT OR REPLACE INTO ocorrencias 
            (id, data, disciplina, tipo, descricao, para_coordenacao, usuario, registrado_em)
            VALUES (${sqlValue(id)}, ${sqlValue(data)}, ${sqlValue(disciplina)}, ${sqlValue(tipo)}, ${sqlValue(descricao)}, 
                    ${sqlValue(para_coordenacao ? 1 : 0)}, ${sqlValue(usuario || 'Igor Veras Morais')}, 
                    ${sqlValue(new Date().toISOString().split('T')[0])})
        `;
        await queryTurso(sql);
        const integrity = await registerIntegrityRecord('ocorrencias', id, req.body, 'upsert', req.user.username);
        res.json({ success: true, id, integrity });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// 5. ATIVIDADES
// ============================================================
app.get('/api/atividades', async (req, res) => {
    try {
        const result = await queryTurso('SELECT * FROM atividades ORDER BY created_at DESC');
        const rows = result.results[0]?.response?.result?.rows || [];
        const cols = result.results[0]?.response?.result?.cols || [];
        const dados = rows.map(row => {
            const obj = {};
            row.forEach((cell, i) => obj[cols[i].name] = cell.value);
            // Parse JSON fields
            if (obj.participantes) obj.participantes = JSON.parse(obj.participantes);
            if (obj.subtarefas) obj.subtarefas = JSON.parse(obj.subtarefas);
            return obj;
        });
        res.json(dados);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/atividades', async (req, res) => {
    try {
        const { id, titulo, tipo, prioridade, disciplina, inicio, prazo, entregaDocente, 
                observacoes, participantes, subtarefas, progresso } = req.body;
        const sql = `
            INSERT OR REPLACE INTO atividades 
            (id, titulo, tipo, prioridade, disciplina, inicio, prazo, entregaDocente, 
             observacoes, participantes, subtarefas, progresso)
            VALUES (${sqlValue(id)}, ${sqlValue(titulo)}, ${sqlValue(tipo)}, ${sqlValue(prioridade)}, ${sqlValue(disciplina)}, 
                    ${sqlValue(inicio)}, ${sqlValue(prazo)}, ${sqlValue(entregaDocente)}, ${sqlValue(observacoes || '')}, 
                    ${sqlValue(JSON.stringify(participantes || []))}, ${sqlValue(JSON.stringify(subtarefas || []))}, 
                    ${sqlValue(progresso || 0)})
        `;
        await queryTurso(sql);
        const integrity = await registerIntegrityRecord('atividades', id, req.body, 'upsert', req.user.username);
        res.json({ success: true, id, integrity });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/atividades/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await queryTurso(`DELETE FROM atividades WHERE id = ${sqlValue(id)}`);
        const integrity = await registerIntegrityRecord('atividades', id, { id }, 'delete', req.user.username);
        res.json({ success: true, integrity });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// 6. NOTAS
// ============================================================
app.get('/api/notas', async (req, res) => {
    try {
        const result = await queryTurso('SELECT * FROM notas');
        const rows = result.results[0]?.response?.result?.rows || [];
        const cols = result.results[0]?.response?.result?.cols || [];
        const dados = rows.map(row => {
            const obj = {};
            row.forEach((cell, i) => obj[cols[i].name] = cell.value);
            return obj;
        });
        res.json(dados);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/notas', async (req, res) => {
    try {
        const { disciplina_cod, disciplina_nome, b1, b2, b3, b4 } = req.body;
        const sql = `
            INSERT OR REPLACE INTO notas 
            (disciplina_cod, disciplina_nome, b1, b2, b3, b4)
            VALUES (${sqlValue(disciplina_cod)}, ${sqlValue(disciplina_nome)}, 
                    ${sqlValue(parseFloat(b1) || 0)}, ${sqlValue(parseFloat(b2) || 0)}, 
                    ${sqlValue(parseFloat(b3) || 0)}, ${sqlValue(parseFloat(b4) || 0)})
        `;
        await queryTurso(sql);
        const integrity = await registerIntegrityRecord('notas', disciplina_cod, req.body, 'upsert', req.user.username);
        res.json({ success: true, integrity });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// 7. RELATÓRIOS
// ============================================================
app.get('/api/relatorios', async (req, res) => {
    try {
        const result = await queryTurso('SELECT * FROM relatorios ORDER BY data DESC');
        const rows = result.results[0]?.response?.result?.rows || [];
        const cols = result.results[0]?.response?.result?.cols || [];
        const dados = rows.map(row => {
            const obj = {};
            row.forEach((cell, i) => obj[cols[i].name] = cell.value);
            return obj;
        });
        res.json(dados);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/relatorios', async (req, res) => {
    try {
        const { id, data, disciplina, tempo, texto } = req.body;
        const sql = `
            INSERT OR REPLACE INTO relatorios (id, data, disciplina, tempo, texto)
            VALUES (${sqlValue(id)}, ${sqlValue(data)}, ${sqlValue(disciplina)}, ${sqlValue(tempo)}, ${sqlValue(texto)})
        `;
        await queryTurso(sql);
        const integrity = await registerIntegrityRecord('relatorios', id, req.body, 'upsert', req.user.username);
        res.json({ success: true, id, integrity });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// 8. CHECKLIST
// ============================================================
app.get('/api/checklist', async (req, res) => {
    try {
        const result = await queryTurso('SELECT * FROM checklist');
        const rows = result.results[0]?.response?.result?.rows || [];
        const cols = result.results[0]?.response?.result?.cols || [];
        const dados = rows.map(row => {
            const obj = {};
            row.forEach((cell, i) => obj[cols[i].name] = cell.value);
            return obj;
        });
        res.json(dados);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/checklist/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { concluido } = req.body;
        await queryTurso(`UPDATE checklist SET concluido = ${sqlValue(concluido ? 1 : 0)} WHERE id = ${sqlValue(id)}`);
        const integrity = await registerIntegrityRecord('checklist', id, req.body, 'upsert', req.user.username);
        res.json({ success: true, integrity });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// 9. HISTÓRICO PÂNICO
// ============================================================
app.get('/api/panico', async (req, res) => {
    try {
        const result = await queryTurso('SELECT * FROM historico_panico ORDER BY created_at DESC');
        const rows = result.results[0]?.response?.result?.rows || [];
        const cols = result.results[0]?.response?.result?.cols || [];
        const dados = rows.map(row => {
            const obj = {};
            row.forEach((cell, i) => obj[cols[i].name] = cell.value);
            return obj;
        });
        res.json(dados);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/panico', async (req, res) => {
    try {
        const { id, data, hora, disciplina, motivo, resolvido } = req.body;
        const sql = `
            INSERT OR REPLACE INTO historico_panico 
            (id, data, hora, disciplina, motivo, resolvido)
            VALUES (${sqlValue(id)}, ${sqlValue(data)}, ${sqlValue(hora)}, ${sqlValue(disciplina)}, ${sqlValue(motivo)}, 
                    ${sqlValue(resolvido ? 1 : 0)})
        `;
        await queryTurso(sql);
        const integrity = await registerIntegrityRecord('panico', id, req.body, 'upsert', req.user.username);
        res.json({ success: true, id, integrity });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// 10. ATENDIMENTOS
// ============================================================
app.get('/api/atendimentos', async (req, res) => {
    try {
        const result = await queryTurso('SELECT * FROM atendimentos ORDER BY data DESC');
        const rows = result.results[0]?.response?.result?.rows || [];
        const cols = result.results[0]?.response?.result?.cols || [];
        const dados = rows.map(row => {
            const obj = {};
            row.forEach((cell, i) => obj[cols[i].name] = cell.value);
            return obj;
        });
        res.json(dados);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/atendimentos', async (req, res) => {
    try {
        const { id, disciplina, data, hora, descricao, timestamp } = req.body;
        const sql = `
            INSERT OR REPLACE INTO atendimentos 
            (id, disciplina, data, hora, descricao, timestamp)
            VALUES (${sqlValue(id)}, ${sqlValue(disciplina)}, ${sqlValue(data)}, ${sqlValue(hora)}, ${sqlValue(descricao)}, 
                    ${sqlValue(timestamp || Date.now())})
        `;
        await queryTurso(sql);
        const integrity = await registerIntegrityRecord('atendimentos', id, req.body, 'upsert', req.user.username);
        res.json({ success: true, id, integrity });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// 11. ASSUNTOS
// ============================================================
app.get('/api/assuntos', async (req, res) => {
    try {
        const result = await queryTurso('SELECT * FROM assuntos ORDER BY data DESC');
        const rows = result.results[0]?.response?.result?.rows || [];
        const cols = result.results[0]?.response?.result?.cols || [];
        const dados = rows.map(row => {
            const obj = {};
            row.forEach((cell, i) => obj[cols[i].name] = cell.value);
            return obj;
        });
        res.json(dados);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/assuntos', async (req, res) => {
    try {
        const { id, disciplina, titulo, descricao, data, timestamp } = req.body;
        const sql = `
            INSERT OR REPLACE INTO assuntos 
            (id, disciplina, titulo, descricao, data, timestamp)
            VALUES (${sqlValue(id)}, ${sqlValue(disciplina)}, ${sqlValue(titulo)}, ${sqlValue(descricao)}, ${sqlValue(data)}, 
                    ${sqlValue(timestamp || Date.now())})
        `;
        await queryTurso(sql);
        const integrity = await registerIntegrityRecord('assuntos', id, req.body, 'upsert', req.user.username);
        res.json({ success: true, id, integrity });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/sync/:key', async (req, res) => {
    try {
        await ensureSyncTable();
        const { key } = req.params;
        const result = await queryTurso(`SELECT payload FROM gda_sync WHERE data_key = ${sqlValue(String(key))} LIMIT 1`);
        const rows = result.results[0]?.response?.result?.rows || [];
        if (!rows.length) {
            return res.json(null);
        }
        const payload = rows[0][0]?.value ?? rows[0][0];
        return res.json(typeof payload === 'string' ? JSON.parse(payload) : payload ?? null);
    } catch (err) {
        return res.status(500).json(buildTursoError(err));
    }
});

app.post('/api/sync/:key', async (req, res) => {
    try {
        await ensureSyncTable();
        const { key } = req.params;
        const payload = JSON.stringify(req.body && Object.prototype.hasOwnProperty.call(req.body, 'value') ? req.body.value : req.body);
        const now = new Date().toISOString();
        const sql = `
            INSERT INTO gda_sync (id, data_key, payload, updated_at)
            VALUES (${sqlValue(`${key}-${Date.now()}`)}, ${sqlValue(String(key))}, ${sqlValue(payload)}, ${sqlValue(now)})
            ON CONFLICT(data_key) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
        `;
        await queryTurso(sql);
        const integrity = await registerIntegrityRecord('sync', key, req.body, 'upsert', req.user.username);
        return res.json({ ok: true, key, updated_at: now, integrity });
    } catch (err) {
        return res.status(500).json(buildTursoError(err));
    }
});

// ============================================================
// ROTA PRINCIPAL (bloqueada para evitar exposição de informações)
// ============================================================
app.get('/api', (req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// ============================================================
// EXPORTAÇÃO PARA O VERCEL
// ============================================================
module.exports = app;