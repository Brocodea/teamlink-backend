const Membership = require('../models/Membership');
const Team = require('../models/Team');


// Check if user is a member of the team
exports.isMember = async (req, res, next) => {
  try {
    // Get team ID from params (could be MongoDB _id or custom teamId)
    let teamId = req.params.teamId || req.params.id;
    
    // Find team
    let team;
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

    const membership = await Membership.findOne({
      team: team._id,
      user: req.user._id
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    req.membership = membership;
    req.team = team; // Add team to request
    next();
  } catch (error) {
    console.error('isMember Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Check if user is admin of the team
exports.isAdmin = async (req, res, next) => {
  try {
    console.log('DEBUG - req.params:', req.params);
    console.log('DEBUG - teamId value:', req.params.teamId);
    
    // Get team ID from params
    let teamId = req.params.teamId || req.params.id;
    
    console.log('DEBUG - Checking if MongoDB _id format:', teamId.match(/^[0-9a-fA-F]{24}$/));
    
    // Find team
    let team;
    if (teamId.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a MongoDB _id
      console.log('DEBUG - Searching by MongoDB _id');
      team = await Team.findById(teamId);
      console.log('DEBUG - Team found by _id:', team);
    } else {
      // It's a custom teamId
      console.log('DEBUG - Searching by custom teamId');
      team = await Team.findOne({ teamId });
      console.log('DEBUG - Team found by teamId:', team);
    }

    if (!team) {
      console.log('DEBUG - No team found!');
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    console.log('DEBUG - Team found:', team._id, team.name);
    console.log('DEBUG - Looking for membership with user:', req.user._id);

    const membership = await Membership.findOne({
      team: team._id,
      user: req.user._id,
      role: 'Admin'
    });

    console.log('DEBUG - Membership found:', membership);

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized. Admin access required.'
      });
    }

    req.membership = membership;
    req.team = team;
    next();
  } catch (error) {
    console.error('isAdmin Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};