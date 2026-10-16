const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  chatId: {
    type: String,
    unique: true
  },
  chatName: {
    type: String,
    trim: true
  },
  chatType: {
    type: String,
    enum: ['team', 'direct'],
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  // For direct messages - store both user IDs
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate chatId before saving
ChatSchema.pre('save', async function() {
  if (!this.chatId) {
    this.chatId = 'CHAT' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
});

module.exports = mongoose.model('Chat', ChatSchema);