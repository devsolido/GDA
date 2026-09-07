const jwt = require('jsonwebtoken');
const config = require('../config');
const { parse } = require('cookie');

function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || '';
  const bearerToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const cookieToken = parse(req.headers.cookie || '').gda_auth || '';
  const token = cookieToken || bearerToken;

  if (!token || !config.jwtSecret) {
    return res.status(401).json({ error: 'Autenticação obrigatória' });
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = requireAuth;