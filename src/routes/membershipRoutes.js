const express = require('express');
const router = express.Router();
const {
  joinTeam,
  getTeamMembers,
  addMember,
  removeMember,
  updateMemberRole
} = require('../controllers/membershipController');
const { protect } = require('../middleware/auth');
const { isMember, isAdmin } = require('../middleware/teamAuth');

// Membership routes
router.post('/join', protect, joinTeam);
router.get('/:teamId/members', protect, isMember, getTeamMembers);
router.post('/:teamId/members', protect, isAdmin, addMember);
router.delete('/:teamId/members/:userId', protect, isAdmin, removeMember);
router.patch('/:teamId/members/:userId/role', protect, isAdmin, updateMemberRole);

module.exports = router;