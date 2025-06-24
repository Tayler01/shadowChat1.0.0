import express from 'express';
import { createServer } from 'http';
// The WebSocket logic is extracted to a separate module
import { setupSocket, getStats } from './socket.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';
import { getChatHistory } from './models/messages.js';
import { updateProfileImage } from './models/users.js';
import supabase from './supabaseClient.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const upload = multer({ storage: multer.memoryStorage() });
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

app.get('/api/chat-history', async (req, res) => {
  const { data, error } = await getChatHistory(100);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

app.post('/api/profile-image', upload.single('image'), async (req, res) => {
  const { userId } = req.body;
  if (!userId || !req.file) {
    return res.status(400).json({ error: 'userId and image are required' });
  }
  const ext = path.extname(req.file.originalname);
  const fileName = `${userId}/${Date.now()}${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true
    });
  if (uploadError) {
    return res.status(500).json({ error: uploadError.message });
  }
  const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(fileName);
  const { error: updateErr } = await updateProfileImage(userId, publicUrl.publicUrl);
  if (updateErr) {
    return res.status(500).json({ error: updateErr.message });
  }
  res.json({ url: publicUrl.publicUrl });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 ShadowChat server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`🔒 Air-gapped mode: All data stored in memory`);
});