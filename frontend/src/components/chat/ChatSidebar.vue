<template>
  <aside :class="['chat-sidebar', { 'sidebar-visible': visible }]">
    <div class="sidebar-header">
      <h2>Pesan</h2>
      <div class="header-buttons">
        <button
          @click="$emit('new-chat')"
          class="new-chat-btn"
          title="Chat Baru"
        >
          <Icon icon="mdi:message-plus" />
        </button>
        <button
          @click="$emit('new-group')"
          class="new-chat-btn"
          title="Grup Baru"
        >
          <Icon icon="mdi:account-group" />
        </button>
      </div>
    </div>

    <div class="search-box">
      <Icon icon="mdi:magnify" class="search-icon" />
      <input
        :value="searchQuery"
        @input="$emit('update:searchQuery', $event.target.value)"
        type="text"
        placeholder="Cari percakapan..."
        class="search-input"
      />
    </div>

    <div class="conversation-list">
      <!-- Skeleton Loading -->
      <div v-if="loading" class="w-full">
        <div
          v-for="i in 6"
          :key="i"
          class="flex items-center gap-3 py-3 px-4 border-b border-slate-100 animate-pulse"
        >
          <div class="w-12 h-12 bg-slate-200 rounded-full shrink-0"></div>
          <div class="flex-1 min-w-0 space-y-2">
            <div class="flex justify-between items-center">
              <div class="h-4 w-24 bg-slate-200 rounded"></div>
              <div class="h-3 w-10 bg-slate-200 rounded"></div>
            </div>
            <div class="flex justify-between items-center">
              <div class="h-3 w-32 bg-slate-200 rounded"></div>
              <div class="h-5 w-5 bg-slate-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <div
          v-for="conv in conversations"
          :key="conv.id"
          :class="[
            'conversation-item',
            { active: activeConversationId === conv.id },
          ]"
          @click="$emit('select', conv)"
        >
          <div class="conv-avatar">
            <img
              v-if="getAvatar(conv).includes('/')"
              :src="getAvatar(conv)"
              alt="Avatar"
              class="avatar-img"
            />
            <span v-else>{{ getAvatar(conv) }}</span>
          </div>
          <div class="conv-info">
            <div class="conv-header">
              <span class="conv-name">{{ getName(conv) }}</span>
              <span class="conv-time">{{
                formatTime(conv.lastMessageAt)
              }}</span>
            </div>
            <div class="conv-preview">
              <span class="preview-text">{{ getPreview(conv) }}</span>
              <span v-if="conv.unreadCount > 0" class="unread-badge">
                {{ conv.unreadCount }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="conversations.length === 0" class="empty-state">
          <Icon icon="mdi:chat-outline" class="empty-icon" />
          <p>Belum ada percakapan</p>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import {
  formatTime,
  getConversationName,
  getConversationAvatar,
  getPreviewText,
} from "@/composables/chat";

const props = defineProps({
  conversations: {
    type: Array,
    default: () => [],
  },
  activeConversationId: {
    type: [Number, String],
    default: null,
  },
  currentUserId: {
    type: [Number, String],
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  visible: {
    type: Boolean,
    default: true,
  },
  searchQuery: {
    type: String,
    default: "",
  },
});

defineEmits(["select", "new-chat", "new-group", "update:searchQuery"]);

function getAvatar(conv) {
  return getConversationAvatar(conv, props.currentUserId);
}

function getName(conv) {
  return getConversationName(conv, props.currentUserId);
}

function getPreview(conv) {
  return getPreviewText(conv);
}
</script>

<style scoped>
.chat-sidebar {
  width: 320px;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  background: white;
  flex-shrink: 0;
  transition: transform 0.3s ease, width 0.3s ease;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.sidebar-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.header-buttons {
  display: flex;
  gap: 0.5rem;
}

.new-chat-btn {
  padding: 0.5rem;
  border-radius: 50%;
  background: #602515;
  color: white;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.new-chat-btn:hover {
  background: #7e3c2f;
}

.search-box {
  position: relative;
  padding: 0.75rem 1rem;
}

.search-icon {
  position: absolute;
  left: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.5rem 0.5rem 2.5rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f1f5f9;
  color: #1e293b;
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  border-color: #602515;
  background: white;
}

.search-input::placeholder {
  color: #94a3b8;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f1f5f9;
}

.conversation-item:hover {
  background: #fef3c7;
}

@media (hover: none) {
  .conversation-item:hover {
    background: transparent;
  }
}

.conversation-item.active {
  background: #fcd34d;
}

.conv-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #602515 0%, #7e3c2f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
  font-size: 1rem;
}

.conv-avatar .avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.conv-info {
  flex: 1;
  min-width: 0;
}

.conv-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.conv-name {
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.875rem;
}

.conv-time {
  font-size: 0.75rem;
  color: #64748b;
  flex-shrink: 0;
}

.conv-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-text {
  font-size: 0.8125rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unread-badge {
  background: #602515;
  color: white;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
  font-weight: 500;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #64748b;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #94a3b8;
}

/* Mobile responsive */
@media (max-width: 1023px) {
  .chat-sidebar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 100%;
    z-index: 100;
    transform: translateX(-100%);
  }

  .chat-sidebar.sidebar-visible {
    transform: translateX(0);
  }
}
</style>
