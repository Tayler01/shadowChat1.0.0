import express from 'express';
import { createServer } from 'http';
// The WebSocket logic is extracted to a separate module
import { setupSocket, getStats } from './socket.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
// Initialize WebSocket handling
setupSocket(server);

// Middleware
app.use(cors());
app.use(express.json());


// API endpoints for air-gapped functionality
app.get('/api/health', (req, res) => {
  const stats = getStats();
  res.json({
    status: 'online',
    users: stats.users,
    messages: stats.messages,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/export-chat', (req, res) => {
  const stats = getStats();
  res.json({
    exportedAt: new Date().toISOString(),
    totalMessages: stats.messages,
    messages: stats.history
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 ShadowChat server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`🔒 Air-gapped mode: All data stored in memory`);
});