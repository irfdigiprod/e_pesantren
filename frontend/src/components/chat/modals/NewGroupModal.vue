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
      <div class="invite-mode-container">
        <label class="toggle-switch-wrapper">
          <div class="toggle-content">
            <div class="toggle-icon-box">
              <Icon icon="solar:letter-bold-duotone" />
            </div>
            <div class="toggle-text">
              <span class="toggle-title">Kirim Undangan</span>
              <span class="toggle-description"
                >Anggota harus menerima undangan terlebih dahulu</span
              >
            </div>
          </div>
          <div class="toggle-input-wrapper">
            <input
              type="checkbox"
              v-model="useInviteMode"
              class="toggle-input"
            />
            <div class="toggle-slider"></div>
          </div>
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
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
}

.modal-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  background: #f1f5f9;
  color: #ef4444;
}

.group-name-input-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.group-icon {
  font-size: 2.25rem;
  color: #602515;
}

.group-name-input {
  flex: 1;
  border: none;
  border-bottom: 2px solid #e2e8f0;
  padding: 0.5rem 0;
  font-size: 1rem;
  font-weight: 500;
  background: transparent;
  transition: border-color 0.2s;
}

.group-name-input:focus {
  outline: none;
  border-color: #602515;
}

.group-name-input::placeholder {
  color: #cbd5e1;
}

.selected-members-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}

.selected-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.selected-avatars {
  display: flex;
  gap: -0.25rem;
  align-items: center;
}

.mini-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #602515 0%, #853823 100%);
  border: 2px solid white;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  margin-left: -6px;
}

.mini-avatar:first-child {
  margin-left: 0;
}

.more-count {
  font-size: 0.75rem;
  color: #602515;
  font-weight: 600;
  margin-left: 0.5rem;
}

.user-search-box {
  position: relative;
  padding: 1rem 1.5rem;
}

.user-search-box .search-icon {
  position: absolute;
  left: 2.25rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 1.25rem;
}

.user-search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.user-search-input:focus {
  outline: none;
  border-color: #602515;
  background: white;
  box-shadow: 0 0 0 3px rgba(96, 37, 21, 0.1);
}

.user-list {
  flex: 1;
  overflow-y: auto;
  max-height: 250px;
  padding: 0 0.5rem;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  margin: 0 0.5rem 0.25rem 0.5rem;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.user-item:hover {
  background: #f8fafc;
}

.user-item.selected {
  background: #fff7ed;
  border-color: #ffedd5;
}

.user-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
  font-size: 1rem;
}

.user-item.selected .user-avatar {
  background: linear-gradient(135deg, #602515 0%, #853823 100%);
}

.user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.user-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
}

.user-email {
  font-size: 0.75rem;
  color: #64748b;
}

.selected-icon {
  color: #602515;
  font-size: 1.25rem;
}

.invite-mode-container {
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.toggle-switch-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  gap: 1rem;
}

.toggle-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0; /* Important for text truncation/wrap */
}

.toggle-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #fff7ed;
  color: #602515;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0; /* Prevent squashing */
}

.toggle-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.toggle-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.2;
}

.toggle-description {
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.2;
  margin-top: 2px;
}

.toggle-input-wrapper {
  position: relative;
  width: 48px;
  height: 26px;
  flex-shrink: 0; /* Prevent squashing */
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: 0.3s;
  border-radius: 26px; /* Pill shape */
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-input:checked + .toggle-slider {
  background-color: #602515;
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #f1f5f9;
  background: white;
}

.btn-cancel {
  padding: 0.6rem 1.25rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f8fafc;
  color: #0f172a;
  border-color: #cbd5e1;
}

.btn-primary {
  padding: 0.6rem 1.25rem;
  border-radius: 10px;
  border: none;
  background: #602515;
  color: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(96, 37, 21, 0.2);
}

.btn-primary:hover {
  background: #7c321e;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
