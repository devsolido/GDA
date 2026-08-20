// api/index.js
// Servidor completo para Vercel com conexão ao Turso

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { createClient } = require('@libsql/client');

console.log("🔍 DIAGNÓSTICO DE VARIÁVEIS:");
console.log("  TURSO_URL:", process.env.TURSO_URL || "❌ INDEFINIDO");
console.log("  TURSO_TOKEN:", process.env.TURSO_TOKEN ? "✅ DEFINIDO (oculto)" : "❌ INDEFINIDO");
console.log("  JWT_SECRET:", process.env.JWT_SECRET ? "✅ DEFINIDO" : "❌ INDEFINIDO");
console.log("  GDA_AUTH_USERNAME:", process.env.GDA_AUTH_USERNAME || "❌ INDEFINIDO");
console.log("  GDA_AUTH_PASSWORD:", process.env.GDA_AUTH_PASSWORD ? "✅ DEFINIDO" : "❌ INDEFINIDO");

const app = express();
app.use(express.json());

// ============================================================
// CORS CONFIG
// ============================================================
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================================
// CONEXÃO COM TURSO
// ============================================================
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
        console.log("📌 Tentativa de login:", username);

        // Pega as credenciais das variáveis de ambiente
        const validUser = process.env.GDA_AUTH_USERNAME || 'igor';
        const validPass = process.env.GDA_AUTH_PASSWORD || '202623700357';

        if (username === validUser && password === validPass) {
            const token = jwt.sign(
                { username, role: 'user' },
                process.env.JWT_SECRET || 'fallback-secret',
                { expiresIn: '24h' }
            );
            console.log("✅ Login bem-sucedido!");
            return res.json({
                success: true,
                token,
                user: { username, role: 'user' }
            });
        }

        console.log("❌ Credenciais inválidas");
        res.status(401).json({ error: 'Credenciais inválidas' });
    } catch (error) {
        console.error("❌ Erro no login:", error);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// ============================================================
// ROTA DE VERIFICAÇÃO
// ============================================================
app.get('/api/auth/verify', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
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
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'production',
        timestamp: new Date().toISOString()
    });
});

// ============================================================
// EXPORTAÇÃO
// ============================================================
module.exports = app;
