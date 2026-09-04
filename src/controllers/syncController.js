const cloudData = new Map();

const syncController = {
  sync: async (req, res) => {
    try {
      const { key } = req.params;
      if (req.method === 'POST') {
        const { value } = req.body || {};
        cloudData.set(key, value);
      }
      const data = {
        key,
        value: cloudData.has(key) ? cloudData.get(key) : null,
        timestamp: new Date().toISOString(),
        synced: true
      };
      return res.json({ success: true, data });
    } catch (error) {
      console.error('Erro na sincronização:', error);
      return res.status(500).json({ error: 'Falha na sincronização' });
    }
  }
};

module.exports = syncController;
