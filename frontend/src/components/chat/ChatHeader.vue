<template>
  <header class="chat-header">
    <div class="header-info">
      <!-- Mobile Back Button -->
      <button class="back-btn" @click="$emit('back')" title="Kembali">
        <Icon icon="mdi:arrow-left" />
      </button>
      <div class="header-avatar">
        <img
          v-if="avatar.includes('/')"
          :src="avatar"
          alt="Avatar"
          class="avatar-img"
        />
        <span v-else>{{ avatar }}</span>
      </div>
      <div class="header-details">
        <h3>{{ name }}</h3>
        <span v-if="typingUsers.length > 0" class="typing-indicator">
          {{ typingUsers.join(", ") }} sedang mengetik...
        </span>
        <span v-else-if="isGroup" class="group-subtitle">
          {{ participantCount }} anggota
        </span>
        <span v-else :class="['online-status', { online: isOnline }]">
          {{ isOnline ? "Online" : "Offline" }}
        </span>
      </div>
    </div>
    <div class="header-actions">
      <button
        v-if="isGroup"
        class="action-btn"
        title="Info"
        @click="$emit('open-info')"
      >
        <Icon icon="mdi:information-outline" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { Icon } from "@iconify/vue";

defineProps({
  name: {
    type: String,
    default: "",
  },
  avatar: {
    type: String,
    default: "",
  },
  isGroup: {
    type: Boolean,
    default: false,
  },
  participantCount: {
    type: Number,
    default: 0,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  typingUsers: {
    type: Array,
    default: () => [],
  },
});

defineEmits(["back", "open-info"]);
</script>

<style scoped>
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: white;
}

.header-info {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.back-btn {
  display: none;
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f1f5f9;
  color: #602515;
}

.header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #602515 0%, #7e3c2f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
}

.header-avatar .avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.header-details h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.typing-indicator {
  font-size: 0.75rem;
  color: #f8ae19;
  font-style: italic;
}

.group-subtitle {
  font-size: 0.75rem;
  color: #64748b;
}

.online-status {
  font-size: 0.75rem;
  color: #64748b;
}

.online-status.online {
  color: #22c55e;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f1f5f9;
  color: #602515;
}

@media (max-width: 1023px) {
  .back-btn {
    display: flex;
  }
}
</style>
