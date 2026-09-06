const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('../src/config');
const { checkConnection } = require('../src/services/turso');
const authRoutes = require('../src/routes/authRoutes');
const syncRoutes = require('../src/routes/syncRoutes');
const notasRoutes = require('../src/routes/notasRoutes');

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/notas', notasRoutes);
app.get('/api/health', async (req, res) => {
	let cloudConnected = false;
	try {
		cloudConnected = await checkConnection();
	} catch (error) {
		console.error('Health check Turso falhou:', error.message);
	}
	return res.status(cloudConnected ? 200 : 503).json({
		status: cloudConnected ? 'ok' : 'degraded',
		version: '7.3.0',
		storage: cloudConnected ? 'turso' : 'unavailable',
		cloudConfigured: Boolean(process.env.TURSO_URL && process.env.TURSO_TOKEN),
		cloudConnected
	});
});
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));
app.use('/api/*', (req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

module.exports = app;
