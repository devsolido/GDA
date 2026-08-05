// api/index.js
// Servidor completo para Vercel com conexão ao Turso

const express = require('express');
const app = express();

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
app.use(express.json());

app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
        'https://gda-kappa.vercel.app',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500'
    ];

    const isAllowedOrigin = !origin || allowedOrigins.includes(origin) || /\.vercel\.app$/i.test(origin || '') || /github\.dev$/i.test(origin || '') || /localhost/.test(origin || '');

    if (isAllowedOrigin) {
        res.header('Access-Control-Allow-Origin', origin || '*');
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
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
            VALUES ('${id}', '${data}', '${hora}', '${tipo}', '${justificativa || ''}', 
                    '${nome}', '${curso || ''}', ${atestado ? 1 : 0})
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
        await queryTurso(`DELETE FROM presencas WHERE id = '${id}'`);
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
            VALUES ('${id}', '${data}', '${hora}', '${tipo}', '${justificativa}', 
                    '${usuario || 'Igor Veras Morais'}', '${new Date().toISOString().split('T')[0]}')
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
            VALUES ('${id}', '${data}', '${disciplina}', '${tipo}', '${descricao}', 
                    ${para_coordenacao ? 1 : 0}, '${usuario || 'Igor Veras Morais'}', 
                    '${new Date().toISOString().split('T')[0]}')
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
            VALUES ('${id}', '${titulo}', '${tipo}', '${prioridade}', '${disciplina}', 
                    '${inicio}', '${prazo}', '${entregaDocente}', '${observacoes || ''}', 
                    '${JSON.stringify(participantes || [])}', '${JSON.stringify(subtarefas || [])}', 
                    ${progresso || 0})
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
        await queryTurso(`DELETE FROM atividades WHERE id = '${id}'`);
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
            VALUES ('${disciplina_cod}', '${disciplina_nome}', 
                    ${parseFloat(b1) || 0}, ${parseFloat(b2) || 0}, 
                    ${parseFloat(b3) || 0}, ${parseFloat(b4) || 0})
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
            VALUES ('${id}', '${data}', '${disciplina}', ${tempo}, '${texto}')
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
        await queryTurso(`UPDATE checklist SET concluido = ${concluido ? 1 : 0} WHERE id = '${id}'`);
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
            VALUES ('${id}', '${data}', '${hora}', '${disciplina}', '${motivo}', 
                    ${resolvido ? 1 : 0})
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
            VALUES ('${id}', '${disciplina}', '${data}', '${hora}', '${descricao}', 
                    ${timestamp || Date.now()})
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
            VALUES ('${id}', '${disciplina}', '${titulo}', '${descricao}', '${data}', 
                    ${timestamp || Date.now()})
        `;
        await queryTurso(sql);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// ROTA PRINCIPAL (para verificar se a API está online)
// ============================================================
app.get('/api', (req, res) => {
    res.json({
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
            '/api/assuntos'
        ]
    });
});

// ============================================================
// EXPORTAÇÃO PARA O VERCEL
// ============================================================
module.exports = app;