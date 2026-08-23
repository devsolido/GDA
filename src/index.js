const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '7.3.0', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`🚀 GDA rodando em http://localhost:${PORT}`));
