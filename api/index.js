const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('../src/config');
const authRoutes = require('../src/routes/authRoutes');
const syncRoutes = require('../src/routes/syncRoutes');

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.get('/api/health', (req, res) => res.json({
	status: 'ok',
	version: '7.3.0',
	storage: 'memory',
	cloudConfigured: Boolean(process.env.TURSO_URL && process.env.TURSO_TOKEN)
}));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));
app.use('/api/*', (req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

module.exports = app;
