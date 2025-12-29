<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal new-chat-modal">
      <div class="modal-header">
        <h3>Percakapan Baru</h3>
        <button @click="$emit('close')" class="modal-close-btn">
          <Icon icon="mdi:close" />
        </button>
      </div>

      <!-- Search Input -->
      <div class="user-search-box">
        <Icon icon="mdi:magnify" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari pengguna..."
          class="user-search-input"
        />
      </div>

      <!-- User List -->
      <div class="user-list">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          :class="['user-item', { selected: selectedUserId === user.id }]"
          @click="selectedUserId = user.id"
        >
          <div class="user-avatar">
            {{ user.email.charAt(0).toUpperCase() }}
          </div>
          <div class="user-info">
            <span class="user-name">{{ user.name || user.email }}</span>
            <span class="user-email">{{ user.email }}</span>
          </div>
          <Icon
            v-if="selectedUserId === user.id"
            icon="mdi:check-circle"
            class="selected-icon"
          />
        </div>
        <div v-if="filteredUsers.length === 0" class="no-users">
          <p>Tidak ada pengguna ditemukan</p>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="$emit('close')" class="btn-cancel">Batal</button>
        <button
          @click="handleCreate"
          :disabled="!selectedUserId"
          class="btn-primary"
        >
          Mulai Chat
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
  users: {
    type: Array,
    default: () => [],
  },
  currentUserId: {
    type: [Number, String],
    default: null,
  },
});

const emit = defineEmits(["close", "create"]);

const searchQuery = ref("");
const selectedUserId = ref(null);

const filteredUsers = computed(() => {
  let users = props.users.filter((u) => u.id !== props.currentUserId);
  if (!searchQuery.value) return users;
  const query = searchQuery.value.toLowerCase();
  return users.filter((user) => {
    const name = (user.name || "").toLowerCase();
    const email = user.email.toLowerCase();
    return name.includes(query) || email.includes(query);
  });
});

function handleCreate() {
  if (selectedUserId.value) {
    const user = props.users.find((u) => u.id === selectedUserId.value);
    emit("create", user);
    selectedUserId.value = null;
    searchQuery.value = "";
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.new-chat-modal {
  width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.modal-close-btn {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  transition: background 0.2s;
}

.modal-close-btn:hover {
  background: #f1f5f9;
}

.user-search-box {
  position: relative;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.user-search-box .search-icon {
  position: absolute;
  left: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.user-search-input {
  width: 100%;
  padding: 0.5rem 0.5rem 0.5rem 2.5rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f1f5f9;
  font-size: 0.875rem;
}

.user-search-input:focus {
  outline: none;
  border-color: #602515;
  background: white;
}

.user-list {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f1f5f9;
}

.user-item:hover {
  background: #f8fafc;
}

.user-item.selected {
  background: #fef3c7;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #602515 0%, #7e3c2f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.875rem;
}

.user-email {
  font-size: 0.75rem;
  color: #64748b;
}

.selected-icon {
  color: #602515;
  font-size: 1.25rem;
}

.no-users {
  padding: 2rem;
  text-align: center;
  color: #64748b;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid #e2e8f0;
}

.btn-cancel {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f1f5f9;
}

.btn-primary {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #602515 0%, #7e3c2f 100%);
  color: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
