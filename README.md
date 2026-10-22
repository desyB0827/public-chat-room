const socket = io();

const usernameInput = document.getElementById('usernameInput');
const joinBtn = document.getElementById('joinBtn');
const adminPasswordInput = document.getElementById('adminPasswordInput');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminControls = document.getElementById('adminControls');
const messages = document.getElementById('messages');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const connectionStatus = document.getElementById('connectionStatus');
const emojiStrip = document.getElementById('emojiStrip');
const blockUsernameInput = document.getElementById('blockUsernameInput');
const blockUserBtn = document.getElementById('blockUserBtn');
const unblockUserBtn = document.getElementById('unblockUserBtn');
const blockedUsersList = document.getElementById('blockedUsersList');
const emojiShortcutInput = document.getElementById('emojiShortcutInput');
const emojiValueInput = document.getElementById('emojiValueInput');
const addEmojiBtn = document.getElementById('addEmojiBtn');
const removeEmojiBtn = document.getElementById('removeEmojiBtn');

let currentUsername = '';
let isAdmin = false;

function updateStatus(text, ok = true) {
  connectionStatus.textContent = text;
  connectionStatus.style.background = ok ? 'rgba(74, 213, 154, 0.12)' : 'rgba(255, 91, 108, 0.12)';
  connectionStatus.style.color = ok ? '#4ad59a' : '#ffb4b4';
  connectionStatus.style.borderColor = ok ? 'rgba(74, 213, 154, 0.35)' : 'rgba(255, 91, 108, 0.35)';
}

function appendSystemMessage(text) {
  const item = document.createElement('div');
  item.className = 'system-message';
  item.textContent = text;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
}

function appendMessage({ username, text }) {
  const item = document.createElement('div');
  item.className = 'message';

  const header = document.createElement('div');
  header.className = 'message-header';

  const userLabel = document.createElement('span');
  userLabel.className = 'message-user';
  userLabel.textContent = username;

  const meta = document.createElement('span');
  meta.textContent = 'now';

  header.appendChild(userLabel);
  header.appendChild(meta);

  const content = document.createElement('div');
  content.className = 'message-text';
  content.textContent = text;

  item.appendChild(header);
  item.appendChild(content);
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
}

function renderBlockedList(blockedUsers) {
  blockedUsersList.innerHTML = '';

  if (!blockedUsers || blockedUsers.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No blocked users.';
    blockedUsersList.appendChild(li);
    return;
  }

  blockedUsers.forEach((user) => {
    const li = document.createElement('li');
    li.textContent = user.username;
    blockedUsersList.appendChild(li);
  });
}

function renderEmojiButtons(emojis) {
  emojiStrip.innerHTML = '';

  Object.entries(emojis).forEach(([shortcut, emoji]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'emoji-button';
    button.title = shortcut;
    button.textContent = `${emoji} ${shortcut}`;
    button.addEventListener('click', () => {
      messageInput.value += ` ${shortcut} `;
      messageInput.focus();
    });
    emojiStrip.appendChild(button);
  });
}

joinBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  if (!username) {
    alert('Please enter a username.');
    return;
  }

  currentUsername = username;
  socket.emit('join', { username });
});

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!currentUsername) {
    alert('Join the room first.');
    return;
  }

  const text = messageInput.value.trim();
  if (!text) {
    return;
  }

  socket.emit('chat:message', { text });
  messageInput.value = '';
});

adminLoginBtn.addEventListener('click', () => {
  const password = adminPasswordInput.value;
  socket.emit('admin:authenticate', { password });
});

blockUserBtn.addEventListener('click', () => {
  if (!isAdmin) {
    alert('Unlock admin first.');
    return;
  }

  const target = blockUsernameInput.value.trim();
  if (!target) {
    alert('Enter a username to block.');
    return;
  }

  socket.emit('admin:block', { username: target });
  blockUsernameInput.value = '';
});

unblockUserBtn.addEventListener('click', () => {
  if (!isAdmin) {
    alert('Unlock admin first.');
    return;
  }

  const target = blockUsernameInput.value.trim();
  if (!target) {
    alert('Enter a username to unblock.');
    return;
  }

  socket.emit('admin:unblock', { username: target });
  blockUsernameInput.value = '';
});

addEmojiBtn.addEventListener('click', () => {
  if (!isAdmin) {
    alert('Unlock admin first.');
    return;
  }

  const shortcut = emojiShortcutInput.value.trim();
  const emoji = emojiValueInput.value.trim();

  if (!shortcut || !emoji) {
    alert('Add both an emoji shortcut and the emoji value.');
    return;
  }

  socket.emit('admin:add-emoji', { shortcut, emoji });
  emojiShortcutInput.value = '';
  emojiValueInput.value = '';
});

removeEmojiBtn.addEventListener('click', () => {
  if (!isAdmin) {
    alert('Unlock admin first.');
    return;
  }

  const shortcut = emojiShortcutInput.value.trim();
  if (!shortcut) {
    alert('Enter the shortcut to remove.');
    return;
  }

  socket.emit('admin:remove-emoji', { shortcut });
  emojiShortcutInput.value = '';
  emojiValueInput.value = '';
});

socket.on('connect', () => {
  updateStatus('Connected');
});

socket.on('disconnect', () => {
  updateStatus('Disconnected', false);
});

socket.on('joined', ({ username }) => {
  currentUsername = username;
  usernameInput.value = username;
  usernameInput.disabled = true;
  joinBtn.disabled = true;
  messageInput.disabled = false;
  messageInput.focus();
  appendSystemMessage(`${username} joined the room.`);
});

socket.on('system-message', ({ text }) => {
  appendSystemMessage(text);
});

socket.on('chat:message', (payload) => {
  appendMessage(payload);
});

socket.on('emoji:catalog', ({ emojis }) => {
  renderEmojiButtons(emojis);
});

socket.on('admin:status', ({ authorized, message, blocked }) => {
  if (authorized) {
    isAdmin = true;
    adminControls.classList.remove('hidden');
    renderBlockedList(blocked || []);
    if (message) {
      appendSystemMessage(message);
    }
    return;
  }

  if (message) {
    appendSystemMessage(message);
  }
});

socket.on('admin:blocked-list', ({ blocked }) => {
  renderBlockedList(blocked || []);
});

socket.on('error', ({ message, blocked }) => {
  if (blocked) {
    messageInput.disabled = true;
    currentUsername = '';
    alert(message);
    return;
  }

  alert(message);
});

fetch('/api/room-info')
  .then((res) => res.json())
  .then((data) => {
    if (data.adminConfigured) {
      appendSystemMessage('Admin password is configured. Use the admin panel to block users.');
    } else {
      appendSystemMessage('Admin password is using the default secret. Change it in the .env file before launching publicly.');
    }
  })
  .catch(() => {
    appendSystemMessage('Room ready.');
  });

appendSystemMessage('Welcome! Choose a username to enter the public chat room.');
