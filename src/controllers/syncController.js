const { getValue, setValue } = require('../services/turso');

const allowedKeys = new Set([
  'gda_presencas_atrasadas', 'gda_ocorrencias', 'gda_presencas', 'gda_atividades',
  'gda_frequencias', 'gda_relatorios', 'gda_checklist', 'gda_historico_panico',
  'gda_atendimentos', 'gda_assuntos'
]);

const syncController = {
  sync: async (req, res) => {
    try {
      const { key } = req.params;
      if (!allowedKeys.has(key)) return res.status(404).json({ error: 'Recurso não encontrado' });
      if (req.method === 'POST') {
        const { value } = req.body || {};
        if (value === undefined || value === null || typeof value !== 'object') {
          return res.status(400).json({ error: 'Dados inválidos' });
        }
        await setValue(key, value);
      }
      const data = {
        key,
        value: await getValue(key),
        timestamp: new Date().toISOString(),
        synced: true
      };
      return res.json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ error: 'Falha na sincronização' });
    }
  }
};

module.exports = syncController;
