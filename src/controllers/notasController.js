const { getNotas, setNotas } = require('../services/turso');

const notasController = {
  get: async (req, res) => {
    try {
      return res.json({ success: true, value: await getNotas() });
    } catch (error) {
      return res.status(500).json({ error: 'Falha ao carregar notas' });
    }
  },
  set: async (req, res) => {
    try {
      await setNotas(req.body?.value || {});
      return res.json({ success: true, value: await getNotas() });
    } catch (error) {
      return res.status(500).json({ error: 'Falha ao salvar notas' });
    }
  }
};

module.exports = notasController;