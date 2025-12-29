// src/composables/chat/useReadReceipts.js
// Composable for managing message read receipts

import { ref } from "vue";
import wsClient from "@/services/websocket";

/**
 * Composable for managing message read receipts
 * Tracks which messages have been read and by whom
 */
export function useReadReceipts() {
  // Map of messageId -> Set of userIds who have read the message
  const messageReadStatus = ref(new Map());

  /**
   * Check if a message has been read by at least one recipient
   * @param {number} messageId - The message ID to check
   * @returns {boolean} - True if message has been read
   */
  function isMessageRead(messageId) {
    const readers = messageReadStatus.value.get(messageId);
    if (!readers || readers.size === 0) return false;
    return true;
  }

  /**
   * Mark a message as read by a user
   * @param {number} messageId - The message ID
   * @param {number} userId - The user ID who read the message
   */
  function markAsRead(messageId, userId) {
    if (!messageReadStatus.value.has(messageId)) {
      messageReadStatus.value.set(messageId, new Set());
    }
    messageReadStatus.value.get(messageId).add(userId);
    // Trigger reactivity
    messageReadStatus.value = new Map(messageReadStatus.value);
  }

  /**
   * Setup WebSocket listener for message_read events
   * @returns {Function} - Cleanup function to remove listener
   */
  function setupReadReceiptListener() {
    return wsClient.on("message_read", (data) => {
      const { messageId, userId } = data;
      markAsRead(messageId, userId);
    });
  }

  /**
   * Send read receipt for a message
   * @param {number} conversationId - The conversation ID
   * @param {number} messageId - The message ID
   */
  function sendReadReceipt(conversationId, messageId) {
    wsClient.sendRead(conversationId, messageId);
  }

  /**
   * Clear all read status data
   */
  function clearReadStatus() {
    messageReadStatus.value = new Map();
  }

  return {
    messageReadStatus,
    isMessageRead,
    markAsRead,
    setupReadReceiptListener,
    sendReadReceipt,
    clearReadStatus,
  };
}

export default useReadReceipts;
