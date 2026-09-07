const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const requireAuth = require('../middleware/auth');

router.get('/:key', requireAuth, syncController.sync);
router.post('/:key', requireAuth, syncController.sync);

module.exports = router;
