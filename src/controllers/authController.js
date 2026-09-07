const config = require('../config');
const jwt = require('jsonwebtoken');
const { serialize, parse } = require('cookie');

const authCookie = {
  name: 'gda_auth',
  options: {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  }
};

function getToken(req) {
  const authorization = req.headers.authorization || '';
  const bearerToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  return parse(req.headers.cookie || '')[authCookie.name] || bearerToken;
}

const authController = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
      }
      if (!config.authUsername || !config.authPassword || !config.jwtSecret) {
        return res.status(503).json({ error: 'Autenticação indisponível' });
      }
      if (username === config.authUsername && password === config.authPassword) {
        const token = jwt.sign({ username, role: 'admin' }, config.jwtSecret, { expiresIn: '7d' });
        res.setHeader('Set-Cookie', serialize(authCookie.name, token, authCookie.options));
        return res.json({ user: { username, role: 'admin' } });
      }
      return res.status(401).json({ error: 'Credenciais inválidas' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },
  verify: async (req, res) => {
    try {
      const token = getToken(req);
      if (!token) return res.status(401).json({ error: 'Token não fornecido' });
      const decoded = jwt.verify(token, config.jwtSecret);
      return res.json({ valid: true, user: decoded });
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  }
};

module.exports = authController;
