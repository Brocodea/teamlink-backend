const express = require('express');
const router = express.Router();
const {
  createTeam,
  getMyTeams,
  getTeam,
  updateTeam,
  deleteTeam
} = require('../controllers/teamController');
const { protect } = require('../middleware/auth');
const { isMember, isAdmin } = require('../middleware/teamAuth');

// Team routes
router.post('/', protect, createTeam);
router.get('/', protect, getMyTeams);
router.get('/:teamId', protect, isMember, getTeam);
router.put('/:teamId', protect, isAdmin, updateTeam);
router.delete('/:teamId', protect, isAdmin, deleteTeam);

module.exports = router;