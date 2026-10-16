const express = require('express');
const router = express.Router();
const {
  createAnnouncement,
  getTeamAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');
const { protect } = require('../middleware/auth');
const { isMember, isAdmin } = require('../middleware/teamAuth');

// Team announcements (these will be mounted on /api/teams)
router.post('/:teamId/announcements', protect, isAdmin, createAnnouncement);
router.get('/:teamId/announcements', protect, isMember, getTeamAnnouncements);

module.exports = router;