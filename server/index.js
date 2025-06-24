import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Store active users and messages in memory (for air-gapped systems)
const activeUsers = new Map();
const chatHistory = [];
const MAX_HISTORY = 100; // Limit chat history for performance

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user joining
  socket.on('user_join', (userData) => {
    const user = {
      id: socket.id,
      username: userData.username || `User_${socket.id.slice(0, 6)}`,
      joinedAt: new Date().toISOString()
    };
    
    activeUsers.set(socket.id, user);
    
    // Send chat history to new user
    socket.emit('chat_history', chatHistory);
    
    // Broadcast user list update
    io.emit('users_update', Array.from(activeUsers.values()));
    
    // Broadcast join message
    const joinMessage = {
      id: Date.now(),
      type: 'system',
      content: `${user.username} joined the chat`,
      timestamp: new Date().toISOString()
    };
    
    io.emit('new_message', joinMessage);
    addToHistory(joinMessage);
  });

  // Handle new messages
  socket.on('send_message', (messageData) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    const message = {
      id: Date.now(),
      type: 'user',
      content: messageData.content,
      username: user.username,
      userId: socket.id,
      timestamp: new Date().toISOString()
    };

    // Broadcast message to all clients
    io.emit('new_message', message);
    addToHistory(message);
  });

  // Handle typing indicators
  socket.on('typing_start', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      socket.broadcast.emit('user_typing', { username: user.username, isTyping: true });
    }
  });

  socket.on('typing_stop', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      socket.broadcast.emit('user_typing', { username: user.username, isTyping: false });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      activeUsers.delete(socket.id);
      
      // Broadcast user list update
      io.emit('users_update', Array.from(activeUsers.values()));
      
      // Broadcast leave message
      const leaveMessage = {
        id: Date.now(),
        type: 'system',
        content: `${user.username} left the chat`,
        timestamp: new Date().toISOString()
      };
      
      io.emit('new_message', leaveMessage);
      addToHistory(leaveMessage);
    }
    
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Helper function to manage chat history
function addToHistory(message) {
  chatHistory.push(message);
  if (chatHistory.length > MAX_HISTORY) {
    chatHistory.shift(); // Remove oldest message
  }
}

// API endpoints for air-gapped functionality
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online', 
    users: activeUsers.size,
    messages: chatHistory.length,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/export-chat', (req, res) => {
  res.json({
    exportedAt: new Date().toISOString(),
    totalMessages: chatHistory.length,
    messages: chatHistory
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 ShadowChat server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`🔒 Air-gapped mode: All data stored in memory`);
});