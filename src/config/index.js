require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'gda_secret_key_2026',
  dbUrl: process.env.TURSO_URL || process.env.DATABASE_URL || '',
  dbToken: process.env.TURSO_TOKEN || '',
  authUsername: process.env.GDA_AUTH_USERNAME || 'admin',
  authPassword: process.env.GDA_AUTH_PASSWORD || 'admin',
  port: process.env.PORT || 3000,
  vercelUrl: process.env.VERCEL_URL || 'https://gda.vercel.app',
  corsOrigin: process.env.CORS_ALLOWED_ORIGINS || process.env.CORS_ORIGIN || '*',
  env: process.env.NODE_ENV || 'development'
}
