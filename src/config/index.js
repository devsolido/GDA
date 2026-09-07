require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || '',
  dbUrl: process.env.TURSO_URL || process.env.DATABASE_URL || '',
  dbToken: process.env.TURSO_TOKEN || '',
  authUsername: process.env.GDA_AUTH_USERNAME || '',
  authPassword: process.env.GDA_AUTH_PASSWORD || '',
  port: process.env.PORT || 3000,
  vercelUrl: process.env.VERCEL_URL || 'https://gda.vercel.app',
  corsOrigins: (process.env.CORS_ALLOWED_ORIGINS || process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  env: process.env.NODE_ENV || 'development'
}
