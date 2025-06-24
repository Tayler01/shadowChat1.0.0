import { Server } from 'socket.io';
import { upsertUser } from './models/users.js';
import { saveMessage } from './models/messages.js';

// In-memory store for connected users and chat history
const activeUsers = new Map();
const chatHistory = [];
const MAX_HISTORY = 100;

export function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', socket => {
    console.log(`User connected: ${socket.id}`);

    socket.on('user_join', async userData => {
      const user = {
        id: socket.id,
        username: userData.username || `User_${socket.id.slice(0, 6)}`,
        joinedAt: new Date().toISOString(),
      };
      activeUsers.set(socket.id, user);

      await upsertUser({ id: user.id, username: user.username });

      socket.emit('chat_history', chatHistory);
      io.emit('users_update', Array.from(activeUsers.values()));

      const joinMessage = {
        id: Date.now(),
        type: 'system',
        content: `${user.username} joined the chat`,
        timestamp: new Date().toISOString(),
      };
      io.emit('new_message', joinMessage);
      addToHistory(joinMessage);
      await saveMessage(joinMessage);
    });

    socket.on('send_message', async messageData => {
      const user = activeUsers.get(socket.id);
      if (!user) return;

      const message = {
        id: Date.now(),
        type: 'user',
        content: messageData.content,
        username: user.username,
        userId: socket.id,
        timestamp: new Date().toISOString(),
      };
      io.emit('new_message', message);
      addToHistory(message);
      await saveMessage(message);
    });

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

    socket.on('disconnect', async () => {
      const user = activeUsers.get(socket.id);
      if (user) {
        activeUsers.delete(socket.id);
        io.emit('users_update', Array.from(activeUsers.values()));
        const leaveMessage = {
          id: Date.now(),
          type: 'system',
          content: `${user.username} left the chat`,
          timestamp: new Date().toISOString(),
        };
        io.emit('new_message', leaveMessage);
        addToHistory(leaveMessage);
        await saveMessage(leaveMessage);
      }
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  function addToHistory(message) {
    chatHistory.push(message);
    if (chatHistory.length > MAX_HISTORY) {
      chatHistory.shift();
    }
  }
}

export function getStats() {
  return {
    users: activeUsers.size,
    messages: chatHistory.length,
    history: chatHistory,
  };
}

