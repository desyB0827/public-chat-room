* {
  box-sizing: border-box;
}

:root {
  --bg: #0b1020;
  --bg-elevated: #121a2f;
  --panel: #1a243e;
  --panel-alt: #1f2e4d;
  --text: #edf3ff;
  --muted: #aebedc;
  --primary: #7c9cff;
  --primary-strong: #4c7dff;
  --success: #4ad59a;
  --warning: #ffb44a;
  --danger: #ff5b6c;
  --line: rgba(255, 255, 255, 0.08);
}

html, body {
  margin: 0;
  min-height: 100%;
  background: linear-gradient(135deg, #091122 0%, #111b32 100%);
  color: var(--text);
  font-family: Arial, Helvetica, sans-serif;
}

body {
  padding: 24px;
}

button,
input {
  font: inherit;
}

.app-shell {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.eyebrow {
  margin: 0 0 6px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 12px;
  color: var(--muted);
}

h1, h2, h3, p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0;
  font-size: clamp(2rem, 3vw, 2.6rem);
}

.status-pill {
  background: rgba(74, 213, 154, 0.12);
  color: var(--success);
  border: 1px solid rgba(74, 213, 154, 0.35);
  border-radius: 999px;
  padding: 8px 12px;
  font-weight: 700;
}

.room-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 20px;
}

.card,
.chat-panel {
  background: rgba(18, 26, 47, 0.9);
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  padding: 18px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: var(--muted);
}

input {
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 12px 14px;
  color: var(--text);
  outline: none;
  margin-bottom: 12px;
}

input:focus {
  border-color: rgba(124, 156, 255, 0.8);
  box-shadow: 0 0 0 3px rgba(124, 156, 255, 0.15);
}

button {
  border: none;
  border-radius: 10px;
  padding: 12px 16px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

button:hover {
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}

.primary-btn {
  background: linear-gradient(135deg, var(--primary), var(--primary-strong));
  color: #fff;
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--line);
  color: var(--text);
}

.danger-btn {
  background: rgba(255, 91, 108, 0.15);
  color: #ffd2d7;
  border: 1px solid rgba(255, 91, 108, 0.35);
}

.chat-panel {
  display: flex;
  flex-direction: column;
  min-height: 720px;
  padding: 18px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 6px 4px 10px;
}

.message {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px 14px;
}

.message.username-only {
  opacity: 0.8;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 0.82rem;
  color: var(--muted);
}

.message-user {
  font-weight: 700;
  color: #cfe1ff;
}

.message-text {
  font-size: 1rem;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
}

.system-message {
  text-align: center;
  color: var(--muted);
  font-size: 0.8rem;
  padding: 8px 10px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--line);
}

.emoji-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  margin-bottom: 14px;
}

.emoji-button {
  background: rgba(124, 156, 255, 0.08);
  border: 1px solid rgba(124, 156, 255, 0.2);
  color: var(--text);
  padding: 8px 10px;
  font-size: 1.2rem;
}

.chat-form {
  display: flex;
  gap: 12px;
  margin-top: auto;
}

.chat-form input {
  margin-bottom: 0;
}

.chat-form button {
  width: 140px;
}

.hidden {
  display: none !important;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.inline-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.admin-actions,
.emoji-manager {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.blocked-list {
  margin: 10px 0 0;
  padding-left: 18px;
  color: var(--muted);
}

@media (max-width: 900px) {
  body {
    padding: 16px;
  }

  .room-layout {
    grid-template-columns: 1fr;
  }

  .chat-panel {
    min-height: 540px;
  }
}
