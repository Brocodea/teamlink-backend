const Notification = require('../models/Notification');

// Create notification helper
exports.createNotification = async (userId, type, message, relatedId = null) => {
  try {
    await Notification.create({
      user: userId,
      type,
      message,
      relatedId
    });
  } catch (error) {
    console.error('Notification creation error:', error);
  }
};

// Send notification to all team members
exports.notifyTeamMembers = async (teamId, type, message, relatedId = null, excludeUserId = null) => {
  try {
    const Membership = require('../models/Membership');
    
    const memberships = await Membership.find({ team: teamId });
    
    const notificationPromises = memberships
      .filter(m => excludeUserId ? m.user.toString() !== excludeUserId.toString() : true)
      .map(membership => 
        Notification.create({
          user: membership.user,
          type,
          message,
          relatedId
        })
      );
    
    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Team notification error:', error);
  }
};