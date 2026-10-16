const Team = require('../models/Team');
const Membership = require('../models/Membership');
const User = require('../models/User');

// @desc    Join team via join code
// @route   POST /api/teams/join
// @access  Private
exports.joinTeam = async (req, res) => {
  try {
    const { joinCode } = req.body;

    if (!joinCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a join code'
      });
    }

    // Find team by join code
    const team = await Team.findOne({ joinCode: joinCode.toUpperCase() });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Invalid join code'
      });
    }

    // Check if already a member
    const existingMembership = await Membership.findOne({
      team: team._id,
      user: req.user._id
    });

    if (existingMembership) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this team'
      });
    }

    // Create membership
    const membership = await Membership.create({
      team: team._id,
      user: req.user._id,
      role: 'Member'
    });

    res.status(201).json({
      success: true,
      message: 'Successfully joined the team',
      data: {
        teamId: team.teamId,
        teamName: team.name,
        role: membership.role,
        joinedAt: membership.joinedAt
      }
    });

  } catch (error) {
    console.error('Join Team Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while joining team',
      error: error.message
    });
  }
};

// @desc    Get team members
// @route   GET /api/teams/:teamId/members
// @access  Private (must be team member)
exports.getTeamMembers = async (req, res) => {
  try {
    const memberships = await Membership.find({ team: req.params.teamId })
      .populate('user', 'userId name email')
      .sort('-createdAt');

    const members = memberships.map(membership => ({
      membershipId: membership.membershipId,
      userId: membership.user.userId,
      name: membership.user.name,
      email: membership.user.email,
      role: membership.role,
      joinedAt: membership.joinedAt
    }));

    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });

  } catch (error) {
    console.error('Get Members Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching members',
      error: error.message
    });
  }
};

// @desc    Add member to team (by email)
// @route   POST /api/teams/:teamId/members
// @access  Private (Admin only)
exports.addMember = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user email'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Check if already a member
    const existingMembership = await Membership.findOne({
      team: req.params.teamId,
      user: user._id
    });

    if (existingMembership) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this team'
      });
    }

    // Create membership
    const membership = await Membership.create({
      team: req.params.teamId,
      user: user._id,
      role: 'Member'
    });

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: {
        membershipId: membership.membershipId,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: membership.role
      }
    });

  } catch (error) {
    console.error('Add Member Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding member',
      error: error.message
    });
  }
};

// @desc    Remove member from team
// @route   DELETE /api/teams/:teamId/members/:userId
// @access  Private (Admin only)
exports.removeMember = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const membership = await Membership.findOne({
      team: req.params.teamId,
      user: user._id
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this team'
      });
    }

    // Prevent removing the last admin
    if (membership.role === 'Admin') {
      const adminCount = await Membership.countDocuments({
        team: req.params.teamId,
        role: 'Admin'
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove the last admin. Assign another admin first.'
        });
      }
    }

    await membership.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Remove Member Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing member',
      error: error.message
    });
  }
};

// @desc    Update member role
// @route   PATCH /api/teams/:teamId/members/:userId/role
// @access  Private (Admin only)
exports.updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['Admin', 'Member'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid role (Admin or Member)'
      });
    }

    const user = await User.findOne({ userId: req.params.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const membership = await Membership.findOne({
      team: req.params.teamId,
      user: user._id
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this team'
      });
    }

    // If demoting from Admin, check if last admin
    if (membership.role === 'Admin' && role === 'Member') {
      const adminCount = await Membership.countDocuments({
        team: req.params.teamId,
        role: 'Admin'
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the last admin'
        });
      }
    }

    membership.role = role;
    await membership.save();

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      data: {
        userId: user.userId,
        name: user.name,
        role: membership.role
      }
    });

  } catch (error) {
    console.error('Update Role Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating role',
      error: error.message
    });
  }
};