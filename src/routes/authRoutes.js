const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const security = require('../middleware/security');

router.post('/login', security.loginRateLimit, authController.login);
router.get('/verify', authController.verify);

module.exports = router;
