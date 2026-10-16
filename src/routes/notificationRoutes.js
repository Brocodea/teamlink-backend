const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');


router.get('/', protect, getMyNotifications);
router.patch('/read-all', protect, markAllAsRead);          
router.delete('/clear-read', protect, clearReadNotifications); 
router.patch('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;