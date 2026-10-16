const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  teamId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Please add a team name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  joinCode: {
    type: String,
    unique: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Generate teamId and joinCode before saving
TeamSchema.pre('save', async function() {
  if (!this.teamId) {
    this.teamId = 'TEAM' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  
  if (!this.joinCode) {
    this.joinCode = Math.random().toString(36).substr(2, 8).toUpperCase();
  }
});

module.exports = mongoose.model('Team', TeamSchema);