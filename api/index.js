// api/index.js
// Servidor completo para Vercel com conexão ao Turso

const express = require('express');
const path = require('path');
const app = express();
const ROOT_DIR = path.resolve(__dirname, '..');
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 100;
const rateLimitStore = new Map();
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

function applySecurityHeaders(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; frame-ancestors 'none'; upgrade-insecure-requests");

    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
}

function applyRateLimit(req, res, next) {
    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const recentRequests = (rateLimitStore.get(clientIp) || []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

    if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
        return res.status(429).json({ error: 'Too Many Requests' });
    }

    recentRequests.push(now);
    rateLimitStore.set(clientIp, recentRequests);
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
app.use(applySecurityHeaders);
app.use(applyRateLimit);
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

app.use('/api', (req, res, next) => {
    if (req.method === 'HEAD') {
        return res.status(200).end();
    }
    next();
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
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/presencas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await queryTurso(`DELETE FROM presencas WHERE id = ${sqlValue(id)}`);
        res.json({ success: true });
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
        res.json({ success: true, id });
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
        res.json({ success: true, id });
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
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/atividades/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await queryTurso(`DELETE FROM atividades WHERE id = ${sqlValue(id)}`);
        res.json({ success: true });
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
        res.json({ success: true });
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
        res.json({ success: true, id });
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
        res.json({ success: true });
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
        res.json({ success: true, id });
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
        res.json({ success: true, id });
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
        res.json({ success: true, id });
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
        return res.json({ ok: true, key, updated_at: now });
    } catch (err) {
        return res.status(500).json(buildTursoError(err));
    }
});

// ============================================================
// ROTA PRINCIPAL (para verificar se a API está online)
// ============================================================
app.get('/api', (req, res) => {
    const status = {
        nome: 'GDA - Gestão Digital Agregada',
        versao: '2.0.0',
        status: 'online',
        banco: TURSO_URL || 'Não configurado',
        rotas: [
            '/api/turmas',
            '/api/presencas',
            '/api/presencas-atrasadas',
            '/api/ocorrencias',
            '/api/atividades',
            '/api/notas',
            '/api/relatorios',
            '/api/checklist',
            '/api/panico',
            '/api/atendimentos',
            '/api/assuntos',
            '/api/sync/:key'
        ]
    };

    console.info('[GDA][API] Requisição para /api recebida. Status da API:', status.status);
    console.info('[GDA][API] Banco configurado?', status.banco !== 'Não configurado' ? 'sim' : 'não');
    res.json(status);
});

// ============================================================
// EXPORTAÇÃO PARA O VERCEL
// ============================================================
module.exports = app;