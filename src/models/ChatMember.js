const mongoose = require('mongoose');

const ChatMemberSchema = new mongoose.Schema({
  chatMemberId: {
    type: String,
    unique: true
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure a user can only join a chat once
ChatMemberSchema.index({ chat: 1, user: 1 }, { unique: true });

// Generate chatMemberId before saving
ChatMemberSchema.pre('save', async function() {
  if (!this.chatMemberId) {
    this.chatMemberId = 'CHATMEM' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
});

module.exports = mongoose.model('ChatMember', ChatMemberSchema);