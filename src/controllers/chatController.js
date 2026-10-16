const Chat = require('../models/Chat');
const ChatMember = require('../models/ChatMember');
const Message = require('../models/Message');
const Team = require('../models/Team');
const User = require('../models/User');
const Membership = require('../models/Membership');

// @desc    Get or create team chat
// @route   POST /api/chats/team
// @access  Private
exports.getOrCreateTeamChat = async (req, res) => {
  try {
    const { teamId } = req.body;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide teamId'
      });
    }

    // Find team
    const team = await Team.findOne({ teamId });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is team member
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

    // Check if team chat already exists
    let chat = await Chat.findOne({ team: team._id, chatType: 'team' });

    if (!chat) {
      // Create team chat
      chat = await Chat.create({
        chatName: `${team.name} - General`,
        chatType: 'team',
        team: team._id,
        createdBy: req.user._id
      });
    }

    // Ensure ALL current team members have a ChatMember record.
    // Uses create() so the pre-save hook runs and chatMemberId is generated.
    // Duplicate key errors (code 11000) mean the record already exists — ignore them.
    const teamMembers = await Membership.find({ team: team._id });
    for (const member of teamMembers) {
      try {
        await ChatMember.create({ chat: chat._id, user: member.user });
      } catch (err) {
        if (err.code !== 11000) throw err;
      }
    }

    await chat.populate('team', 'teamId name');
    await chat.populate('lastMessage');

    res.status(200).json({
      success: true,
      data: chat
    });

  } catch (error) {
    console.error('Get/Create Team Chat Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get or create direct chat
// @route   POST /api/chats/direct
// @access  Private
exports.getOrCreateDirectChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId'
      });
    }

    const otherUser = await User.findOne({ userId });
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if direct chat already exists
    let chat = await Chat.findOne({
      chatType: 'direct',
      participants: { $all: [req.user._id, otherUser._id] }
    });

    if (!chat) {
      // Create direct chat
      chat = await Chat.create({
        chatName: null,
        chatType: 'direct',
        participants: [req.user._id, otherUser._id],
        createdBy: req.user._id
      });

      // Add both users to chat members
      await ChatMember.create([
        { chat: chat._id, user: req.user._id },
        { chat: chat._id, user: otherUser._id }
      ]);
    }

    await chat.populate('participants', 'userId name email');
    await chat.populate('lastMessage');

    res.status(200).json({
      success: true,
      data: chat
    });

  } catch (error) {
    console.error('Get/Create Direct Chat Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user's chats
// @route   GET /api/chats
// @access  Private
exports.getMyChats = async (req, res) => {
  try {
    const chatMembers = await ChatMember.find({ user: req.user._id })
      .populate({
        path: 'chat',
        populate: [
          { path: 'team', select: 'teamId name' },
          { path: 'participants', select: 'userId name email' },
          { path: 'lastMessage', populate: { path: 'sender', select: 'name' } }
        ]
      })
      .sort('-updatedAt');

    const chats = chatMembers.map(cm => cm.chat);

    // Get unread count for each chat
    for (let chat of chats) {
      const unreadCount = await Message.countDocuments({
        chat: chat._id,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id }
      });
      chat._doc.unreadCount = unreadCount;
    }

    res.status(200).json({
      success: true,
      count: chats.length,
      data: chats
    });

  } catch (error) {
    console.error('Get Chats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single chat
// @route   GET /api/chats/:id
// @access  Private
exports.getChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('team', 'teamId name')
      .populate('participants', 'userId name email')
      .populate('lastMessage');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is member
    const isMember = await ChatMember.findOne({
      chat: chat._id,
      user: req.user._id
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this chat'
      });
    }

    res.status(200).json({
      success: true,
      data: chat
    });

  } catch (error) {
    console.error('Get Chat Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};