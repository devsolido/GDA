// ============================================================
// server-cloud.js - PONTE PARA VERCEL
// ============================================================
// A API principal está em api/index.js
// Este arquivo é o entry point para a Vercel

require('dotenv').config();
module.exports = require('./api/index.js');
