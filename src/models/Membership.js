const mongoose = require('mongoose');

const MembershipSchema = new mongoose.Schema({
  membershipId: {
    type: String,
    unique: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Member'],
    default: 'Member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure a user can only join a team once
MembershipSchema.index({ team: 1, user: 1 }, { unique: true });

// Generate membershipId before saving
MembershipSchema.pre('save', async function() {
  if (!this.membershipId) {
    this.membershipId = 'MEM' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
});

module.exports = mongoose.model('Membership', MembershipSchema);