module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'gda_secret_key_2026',
  dbUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/gda',
  port: process.env.PORT || 3000,
  vercelUrl: process.env.VERCEL_URL || 'https://gda.vercel.app',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  env: process.env.NODE_ENV || 'development'
}
