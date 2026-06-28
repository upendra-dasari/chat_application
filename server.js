require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

const User = require('./models/User');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
});
app.use(sessionMiddleware);

// Share session with Socket.io
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// ─── MongoDB ──────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// ─── Auth helper ─────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Serve login page as default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    const user = new User({ username, password });
    await user.save();
    req.session.userId = user._id;
    req.session.username = user.username;
    res.json({ success: true, username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    req.session.userId = user._id;
    req.session.username = user.username;
    res.json({ success: true, username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Check session (used by chat page)
app.get('/api/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ username: req.session.username });
});

// Get last 50 messages
app.get('/api/messages', requireAuth, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 }).limit(50);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Socket.io ────────────────────────────────────────────────────────────────
const onlineUsers = new Map(); // socketId -> username

io.on('connection', (socket) => {
  const username = socket.request.session.username;

  if (!username) {
    socket.disconnect();
    return;
  }

  onlineUsers.set(socket.id, username);
  console.log(`🟢 ${username} connected`);

  // Notify all about updated online users list
  io.emit('online_users', Array.from(new Set(onlineUsers.values())));

  // Handle new message
  socket.on('send_message', async (content) => {
    if (!content || !content.trim()) return;

    try {
      const message = new Message({ sender: username, content: content.trim() });
      await message.save();

      io.emit('receive_message', {
        sender: username,
        content: message.content,
        createdAt: message.createdAt
      });
    } catch (err) {
      console.error('Message save error:', err);
    }
  });

  // Handle typing indicator
  socket.on('typing', () => {
    socket.broadcast.emit('user_typing', username);
  });

  socket.on('stop_typing', () => {
    socket.broadcast.emit('user_stop_typing', username);
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    console.log(`🔴 ${username} disconnected`);
    io.emit('online_users', Array.from(new Set(onlineUsers.values())));
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
