const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getChatMessages,
  markAsRead
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// Message routes (chatId in URL)
router.post('/:chatId/messages', protect, sendMessage);
router.get('/:chatId/messages', protect, getChatMessages);
router.patch('/:chatId/read', protect, markAsRead);

module.exports = router;