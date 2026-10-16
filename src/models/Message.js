const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    unique: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Generate messageId before saving
MessageSchema.pre('save', async function() {
  if (!this.messageId) {
    this.messageId = 'MSG' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
});

module.exports = mongoose.model('Message', MessageSchema);