const syncController = {
  sync: async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const data = {
        key,
        value,
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
