const Team = require('../models/Team');
const Membership = require('../models/Membership');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private
exports.createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a team name'
      });
    }

    // Create team
    const team = await Team.create({
      name,
      description,
      createdBy: req.user._id
    });

    // Add creator as Admin member
    await Membership.create({
      team: team._id,
      user: req.user._id,
      role: 'Admin'
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: {
        teamId: team.teamId,
        name: team.name,
        description: team.description,
        joinCode: team.joinCode,
        createdAt: team.createdAt
      }
    });

  } catch (error) {
    console.error('Create Team Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating team',
      error: error.message
    });
  }
};

// @desc    Get all teams for logged-in user
// @route   GET /api/teams
// @access  Private
exports.getMyTeams = async (req, res) => {
  try {
    // Find all memberships for the user
    const memberships = await Membership.find({ user: req.user._id })
      .populate('team')
      .sort('-createdAt');

    const teams = memberships.map(membership => ({
      _id: membership.team._id, 
      teamId: membership.team.teamId,
      name: membership.team.name,
      description: membership.team.description,
      role: membership.role,
      joinCode: membership.team.joinCode,
      memberCount: 0, // Will calculate below
      joinedAt: membership.joinedAt
    }));

    // Get member count for each team
    for (let team of teams) {
      const count = await Membership.countDocuments({ 
        team: memberships.find(m => m.team.teamId === team.teamId).team._id 
      });
      team.memberCount = count;
    }

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });

  } catch (error) {
    console.error('Get Teams Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teams',
      error: error.message
    });
  }
};

// @desc    Get single team details
// @route   GET /api/teams/:teamId
// @access  Private (must be member)
exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate('createdBy', 'name email');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Get member count
    const memberCount = await Membership.countDocuments({ team: team._id });

    res.status(200).json({
      success: true,
      data: {
        teamId: team.teamId,
        name: team.name,
        description: team.description,
        joinCode: team.joinCode,
        createdBy: team.createdBy,
        memberCount,
        userRole: req.membership.role,
        createdAt: team.createdAt
      }
    });

  } catch (error) {
    console.error('Get Team Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team',
      error: error.message
    });
  }
};

// @desc    Update team
// @route   PUT /api/teams/:teamId
// @access  Private (Admin only)
exports.updateTeam = async (req, res) => {
  try {
    const { name, description } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (description !== undefined) fieldsToUpdate.description = description;

    const team = await Team.findByIdAndUpdate(
      req.params.teamId,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: {
        teamId: team.teamId,
        name: team.name,
        description: team.description,
        joinCode: team.joinCode
      }
    });

  } catch (error) {
    console.error('Update Team Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating team',
      error: error.message
    });
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:teamId
// @access  Private (Admin only)
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Delete all memberships
    await Membership.deleteMany({ team: team._id });

    // Delete team
    await team.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully'
    });

  } catch (error) {
    console.error('Delete Team Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting team',
      error: error.message
    });
  }
};