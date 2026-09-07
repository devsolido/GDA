const express = require('express');
const router = express.Router();
const notasController = require('../controllers/notasController');
const requireAuth = require('../middleware/auth');

router.get('/', requireAuth, notasController.get);
router.post('/', requireAuth, notasController.set);

module.exports = router;