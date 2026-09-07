const express = require('express');
const path = require('path');
const security = require('./middleware/security');
const app = express();
const PORT = process.env.PORT || 3000;

// Configurações
app.set('trust proxy', 1);
app.use(security.helmet);
app.use(security.cors);
app.use(security.rateLimit);
app.use(express.json({ limit: '256kb' }));
app.use(express.static(path.join(__dirname, '../')));

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const syncRoutes = require('./routes/syncRoutes');
const notasRoutes = require('./routes/notasRoutes');
const { checkConnection } = require('./services/turso');

// Registrar rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/notas', notasRoutes);

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Health check
app.get('/api/health', async (req, res) => {
  let cloudConnected = false;
  try {
    cloudConnected = await checkConnection();
  } catch (error) {}
  return res.status(cloudConnected ? 200 : 503).json({
    status: cloudConnected ? 'ok' : 'degraded',
    version: '7.3.0',
    storage: cloudConnected ? 'turso' : 'unavailable',
    cloudConfigured: Boolean(process.env.TURSO_URL && process.env.TURSO_TOKEN),
    cloudConnected,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT);
