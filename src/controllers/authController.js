const config = require('../config');
const jwt = require('jsonwebtoken');

const authController = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
      }
      if (username === config.authUsername && password === config.authPassword) {
        const token = jwt.sign({ username, role: 'admin' }, config.jwtSecret, { expiresIn: '7d' });
        return res.json({ token, user: { username, role: 'admin' } });
      }
      return res.status(401).json({ error: 'Credenciais inválidas' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },
  verify: async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Token não fornecido' });
      const decoded = jwt.verify(token, config.jwtSecret);
      return res.json({ valid: true, user: decoded });
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  }
};

module.exports = authController;
