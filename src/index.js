const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const syncRoutes = require('./routes/syncRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 15*60*1000, max: 100 }));

app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '7.3' }));

app.listen(PORT, () => console.log(`🚀 GDA rodando na porta ${PORT}`));
module.exports = app;
