// ─── State ────────────────────────────────────────────────────────────────────
let currentUser = null;
let socket = null;
let typingTimer = null;
let isTyping = false;

// ─── Init ─────────────────────────────────────────────────────────────────────
(async function init() {
  // Verify session
  const res = await fetch('/api/me');
  if (!res.ok) {
    window.location.href = '/';
    return;
  }
  const data = await res.json();
  currentUser = data.username;

  // Set UI
  document.getElementById('myUsername').textContent = currentUser;
  document.getElementById('myAvatar').textContent = currentUser[0].toUpperCase();

  // Load history
  await loadMessages();

  // Connect socket
  connectSocket();

  // Typing events
  document.getElementById('messageInput').addEventListener('input', handleTyping);
})();

// ─── Load message history ─────────────────────────────────────────────────────
async function loadMessages() {
  const res = await fetch('/api/messages');
  if (!res.ok) return;
  const messages = await res.json();
  messages.forEach(renderMessage);
  scrollToBottom();
}

// ─── Socket ───────────────────────────────────────────────────────────────────
function connectSocket() {
  socket = io();

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('receive_message', (msg) => {
    renderMessage(msg);
    scrollToBottom();
  });

  socket.on('online_users', (users) => {
    renderUserList(users);
    document.getElementById('onlineCount').textContent =
      users.length + ' online';
  });

  socket.on('user_typing', (username) => {
    if (username === currentUser) return;
    document.getElementById('typingIndicator').textContent =
      username + ' is typing...';
  });

  socket.on('user_stop_typing', () => {
    document.getElementById('typingIndicator').textContent = '';
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
}

// ─── Send message ─────────────────────────────────────────────────────────────
function sendMessage(e) {
  e.preventDefault();
  const input = document.getElementById('messageInput');
  const content = input.value.trim();
  if (!content || !socket) return;

  socket.emit('send_message', content);
  input.value = '';

  // Stop typing indicator
  if (isTyping) {
    socket.emit('stop_typing');
    isTyping = false;
  }
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function handleTyping() {
  if (!socket) return;
  if (!isTyping) {
    socket.emit('typing');
    isTyping = true;
  }
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    socket.emit('stop_typing');
    isTyping = false;
  }, 1500);
}

// ─── Render message ───────────────────────────────────────────────────────────
function renderMessage(msg) {
  const container = document.getElementById('messages');
  const isOwn = msg.sender === currentUser;

  // Group logic: check if last group is same sender
  const lastGroup = container.lastElementChild;
  let group;

  if (
    lastGroup &&
    lastGroup.classList.contains('msg-group') &&
    lastGroup.dataset.sender === msg.sender
  ) {
    group = lastGroup;
  } else {
    group = document.createElement('div');
    group.classList.add('msg-group', isOwn ? 'own' : 'other');
    group.dataset.sender = msg.sender;

    if (!isOwn) {
      const senderEl = document.createElement('div');
      senderEl.classList.add('msg-sender');
      senderEl.textContent = msg.sender;
      group.appendChild(senderEl);
    }
    container.appendChild(group);
  }

  const bubble = document.createElement('div');
  bubble.classList.add('msg-bubble');
  bubble.textContent = msg.content;
  group.appendChild(bubble);

  // Time (only on last bubble, update it)
  let timeEl = group.querySelector('.msg-time');
  if (!timeEl) {
    timeEl = document.createElement('div');
    timeEl.classList.add('msg-time');
    group.appendChild(timeEl);
  }
  timeEl.textContent = formatTime(msg.createdAt);
  group.appendChild(timeEl); // move to bottom
}

// ─── Render online users ──────────────────────────────────────────────────────
function renderUserList(users) {
  const list = document.getElementById('userList');
  list.innerHTML = '';
  users.forEach((username) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="online-dot"></span>
      <span>${escapeHtml(username)}${username === currentUser ? ' (you)' : ''}</span>
    `;
    list.appendChild(li);
  });
}

// ─── Logout ───────────────────────────────────────────────────────────────────
async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function scrollToBottom() {
  const container = document.getElementById('messagesContainer');
  container.scrollTop = container.scrollHeight;
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
