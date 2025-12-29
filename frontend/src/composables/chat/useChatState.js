/**
 * Chat state composable - shared reactive state for chat components
 */
import { ref, computed } from "vue";

// Core conversation state
const conversations = ref([]);
const activeConversation = ref(null);
const messages = ref([]);
const loadingConversations = ref(true);
const loadingMessages = ref(false);

// User state
const currentUser = ref(null);
const availableUsers = ref([]);
const onlineUsers = ref([]);
const typingUsers = ref([]);

// UI state
const isMobile = ref(window.innerWidth < 1024);
const showMobileSidebar = ref(true);
const searchQuery = ref("");

// Message input state
const messageText = ref("");
const isSigned = ref(false);
const replyTo = ref(null);
const attachments = ref([]);

// Modal states
const showNewChat = ref(false);
const showNewGroupChat = ref(false);
const showGroupInfo = ref(false);
const showAddMemberModal = ref(false);
const showFullEmojiPicker = ref(false);
const showAttachMenu = ref(false);

// New chat modal state
const newChatUserId = ref("");
const userSearchQuery = ref("");

// New group modal state
const newGroupName = ref("");
const selectedGroupMembers = ref([]);
const groupSearchQuery = ref("");
const useInviteMode = ref(false);

// Group info state
const editingGroupName = ref(false);
const editGroupNameValue = ref("");
const groupMembers = ref([]);
const isGroupAdmin = ref(false);
const isGroupLocked = ref(false);
const addMemberSearch = ref("");
const addMemberResults = ref([]);

// Emoji picker state
const emojiPickerMessage = ref(null);
const selectedEmojiCategory = ref("😀 Smileys");
const showInputEmojiPicker = ref(false);

// Message actions state
const activeMessageActions = ref({
  messageId: null,
  topOffset: 0,
  isFixed: false,
});
const editingMessage = ref(null);
const editingContent = ref("");
const deleteConfirmMessage = ref(null);

// Lightbox state
const lightboxImage = ref(null);
const expandedMessages = ref(new Set());

// Link preview state
const linkPreview = ref(null);
const linkPreviewLoading = ref(false);
const linkPreviewCache = ref(new Map());

// Notifications state
const notifications = ref([]);
const showNotificationsModal = ref(false);

// Alert & Confirm Modal State
const showAlertModal = ref(false);
const alertMessage = ref("");
const showConfirmModal = ref(false);
const confirmMessage = ref("");
const confirmCallback = ref(null);

// Forward state
const showForwardDialog = ref(false);
const forwardingMessage = ref(null);
const forwardingImage = ref(null);
const forwardSearchQuery = ref("");
const selectedForwardIds = ref([]);
const forwardCaption = ref("");
const forwardUsers = ref([]);

/**
 * Composable function that returns all chat state
 */
export function useChatState() {
  // Computed values
  const filteredConversations = computed(() => {
    if (!searchQuery.value) return conversations.value;
    const query = searchQuery.value.toLowerCase();
    return conversations.value.filter((conv) => {
      const name = (conv.name || "").toLowerCase();
      return name.includes(query);
    });
  });

  const canSend = computed(() => {
    return messageText.value.trim() || attachments.value.length > 0;
  });

  const filteredAvailableUsers = computed(() => {
    let users = availableUsers.value.filter(
      (u) => u.id !== currentUser.value?.id
    );
    if (!userSearchQuery.value) return users;
    const query = userSearchQuery.value.toLowerCase();
    return users.filter((user) => {
      const name = (user.name || "").toLowerCase();
      const email = user.email.toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  });

  const filteredGroupUsers = computed(() => {
    const query = groupSearchQuery.value.toLowerCase().trim();
    return availableUsers.value.filter((user) => {
      if (user.id === currentUser.value?.id) return false;
      if (query) {
        const name = (user.name || "").toLowerCase();
        const email = (user.email || "").toLowerCase();
        return name.includes(query) || email.includes(query);
      }
      return true;
    });
  });

  const currentUserIsAdmin = computed(() => {
    if (!currentUser.value || !activeConversation.value) return false;
    if (activeConversation.value.participants) {
      const me = activeConversation.value.participants.find(
        (p) => String(p.userId) === String(currentUser.value.id)
      );
      return me?.role === "admin";
    }
    return false;
  });

  const isChatLocked = computed(() => {
    if (activeConversation.value?.type !== "group") return false;
    const isLocked = activeConversation.value.isLocked;
    const myRole = activeConversation.value.participants?.find(
      (p) => p.userId === currentUser.value?.id
    )?.role;
    return isLocked && myRole !== "admin";
  });

  const unreadNotificationsCount = computed(() => {
    return notifications.value.filter((n) => !n.isRead).length;
  });

  // Helper functions
  function showAlert(message) {
    alertMessage.value = message;
    showAlertModal.value = true;
  }

  function showConfirm(message) {
    return new Promise((resolve) => {
      confirmMessage.value = message;
      confirmCallback.value = resolve;
      showConfirmModal.value = true;
    });
  }

  function handleConfirm(result) {
    if (confirmCallback.value) {
      confirmCallback.value(result);
      confirmCallback.value = null;
    }
    showConfirmModal.value = false;
  }

  function updateIsMobile() {
    isMobile.value = window.innerWidth < 1024;
  }

  function isMessageOwn(message) {
    if (!currentUser.value || !message) return false;
    return String(message.senderId) == String(currentUser.value.id);
  }

  function isGroupMemberSelected(user) {
    return selectedGroupMembers.value.some((m) => m.id === user.id);
  }

  function toggleGroupMember(user) {
    const index = selectedGroupMembers.value.findIndex((m) => m.id === user.id);
    if (index >= 0) {
      selectedGroupMembers.value.splice(index, 1);
    } else {
      selectedGroupMembers.value.push(user);
    }
  }

  return {
    // Core state
    conversations,
    activeConversation,
    messages,
    loadingConversations,
    loadingMessages,

    // User state
    currentUser,
    availableUsers,
    onlineUsers,
    typingUsers,

    // UI state
    isMobile,
    showMobileSidebar,
    searchQuery,

    // Message input
    messageText,
    isSigned,
    replyTo,
    attachments,

    // Modals
    showNewChat,
    showNewGroupChat,
    showGroupInfo,
    showAddMemberModal,
    showFullEmojiPicker,
    showAttachMenu,

    // New chat
    newChatUserId,
    userSearchQuery,

    // New group
    newGroupName,
    selectedGroupMembers,
    groupSearchQuery,
    useInviteMode,

    // Group info
    editingGroupName,
    editGroupNameValue,
    groupMembers,
    isGroupAdmin,
    isGroupLocked,
    addMemberSearch,
    addMemberResults,

    // Emoji
    emojiPickerMessage,
    selectedEmojiCategory,
    showInputEmojiPicker,

    // Message actions
    activeMessageActions,
    editingMessage,
    editingContent,
    deleteConfirmMessage,

    // Lightbox
    lightboxImage,
    expandedMessages,

    // Link preview
    linkPreview,
    linkPreviewLoading,
    linkPreviewCache,

    // Notifications
    notifications,
    showNotificationsModal,

    // Alert/Confirm
    showAlertModal,
    alertMessage,
    showConfirmModal,
    confirmMessage,
    confirmCallback,

    // Forward
    showForwardDialog,
    forwardingMessage,
    forwardingImage,
    forwardSearchQuery,
    selectedForwardIds,
    forwardCaption,
    forwardUsers,

    // Computed
    filteredConversations,
    canSend,
    filteredAvailableUsers,
    filteredGroupUsers,
    currentUserIsAdmin,
    isChatLocked,
    unreadNotificationsCount,

    // Methods
    showAlert,
    showConfirm,
    handleConfirm,
    updateIsMobile,
    isMessageOwn,
    isGroupMemberSelected,
    toggleGroupMember,
  };
}
