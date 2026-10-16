const Announcement = require('../models/Announcement');
const Team = require('../models/Team');
const { notifyTeamMembers } = require('../utils/notification');

// @desc    Create announcement
// @route   POST /api/teams/:teamId/announcements
// @access  Private (Admin only)
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and message'
      });
    }

    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const announcement = await Announcement.create({
      title,
      message,
      team: team._id,
      createdBy: req.user._id
    });

    await announcement.populate('createdBy', 'userId name email');
    await announcement.populate('team', 'teamId name');

    // Notify all team members
    await notifyTeamMembers(
      team._id,
      'announcement',
      `New announcement in ${team.name}: ${title}`,
      announcement.announcementId,
      req.user._id
    );

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement
    });

  } catch (error) {
    console.error('Create Announcement Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating announcement',
      error: error.message
    });
  }
};

// @desc    Get team announcements
// @route   GET /api/teams/:teamId/announcements
// @access  Private (Team member)
exports.getTeamAnnouncements = async (req, res) => {
  try {
    let teamId = req.params.teamId;
    let team;

    // Check if it's a MongoDB ObjectId or custom teamId
    if (teamId.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a MongoDB _id
      team = await Team.findById(teamId);
    } else {
      // It's a custom teamId
      team = await Team.findOne({ teamId });
    }

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const announcements = await Announcement.find({ team: team._id })
      .populate('createdBy', 'userId name email')
      .populate('team', 'teamId name')
      .sort('-createdAt')
      .limit(20);

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });

  } catch (error) {
    console.error('Get Announcements Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching announcements',
      error: error.message
    });
  }
};

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Private (Team member)
exports.getAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'userId name email')
      .populate('team', 'teamId name');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.status(200).json({
      success: true,
      data: announcement
    });

  } catch (error) {
    console.error('Get Announcement Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching announcement',
      error: error.message
    });
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private (Admin only)
exports.updateAnnouncement = async (req, res) => {
  try {
    let announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    const { title, message } = req.body;

    const fieldsToUpdate = {};
    if (title) fieldsToUpdate.title = title;
    if (message) fieldsToUpdate.message = message;

    announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'userId name email')
      .populate('team', 'teamId name');

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement
    });

  } catch (error) {
    console.error('Update Announcement Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating announcement',
      error: error.message
    });
  }
};


// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private (Admin only)
exports.updateAnnouncement = async (req, res) => {
  try {
    let announcement = await Announcement.findById(req.params.id).populate('team');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user is admin of the team
    const Membership = require('../models/Membership');
    const membership = await Membership.findOne({
      team: announcement.team._id,
      user: req.user._id,
      role: 'Admin'
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized. Admin access required.'
      });
    }

    const { title, message } = req.body;

    const fieldsToUpdate = {};
    if (title) fieldsToUpdate.title = title;
    if (message) fieldsToUpdate.message = message;

    announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'userId name email')
      .populate('team', 'teamId name');

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement
    });

  } catch (error) {
    console.error('Update Announcement Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating announcement',
      error: error.message
    });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Admin only)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Populate team to get team details for authorization check
    await announcement.populate('team');

    // Check if user is admin of the team
    const Membership = require('../models/Membership');
    const membership = await Membership.findOne({
      team: announcement.team._id,
      user: req.user._id,
      role: 'Admin'
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized. Admin access required.'
      });
    }

    await announcement.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    console.error('Delete Announcement Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting announcement',
      error: error.message
    });
  }
};

