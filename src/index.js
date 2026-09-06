const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Configurações
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const syncRoutes = require('./routes/syncRoutes');

// Registrar rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '7.3.0',
    storage: 'memory',
    cloudConfigured: Boolean(process.env.TURSO_URL && process.env.TURSO_TOKEN),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => console.log(`🚀 GDA rodando em http://localhost:${PORT}`));
