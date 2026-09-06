const express = require('express');
const router = express.Router();
const notasController = require('../controllers/notasController');

router.get('/', notasController.get);
router.post('/', notasController.set);

module.exports = router;