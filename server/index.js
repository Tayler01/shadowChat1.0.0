import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
// The WebSocket logic is extracted to a separate module
import { setupSocket } from './socket.js';
import { getChatHistory } from './models/messages.js';
import { updateProfileImage } from './models/users.js';
import cors from 'cors';

const app = express();
const server = createServer(app);
// Initialize WebSocket handling
setupSocket(server);

// Middleware
app.use(cors());
app.use(express.json());



// Fetch full chat history from database
app.get('/api/chat-history', async (req, res) => {
  try {
    const history = await getChatHistory();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Store/update user profile image
app.post('/api/users/:id/profile-image', async (req, res) => {
  const { id } = req.params;
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'Image data required' });
  }
  try {
    await updateProfileImage(id, image);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 ShadowChat server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`📦 Connected to Supabase for persistence`);
});