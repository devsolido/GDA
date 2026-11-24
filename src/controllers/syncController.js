const { getSectionValue, setSectionValue } = require('../services/turso');

const allowedKeys = new Set([
  'gda_presencas_atrasadas', 'gda_ocorrencias', 'gda_presencas', 'gda_atividades',
  'gda_frequencias', 'gda_relatorios', 'gda_checklist',
  'gda_atendimentos', 'gda_assuntos', 'gda_avaliacoes', 'gda_turmas',
  'gda_disciplinas_finalizadas', 'gda_semestre_atual'
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
        if (key === 'gda_turmas' && (
          !Array.isArray(value)
          || value.length > 100
          || value.some((turma) => !turma || typeof turma !== 'object' || Array.isArray(turma)
            || typeof turma.cod !== 'string' || !/^[A-Za-z0-9_-]{1,32}$/.test(turma.cod)
            || typeof turma.nome !== 'string' || turma.nome.trim().length < 1 || turma.nome.length > 120
            || typeof turma.professor !== 'string' || turma.professor.trim().length < 1 || turma.professor.length > 200
            || (turma.turma !== undefined && (typeof turma.turma !== 'string' || turma.turma.length > 80)))
        )) {
          return res.status(400).json({ error: 'Disciplinas inválidas' });
        }
        await setSectionValue(key, value);
      }
      const data = {
        key,
        value: await getSectionValue(key),
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
