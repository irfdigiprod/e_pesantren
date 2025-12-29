<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal new-chat-modal">
      <div class="modal-header">
        <h3>Grup Baru</h3>
        <button @click="$emit('close')" class="modal-close-btn">
          <Icon icon="mdi:close" />
        </button>
      </div>

      <!-- Group Name Input -->
      <div class="group-name-input-wrapper">
        <Icon icon="mdi:account-group" class="group-icon" />
        <input
          v-model="groupName"
          type="text"
          placeholder="Nama Grup"
          class="group-name-input"
        />
      </div>

      <!-- Selected Members Preview -->
      <div v-if="selectedMembers.length > 0" class="selected-members-preview">
        <span class="selected-label"
          >{{ selectedMembers.length }} anggota dipilih</span
        >
        <div class="selected-avatars">
          <div
            v-for="member in selectedMembers.slice(0, 5)"
            :key="member.id"
            class="mini-avatar"
            :title="member.name || member.email"
          >
            {{ (member.name || member.email).charAt(0).toUpperCase() }}
          </div>
          <span v-if="selectedMembers.length > 5" class="more-count">
            +{{ selectedMembers.length - 5 }}
          </span>
        </div>
      </div>

      <!-- Search Input -->
      <div class="user-search-box">
        <Icon icon="mdi:magnify" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari anggota..."
          class="user-search-input"
        />
      </div>

      <!-- User List (Multi-select) -->
      <div class="user-list">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          :class="['user-item', { selected: isMemberSelected(user) }]"
          @click="toggleMember(user)"
        >
          <div class="user-avatar">
            {{ (user.name || user.email).charAt(0).toUpperCase() }}
          </div>
          <div class="user-info">
            <span class="user-name">{{ user.name || user.email }}</span>
            <span class="user-email">{{ user.email }}</span>
          </div>
          <Icon
            v-if="isMemberSelected(user)"
            icon="mdi:check-circle"
            class="selected-icon"
          />
        </div>
        <div v-if="filteredUsers.length === 0" class="no-users">
          <p>Tidak ada pengguna ditemukan</p>
        </div>
      </div>

      <!-- Invite Mode Option -->
      <div class="invite-mode-option">
        <label class="checkbox-label">
          <input type="checkbox" v-model="useInviteMode" />
          <span class="checkbox-text">
            <Icon icon="mdi:email-send" class="checkbox-icon" />
            Kirim undangan ke anggota (harus menerima dulu)
          </span>
        </label>
      </div>

      <div class="modal-actions">
        <button @click="$emit('close')" class="btn-cancel">Batal</button>
        <button
          @click="handleCreate"
          :disabled="!groupName.trim() || selectedMembers.length < 1"
          class="btn-primary"
        >
          Buat Grup
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

const groupName = ref("");
const searchQuery = ref("");
const selectedMembers = ref([]);
const useInviteMode = ref(false);

const filteredUsers = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  return props.users.filter((user) => {
    if (user.id === props.currentUserId) return false;
    if (query) {
      const name = (user.name || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    }
    return true;
  });
});

function isMemberSelected(user) {
  return selectedMembers.value.some((m) => m.id === user.id);
}

function toggleMember(user) {
  const index = selectedMembers.value.findIndex((m) => m.id === user.id);
  if (index >= 0) {
    selectedMembers.value.splice(index, 1);
  } else {
    selectedMembers.value.push(user);
  }
}

function handleCreate() {
  if (groupName.value.trim() && selectedMembers.value.length >= 1) {
    emit("create", {
      name: groupName.value.trim(),
      members: selectedMembers.value,
      inviteMode: useInviteMode.value,
    });
    // Reset
    groupName.value = "";
    selectedMembers.value = [];
    searchQuery.value = "";
    useInviteMode.value = false;
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

.group-name-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.group-icon {
  font-size: 2rem;
  color: #602515;
}

.group-name-input {
  flex: 1;
  border: none;
  border-bottom: 2px solid #602515;
  padding: 0.5rem;
  font-size: 1rem;
  background: transparent;
}

.group-name-input:focus {
  outline: none;
}

.group-name-input::placeholder {
  color: #94a3b8;
}

.selected-members-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.selected-label {
  font-size: 0.875rem;
  color: #64748b;
}

.selected-avatars {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.mini-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #602515 0%, #853823 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.more-count {
  font-size: 0.75rem;
  color: #64748b;
  margin-left: 0.25rem;
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
  max-height: 250px;
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

.invite-mode-option {
  padding: 0.75rem 1rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input {
  width: 16px;
  height: 16px;
  accent-color: #602515;
}

.checkbox-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
}

.checkbox-icon {
  font-size: 1rem;
  color: #602515;
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
