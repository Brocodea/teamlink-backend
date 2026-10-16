const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const ChatMember = require('../models/ChatMember');

// Store online users: { userId: socketId }
const onlineUsers = new Map();

const socketHandler = (io) => {

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.name} (${socket.id})`);

    // Add user to online users
    onlineUsers.set(socket.user._id.toString(), socket.id);

    // Emit online status to all
    io.emit('user_online', {
      userId: socket.user.userId,
      name: socket.user.name
    });

    // Join user's chat rooms
    socket.on('join_chats', async (data) => {
      try {
        const chatMembers = await ChatMember.find({ user: socket.user._id });

        chatMembers.forEach(cm => {
          socket.join(cm.chat.toString());
          console.log(`User ${socket.user.name} joined chat: ${cm.chat}`);
        });

        socket.emit('chats_joined', {
          success: true,
          count: chatMembers.length
        });

      } catch (error) {
        console.error('Join chats error:', error);
        socket.emit('error', { message: 'Failed to join chats' });
      }
    });

    // Join a specific chat room by ID (called when user opens a chat)
    socket.on('join_chat', async (data) => {
      try {
        const { chatId } = data;
        const isMember = await ChatMember.findOne({ chat: chatId, user: socket.user._id });
        if (!isMember) {
          return socket.emit('error', { message: 'You are not a member of this chat' });
        }
        socket.join(chatId);
        console.log(`User ${socket.user.name} joined specific chat: ${chatId}`);
        socket.emit('chat_joined', { success: true, chatId });
      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content } = data;

        if (!content || !content.trim()) {
          return socket.emit('error', { message: 'Message content is required' });
        }

        // Verify chat membership
        const isMember = await ChatMember.findOne({
          chat: chatId,
          user: socket.user._id
        });

        if (!isMember) {
          return socket.emit('error', { message: 'You are not a member of this chat' });
        }

        // Create message
        const message = await Message.create({
          content: content.trim(),
          chat: chatId,
          sender: socket.user._id,  // ✅ This uses the authenticated user
          readBy: [{ user: socket.user._id }]
        });

     
        await message.populate('sender', 'userId name email');

        // Update chat's last message
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message._id
        });

        // 🆕 DEBUG: Log what we're sending
        console.log('📤 Emitting message:', {
          messageId: message.messageId,
          senderId: message.sender.userId,
          senderName: message.sender.name,
          content: message.content
        });

        // Emit to all users in the chat room
        io.to(chatId).emit('new_message', {
          message: message
        });

        console.log(`Message sent in chat ${chatId} by ${socket.user.name}`);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('user_typing', {
        userId: socket.user.userId,
        name: socket.user.name,
        chatId
      });
    });

    // Stop typing
    socket.on('stop_typing', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('user_stop_typing', {
        userId: socket.user.userId,
        chatId
      });
    });

    // Mark messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { chatId } = data;

        await Message.updateMany(
          {
            chat: chatId,
            sender: { $ne: socket.user._id },
            'readBy.user': { $ne: socket.user._id }
          },
          {
            $push: {
              readBy: {
                user: socket.user._id,
                readAt: Date.now()
              }
            }
          }
        );

        // Notify other users in chat
        socket.to(chatId).emit('messages_read', {
          userId: socket.user.userId,
          chatId
        });

      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.name}`);

      // Remove from online users
      onlineUsers.delete(socket.user._id.toString());

      // Emit offline status
      io.emit('user_offline', {
        userId: socket.user.userId,
        name: socket.user.name
      });
    });

  });

  // Return online users list function
  return {
    getOnlineUsers: () => Array.from(onlineUsers.keys())
  };
};

module.exports = socketHandler;