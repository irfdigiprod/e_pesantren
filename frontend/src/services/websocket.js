// src/services/websocket.js
// WebSocket client for real-time chat

const getWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  // Use current hostname but always port 3000 for backend
  return `${protocol}//${window.location.hostname}:3000/ws`;
};

const WS_URL = getWsUrl();

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.listeners = new Map();
    this.messageQueue = [];
  }

  /**
   * Connect to WebSocket server
   * @param {string} token - JWT token for authentication
   */
  connect(token) {
    if (
      this.ws &&
      (this.isConnected || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    // Cleanup existing closed/closing socket just in case
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    const url = `${WS_URL}?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(url);
      this.setupEventListeners();
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.scheduleReconnect(token);
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  setupEventListeners() {
    this.ws.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;

      // Send any queued messages
      this.flushMessageQueue();

      // Emit connected event
      this.emit("connected", {});
    };

    this.ws.onclose = (event) => {
      this.isConnected = false;

      // Emit disconnected event
      this.emit("disconnected", { code: event.code, reason: event.reason });

      // Attempt to reconnect if not a clean close
      if (event.code !== 1000) {
        const token = localStorage.getItem("token");
        if (token) {
          this.scheduleReconnect(token);
        }
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.emit("error", { error });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };
  }

  /**
   * Handle incoming WebSocket message
   * @param {object} data - Parsed message data
   */
  handleMessage(data) {
    const { type, data: payload } = data;

    // Emit event based on message type
    this.emit(type, payload);

    // Also emit a generic 'message' event
    this.emit("message", data);
  }

  /**
   * Schedule reconnection with exponential backoff
   * @param {string} token - JWT token for authentication
   */
  scheduleReconnect(token) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      this.emit("reconnect_failed", {});
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connect(token);
    }, delay);
  }

  /**
   * Send message through WebSocket
   * @param {string} type - Message type
   * @param {object} data - Message data
   */
  send(type, data) {
    const message = JSON.stringify({ type, data });

    if (this.isConnected && this.ws) {
      this.ws.send(message);
    } else {
      // Queue message for later
      this.messageQueue.push(message);
    }
  }

  /**
   * Flush queued messages
   */
  flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      this.ws.send(message);
    }
  }

  /**
   * Send a chat message
   * @param {number} conversationId - Conversation ID
   * @param {string} content - Message content
   * @param {object} options - Optional parameters (replyToId, attachmentFiles)
   */
  sendMessage(conversationId, content, options = {}) {
    this.send("message", {
      conversationId,
      content,
      messageType: options.messageType || "text",
      replyToId: options.replyToId,
      attachmentFiles: options.attachmentFiles, // Pass file info for backend to create attachments
      isSigned: options.isSigned,
    });
  }

  /**
   * Send typing indicator
   * @param {number} conversationId - Conversation ID
   * @param {boolean} isTyping - Whether user is typing
   */
  sendTyping(conversationId, isTyping) {
    this.send("typing", { conversationId, isTyping });
  }

  /**
   * Mark message as read
   * @param {number} conversationId - Conversation ID
   * @param {number} messageId - Message ID
   */
  sendRead(conversationId, messageId) {
    this.send("read", { conversationId, messageId });
  }

  /**
   * Send reaction
   * @param {number} messageId - Message ID
   * @param {string} emoji - Emoji
   * @param {string} action - "add" or "remove"
   */
  sendReaction(messageId, emoji, action) {
    this.send("reaction", { messageId, emoji, action });
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event).delete(callback);
    };
  }

  /**
   * Emit an event to listeners
   * @param {string} event - Event name
   * @param {object} data - Event data
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, "Client disconnected");
      this.ws = null;
      this.isConnected = false;
    }
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();
export default wsClient;
