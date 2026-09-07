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
      const notas = req.body?.value;
      if (!notas || typeof notas !== 'object' || Array.isArray(notas)) {
        return res.status(400).json({ error: 'Dados inválidos' });
      }
      const entradas = Object.entries(notas);
      const dadosInvalidos = entradas.length > 100 || entradas.some(([codigo, nota]) => {
        return !/^[A-Za-z0-9_-]{1,32}$/.test(codigo)
          || !nota || typeof nota !== 'object' || Array.isArray(nota)
          || ['b1', 'b2', 'b3', 'b4'].some((bimestre) => String(nota[bimestre] || '').length > 20);
      });
      if (dadosInvalidos) return res.status(400).json({ error: 'Dados inválidos' });
      await setNotas(notas);
      return res.json({ success: true, value: await getNotas() });
    } catch (error) {
      return res.status(500).json({ error: 'Falha ao salvar notas' });
    }
  }
};

module.exports = notasController;