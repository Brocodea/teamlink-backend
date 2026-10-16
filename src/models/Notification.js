const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    unique: true
  },
  type: {
    type: String,
    enum: ['task_assigned', 'announcement', 'team_invite', 'task_updated', 'message'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relatedId: {
    type: String  // Can be taskId, announcementId, teamId, etc.
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate notificationId before saving
NotificationSchema.pre('save', async function() {
  if (!this.notificationId) {
    this.notificationId = 'NOTIF' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);