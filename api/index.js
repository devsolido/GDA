require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { createClient } = require('@libsql/client');
const app = express();
app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
const turso = createClient({
    url: process.env.TURSO_URL || 'https://gda-gb-devsolido.aws-us-east-2.turso.io',
    authToken: process.env.TURSO_TOKEN || ''
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const validUser = 'igor';
        const validPass = '202623700357';
        if (username === validUser && password === validPass) {
            const token = jwt.sign(
                { username, role: 'user' },
                'chave-secreta-teste',
                { expiresIn: '24h' }
            );
            return res.json({
                success: true,
                token,
                user: { username, role: 'user' }
            });
        }
        res.status(401).json({ error: 'Credenciais inválidas' });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno' });
    }
});
app.get('/api/auth/verify', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }
    try {
        const decoded = jwt.verify(token, 'chave-secreta-teste');
        res.json({ valid: true, user: decoded });
    } catch (e) {
        res.status(401).json({ error: 'Token inválido' });
    }
});
app.get('/api/test/turso', async (req, res) => {
    try {
        const result = await turso.execute('SELECT 1 as test');
        res.json({ success: true, data: result });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
app.get('/api', (req, res) => {
    res.json({
        message: 'GDA API - Gestão Digital Agregada',
        version: '2.0.0'
    });
});
const syncRoutes = [
    'gda_presencas_atrasadas',
    'gda_ocorrencias',
    'gda_presencas',
    'gda_atividades',
    'gda_notas',
    'gda_relatorios',
    'gda_checklist',
    'gda_historico_panico',
    'gda_atendimentos',
    'gda_assuntos'
];
syncRoutes.forEach(route => {
    app.get(`/api/sync/${route}`, (req, res) => {
        res.json({
            success: true,
            data: [],
            message: `Rota ${route} sincronizada`
        });
    });
    app.post(`/api/sync/${route}`, (req, res) => {
        res.json({
            success: true,
            message: `Dados de ${route} salvos com sucesso`
        });
    });
    app.options(`/api/sync/${route}`, (req, res) => {
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.sendStatus(200);
    });
});
console.log('✅ Rotas sync carregadas:', syncRoutes.join(', '));
module.exports = app;


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📋 Rotas sync carregadas: ${syncRoutes.join(", ")}`);
});
