const express = require('express');
const { listNotifications, markNotificationsRead } = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, listNotifications);
router.patch('/read', authenticate, markNotificationsRead);

module.exports = router;
