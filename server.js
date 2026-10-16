const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');
const socketHandler = require('./src/socket/socketHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: '*', // In production, specify your frontend URL
    methods: ['GET', 'POST']
  }
});

// Initialize socket handler
socketHandler(io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible in routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/teams', require('./src/routes/teamRoutes'));
app.use('/api/teams', require('./src/routes/membershipRoutes'));
app.use('/api/teams', require('./src/routes/announcementRoutes'));
app.use('/api/announcements', require('./src/routes/announcementSingleRoutes'));
app.use('/api/tasks', require('./src/routes/taskRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/chats', require('./src/routes/chatRoutes'));        // 🆕 NEW
app.use('/api/chats', require('./src/routes/messageRoutes'));     // 🆕 NEW

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'TeamLink API with WebSocket is running!',
    version: '1.0.0',
    websocket: 'Socket.IO enabled'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`💬 WebSocket ready on ws://localhost:${PORT}`);
});