import './style.css';
import { io } from 'socket.io-client';

class ShadowChat {
  constructor() {
    this.socket = null;
    this.username = '';
    this.isConnected = false;
    this.typingTimer = null;
    this.messageCount = 0;
    
    this.initializeElements();
    this.setupEventListeners();
    this.showUsernameModal();
  }

  initializeElements() {
    // DOM elements
    this.usernameModal = document.getElementById('usernameModal');
    this.usernameInput = document.getElementById('usernameInput');
    this.joinButton = document.getElementById('joinButton');
    this.messageInput = document.getElementById('messageInput');
    this.sendButton = document.getElementById('sendButton');
    this.messagesContainer = document.getElementById('messagesContainer');
    this.usersList = document.getElementById('usersList');
    this.connectionStatus = document.getElementById('connectionStatus');
    this.statusText = document.getElementById('statusText');
    this.typingIndicator = document.getElementById('typingIndicator');
    this.messageCountEl = document.getElementById('messageCount');
  }

  setupEventListeners() {
    // Username modal
    this.joinButton.addEventListener('click', () => this.joinChat());
    this.usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.joinChat();
    });

    // Message input
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    // Typing indicators
    this.messageInput.addEventListener('input', () => this.handleTyping());
    this.messageInput.addEventListener('blur', () => this.stopTyping());
  }

  showUsernameModal() {
    this.usernameModal.style.display = 'flex';
    this.usernameInput.focus();
  }

  hideUsernameModal() {
    this.usernameModal.style.display = 'none';
  }

  joinChat() {
    const username = this.usernameInput.value.trim();
    if (!username) {
      this.usernameInput.focus();
      return;
    }

    this.username = username;
    this.hideUsernameModal();
    this.connectToServer();
  }

  connectToServer() {
    // Connect to the chat server. Use the VITE_SOCKET_URL environment
    // variable when provided, otherwise default to the current origin.
    const url = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    this.socket = io(url, {
      transports: ['websocket', 'polling']
    });

    this.setupSocketListeners();
  }

  setupSocketListeners() {
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.updateConnectionStatus(true);
      this.socket.emit('user_join', { username: this.username });
      this.messageInput.focus();
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.updateConnectionStatus(false);
    });

    this.socket.on('chat_history', (messages) => {
      this.clearWelcomeMessage();
      messages.forEach(message => this.displayMessage(message));
      this.messageCount = messages.length;
      this.messageCountEl.textContent = this.messageCount;
      this.scrollToBottom();
    });

    this.socket.on('new_message', (message) => {
      this.clearWelcomeMessage();
      this.displayMessage(message);
      this.scrollToBottom();
      this.updateMessageCount();
    });

    this.socket.on('users_update', (users) => {
      this.updateUsersList(users);
    });

    this.socket.on('user_typing', (data) => {
      this.handleTypingIndicator(data);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.updateConnectionStatus(false, 'Connection failed');
    });
  }

  updateConnectionStatus(connected, customMessage = null) {
    if (connected) {
      this.connectionStatus.classList.add('connected');
      this.statusText.textContent = customMessage || 'Connected';
    } else {
      this.connectionStatus.classList.remove('connected');
      this.statusText.textContent = customMessage || 'Disconnected';
    }
  }

  clearWelcomeMessage() {
    const welcomeMessage = this.messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }
  }

  displayMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    
    if (message.type === 'system') {
      messageEl.classList.add('system');
      messageEl.innerHTML = `
        <div class="message-content">${this.escapeHtml(message.content)}</div>
      `;
    } else {
      const isOwnMessage = message.userId === this.socket?.id;
      if (isOwnMessage) {
        messageEl.classList.add('own');
      }

      const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });

      messageEl.innerHTML = `
        <div class="message-header">
          <span class="message-username">${this.escapeHtml(message.username)}</span>
          <span class="message-timestamp">${timestamp}</span>
        </div>
        <div class="message-content">${this.escapeHtml(message.content)}</div>
      `;
    }

    this.messagesContainer.appendChild(messageEl);
  }

  sendMessage() {
    const content = this.messageInput.value.trim();
    if (!content || !this.isConnected) return;

    this.socket.emit('send_message', { content });
    this.messageInput.value = '';
    this.stopTyping();
  }

  handleTyping() {
    if (!this.isConnected) return;

    // Send typing start event
    this.socket.emit('typing_start');

    // Clear existing timer
    clearTimeout(this.typingTimer);

    // Set timer to stop typing after 2 seconds of inactivity
    this.typingTimer = setTimeout(() => {
      this.stopTyping();
    }, 2000);
  }

  stopTyping() {
    if (!this.isConnected) return;
    
    clearTimeout(this.typingTimer);
    this.socket.emit('typing_stop');
  }

  handleTypingIndicator(data) {
    if (data.isTyping) {
      this.typingIndicator.querySelector('.typing-text').textContent = `${data.username} is typing...`;
      this.typingIndicator.style.display = 'flex';
    } else {
      this.typingIndicator.style.display = 'none';
    }
    this.scrollToBottom();
  }

  updateUsersList(users) {
    this.usersList.innerHTML = '';
    
    users.forEach(user => {
      const userEl = document.createElement('div');
      userEl.className = 'user-item';
      
      const isCurrentUser = user.id === this.socket?.id;
      const displayName = isCurrentUser ? `${user.username} (You)` : user.username;
      
      userEl.innerHTML = `
        <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
        <span>${this.escapeHtml(displayName)}</span>
      `;
      
      this.usersList.appendChild(userEl);
    });
  }

  updateMessageCount() {
    this.messageCount++;
    this.messageCountEl.textContent = this.messageCount;
  }

  scrollToBottom() {
    setTimeout(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }, 100);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the chat application
document.addEventListener('DOMContentLoaded', () => {
  new ShadowChat();
});