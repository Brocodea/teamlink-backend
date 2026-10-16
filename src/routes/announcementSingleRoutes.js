const express = require('express');
const router = express.Router();
const {
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');
const { protect } = require('../middleware/auth');

// Single announcement routes (admin check is in controller)
router.get('/:id', protect, getAnnouncement);
router.put('/:id', protect, updateAnnouncement);
router.delete('/:id', protect, deleteAnnouncement);

module.exports = router;