const io = require('socket.io-client');

// CONFIGURATION - REPLACE THESE VALUES
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OGI4ODA2YjE4OWZhMGU5YTAyNDcxYyIsImlhdCI6MTc3MTcxNDQ3MCwiZXhwIjoxNzcyMzE5MjcwfQ.DdnhMbhSySqyQk_dWfoxgtNmpGOKXJYPOFGByFTsNQI'; // Paste your token from Postman login
const CHAT_ID = '699a371f1abb10d3add78ac3'; // Your chat ID

console.log('🚀 Connecting to TeamLink WebSocket...\n');

const socket = io('http://localhost:5000', {
  auth: { token: TOKEN }
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to server!');
  console.log('Socket ID:', socket.id);
  console.log('\n-----------------------------------\n');
  
  // Join chats
  socket.emit('join_chats', {});
});

socket.on('chats_joined', (data) => {
  console.log('✅ Joined chats successfully!');
  console.log('Number of chats:', data.count);
  console.log('\n-----------------------------------\n');
  
  // Send a test message after 2 seconds
  setTimeout(() => {
    console.log('📤 Sending test message...');
    socket.emit('send_message', {
      chatId: CHAT_ID,
      content: 'Hello from WebSocket test script! 🚀'
    });
  }, 2000);
});

// Receive new messages
socket.on('new_message', (data) => {
  console.log('\n📨 NEW MESSAGE RECEIVED:');
  console.log('From:', data.message.sender.name);
  console.log('Content:', data.message.content);
  console.log('Time:', new Date(data.message.createdAt).toLocaleTimeString());
  console.log('-----------------------------------\n');
});

// Typing indicators
socket.on('user_typing', (data) => {
  console.log(`⌨️  ${data.name} is typing...`);
});

socket.on('user_stop_typing', (data) => {
  console.log(`⌨️  ${data.name} stopped typing`);
});

// User status
socket.on('user_online', (data) => {
  console.log(`🟢 ${data.name} is online`);
});

socket.on('user_offline', (data) => {
  console.log(`🔴 ${data.name} is offline`);
});

// Errors
socket.on('error', (data) => {
  console.error('❌ Error:', data.message);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection Error:', error.message);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

// Keep script running
console.log('Listening for messages... (Press Ctrl+C to exit)\n');