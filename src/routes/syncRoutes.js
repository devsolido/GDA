const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');

router.get('/:key', syncController.sync);
router.post('/:key', syncController.sync);

module.exports = router;
