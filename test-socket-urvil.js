const io = require('socket.io-client');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OGE0MmE3NTY2MzU1NWMzMTI5YjcyNSIsImlhdCI6MTc3MTcxNTI5MSwiZXhwIjoxNzcyMzIwMDkxfQ.ooSUr69qzYUl8IV8zscMPDBBZ9E9sWp7fgtBNv4TJHo';
const CHAT_ID = '699a371f1abb10d3add78ac3';
const USER_NAME = 'Urvil';

const socket = io('http://localhost:5000', {
  auth: { token: TOKEN }
});

socket.on('connect', () => {
  console.log(`[${USER_NAME}] ✅ Connected`);
  socket.emit('join_chats', {});
});

socket.on('chats_joined', () => {
  console.log(`[${USER_NAME}] ✅ Joined chats`);
});

socket.on('new_message', (data) => {
  console.log(`[${USER_NAME}] 📨 Message from ${data.message.sender.name}: ${data.message.content}`);
});

// Send a message every 5 seconds
setInterval(() => {
  socket.emit('send_message', {
    chatId: CHAT_ID,
    content: `Message from ${USER_NAME} at ${new Date().toLocaleTimeString()}`
  });
}, 5000);