const express = require('express');
const router = express.Router();
const {
  getOrCreateTeamChat,
  getOrCreateDirectChat,
  getMyChats,
  getChat
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// Chat routes
router.post('/team', protect, getOrCreateTeamChat);
router.post('/direct', protect, getOrCreateDirectChat);
router.get('/', protect, getMyChats);
router.get('/:id', protect, getChat);

module.exports = router;