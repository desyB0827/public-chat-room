require('dotenv').config();
const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-this-password';
const DATA_DIR = path.join(__dirname, 'data');
const BLOCKED_PATH = path.join(DATA_DIR, 'blocked.json');
const EMOJIS_PATH = path.join(DATA_DIR, 'emojis.json');

const DEFAULT_EMOJIS = {
  ':fire:': '🔥',
  ':party:': '🎉',
  ':heart:': '❤️',
  ':rocket:': '🚀',
  ':laugh:': '😂',
  ':star:': '⭐',
  ':wave:': '👋',
  ':thumbsup:': '👍',
  ':eyes:': '👀'
};

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function loadBlockedUsers() {
  return readJson(BLOCKED_PATH, []);
}

function loadCustomEmojis() {
  const saved = readJson(EMOJIS_PATH, DEFAULT_EMOJIS);
  return { ...DEFAULT_EMOJIS, ...saved };
}

function saveBlockedUsers() {
  writeJson(BLOCKED_PATH, state.blockedUsers);
}

function saveCustomEmojis() {
  writeJson(EMOJIS_PATH, state.customEmojis);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeUsername(value) {
  const cleaned = String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 24);

  return cleaned || 'Guest';
}

function sanitizeMessage(value) {
  const text = String(value || '').trim();
  return text.slice(0, 500);
}

function isBlockedUser(username) {
  const target = normalizeUsername(username).toLowerCase();
  return state.blockedUsers.some((item) => item.username.toLowerCase() === target);
}

function formatInlineEmojis(messageText) {
  let output = String(messageText || '');

  Object.entries(state.customEmojis).forEach(([shortcut, emoji]) => {
    const pattern = new RegExp(escapeRegExp(shortcut), 'gi');
    output = output.replace(pattern, emoji);
  });

  return output;
}

const state = {
  blockedUsers: loadBlockedUsers(),
  customEmojis: loadCustomEmojis()
};

ensureDataDir();
if (!fs.existsSync(BLOCKED_PATH)) {
  saveBlockedUsers();
}
if (!fs.existsSync(EMOJIS_PATH)) {
  saveCustomEmojis();
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/room-info', (req, res) => {
  res.json({
    roomName: 'Public Chat Room',
    adminConfigured: Boolean(process.env.ADMIN_PASSWORD),
    adminPasswordHint: process.env.ADMIN_PASSWORD ? 'configured' : 'default-secret',
    blockedCount: state.blockedUsers.length,
    emojiCount: Object.keys(state.customEmojis).length
  });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'public-chat-room' });
});

io.on('connection', (socket) => {
  socket.emit('emoji:catalog', { emojis: state.customEmojis });
  socket.emit('admin:blocked-list', { blocked: state.blockedUsers });

  socket.on('join', ({ username }) => {
    const cleanedName = normalizeUsername(username);

    if (isBlockedUser(cleanedName)) {
      socket.emit('error', {
        message: 'You are blocked from this room.',
        blocked: true
      });
      socket.disconnect(true);
      return;
    }

    socket.data.username = cleanedName;
    socket.emit('joined', {
      username: cleanedName,
      roomName: 'Public Chat Room'
    });

    io.emit('system-message', {
      text: `${cleanedName} joined the room.`
    });
  });

  socket.on('chat:message', ({ text }) => {
    if (!socket.data.username) {
      return;
    }

    if (isBlockedUser(socket.data.username)) {
      socket.emit('error', {
        message: 'You are blocked from this room.',
        blocked: true
      });
      socket.disconnect(true);
      return;
    }

    const messageText = sanitizeMessage(text);
    if (!messageText) {
      return;
    }

    const formattedText = formatInlineEmojis(messageText);
    io.emit('chat:message', {
      username: socket.data.username,
      text: formattedText,
      createdAt: new Date().toISOString()
    });
  });

  socket.on('admin:authenticate', ({ password }) => {
    if (password === ADMIN_PASSWORD) {
      socket.data.isAdmin = true;
      socket.emit('admin:status', {
        authorized: true,
        blocked: state.blockedUsers
      });
      return;
    }

    socket.emit('admin:status', {
      authorized: false,
      message: 'Incorrect admin password.'
    });
  });

  socket.on('admin:block', ({ username }) => {
    if (!socket.data.isAdmin) {
      socket.emit('admin:status', {
        authorized: false,
        message: 'Admin access required.'
      });
      return;
    }

    const targetName = normalizeUsername(username);
    if (!targetName || targetName === 'Guest') {
      socket.emit('admin:status', {
        authorized: true,
        message: 'Choose a valid username to block.'
      });
      return;
    }

    const alreadyBlocked = state.blockedUsers.some(
      (item) => item.username.toLowerCase() === targetName.toLowerCase()
    );

    if (!alreadyBlocked) {
      state.blockedUsers.push({
        username: targetName,
        createdAt: new Date().toISOString()
      });
      saveBlockedUsers();
      io.emit('admin:blocked-list', { blocked: state.blockedUsers });
      io.emit('system-message', {
        text: `${targetName} was blocked by the admin.`
      });

      for (const client of io.sockets.sockets.values()) {
        if (client.data.username && client.data.username.toLowerCase() === targetName.toLowerCase()) {
          client.emit('error', {
            message: 'You were blocked by the admin.',
            blocked: true
          });
          client.disconnect(true);
        }
      }
    }
  });

  socket.on('admin:unblock', ({ username }) => {
    if (!socket.data.isAdmin) {
      socket.emit('admin:status', {
        authorized: false,
        message: 'Admin access required.'
      });
      return;
    }

    const targetName = normalizeUsername(username);
    const originalLength = state.blockedUsers.length;
    state.blockedUsers = state.blockedUsers.filter(
      (item) => item.username.toLowerCase() !== targetName.toLowerCase()
    );

    if (state.blockedUsers.length !== originalLength) {
      saveBlockedUsers();
      io.emit('admin:blocked-list', { blocked: state.blockedUsers });
      io.emit('system-message', {
        text: `${targetName} was unblocked by the admin.`
      });
    }
  });

  socket.on('admin:add-emoji', ({ shortcut, emoji }) => {
    if (!socket.data.isAdmin) {
      socket.emit('admin:status', {
        authorized: false,
        message: 'Admin access required.'
      });
      return;
    }

    const normalizedShortcut = String(shortcut || '').trim();
    const normalizedEmoji = String(emoji || '').trim();

    if (!normalizedShortcut || !normalizedEmoji) {
      socket.emit('admin:status', {
        authorized: true,
        message: 'A shortcut and emoji are required.'
      });
      return;
    }

    const finalShortcut = normalizedShortcut.startsWith(':') && normalizedShortcut.endsWith(':')
      ? normalizedShortcut
      : `:${normalizedShortcut.replace(/^:+|:+$/g, '')}:`;

    state.customEmojis[finalShortcut] = normalizedEmoji;
    saveCustomEmojis();
    io.emit('emoji:catalog', { emojis: state.customEmojis });
    io.emit('system-message', {
      text: `Custom emoji ${finalShortcut} has been added to the room.`
    });
  });

  socket.on('admin:remove-emoji', ({ shortcut }) => {
    if (!socket.data.isAdmin) {
      socket.emit('admin:status', {
        authorized: false,
        message: 'Admin access required.'
      });
      return;
    }

    const normalizedShortcut = String(shortcut || '').trim();
    if (!normalizedShortcut) {
      return;
    }

    delete state.customEmojis[normalizedShortcut];
    saveCustomEmojis();
    io.emit('emoji:catalog', { emojis: state.customEmojis });
    io.emit('system-message', {
      text: `Custom emoji ${normalizedShortcut} was removed.`
    });
  });

  socket.on('disconnect', () => {
    if (socket.data.username) {
      io.emit('system-message', {
        text: `${socket.data.username} left the room.`
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Public chat room is running on http://localhost:${PORT}`);
});
