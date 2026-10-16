const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  announcementId: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Please add an announcement title'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Please add a message'],
    trim: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Generate announcementId before saving
AnnouncementSchema.pre('save', async function() {
  if (!this.announcementId) {
    this.announcementId = 'ANN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);