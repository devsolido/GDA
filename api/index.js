require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { createClient } = require('@libsql/client');

const app = express();
app.use(express.json());

// CORS - Permitir apenas o domínio específico
app.use(cors({
    origin: 'https://gda-kappa.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Helmet - Headers de segurança
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "https://api.turso.io", "https://*.turso.io"],
            fontSrc: ["'self'", "data:"],
        },
    },
    hsts: {
        maxAge: 63072000,
        includeSubDomains: true,
        preload: true,
    },
    frameguard: {
        action: "deny",
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: {
        policy: "strict-origin-when-cross-origin",
    },
}));

// Conexão com Turso
const turso = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_TOKEN
});

// ============================================================
// ROTA DE LOGIN - CORRIGIDA
// ============================================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Credenciais com fallback para desenvolvimento
        const validUser = process.env.GDA_AUTH_USERNAME || 'igor';
        const validPass = process.env.GDA_AUTH_PASSWORD || '202623700357';

        if (username === validUser && password === validPass) {
            const token = jwt.sign(
                { username, role: 'user' },
                process.env.JWT_SECRET || 'mude-esta-chave-em-producao',
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
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ============================================================
// ROTA DE VERIFICAÇÃO
// ============================================================
app.get('/api/auth/verify', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mude-esta-chave-em-producao');
        res.json({ valid: true, user: decoded });
    } catch (e) {
        res.status(401).json({ error: 'Token inválido' });
    }
});

// ============================================================
// ROTA DE TESTE TURSO
// ============================================================
app.get('/api/test/turso', async (req, res) => {
    try {
        const result = await turso.execute('SELECT 1 as test');
        res.json({ success: true, data: result });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ============================================================
// ROTA PADRÃO (caso alguém acesse a raiz da API)
// ============================================================
app.get('/api', (req, res) => {
    res.json({ 
        message: 'GDA API - Gestão Digital Agregada',
        version: '2.0.0',
        endpoints: [
            '/api/auth/login (POST)',
            '/api/auth/verify (GET)',
            '/api/test/turso (GET)',
            '/api/health (GET)'
        ]
    });
});

// ============================================================
// EXPORTAÇÃO PARA VERCEL
// ============================================================
module.exports = app;

// ROTA DASHBOARD
app.get('/api/dashboard', authenticate, (req, res) => {
    res.json({
        success: true,
        data: {
            turmas: 14,
            atividades: 0,
            checklist: 0,
            media_geral: 0.0
        }
    });
});
