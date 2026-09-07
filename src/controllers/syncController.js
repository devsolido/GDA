const { getValue, setValue } = require('../services/turso');

const syncController = {
  sync: async (req, res) => {
    try {
      const { key } = req.params;
      if (req.method === 'POST') {
        const { value } = req.body || {};
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
