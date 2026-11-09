const express = require('express');
const { changePassword, login, me, register, updateProfile } = require('../controllers/authController');
const { authenticate, requireCreator } = require('../middleware/auth');

const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.patch('/profile', authenticate, updateProfile);
router.patch('/password', authenticate, requireCreator, changePassword);

module.exports = router;
