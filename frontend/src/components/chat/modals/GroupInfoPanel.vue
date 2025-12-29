<template>
  <Teleport to="body">
    <div class="group-info-overlay" @click.self="$emit('close')">
      <div class="group-info-panel">
        <div class="panel-header">
          <h3>Info Grup</h3>
          <button @click="$emit('close')" class="close-btn">
            <Icon icon="solar:close-circle-line-duotone" />
          </button>
        </div>

        <div class="panel-content">
          <!-- Group Header -->
          <div class="group-header-info">
            <div class="group-avatar-large relative-container">
              <img
                v-if="avatar.includes('/')"
                :src="avatar"
                class="group-avatar-img"
              />
              <div v-else class="group-avatar-fallback">
                {{ avatar }}
              </div>

              <!-- Avatar Upload Button (Admin Only) -->
              <button
                v-if="isAdmin"
                class="avatar-upload-btn"
                title="Ganti Foto Grup"
                @click="$emit('upload-avatar')"
              >
                <Icon icon="solar:camera-add-line-duotone" />
              </button>
            </div>

            <div v-if="editingName" class="group-name-edit">
              <input
                :value="editNameValue"
                @input="$emit('update:editNameValue', $event.target.value)"
                type="text"
                class="group-name-input"
                @keypress.enter="$emit('save-name')"
              />
              <button class="save-btn" @click="$emit('save-name')">
                <Icon icon="solar:check-circle-line-duotone" />
              </button>
              <button class="cancel-btn" @click="$emit('cancel-edit-name')">
                <Icon icon="solar:close-circle-line-duotone" />
              </button>
            </div>
            <div v-else class="group-name-display">
              <h2>{{ name }}</h2>
              <button
                v-if="isAdmin"
                class="edit-name-btn"
                @click="$emit('start-edit-name')"
              >
                <Icon icon="solar:pen-new-square-line-duotone" />
              </button>
            </div>
            <span class="member-count">{{ participantCount }} anggota</span>
          </div>

          <!-- Admin Actions -->
          <div v-if="isAdmin" class="admin-actions">
            <button
              class="control-btn"
              :class="{ active: isLocked }"
              @click="$emit('toggle-lock')"
            >
              <Icon
                :icon="
                  isLocked
                    ? 'solar:lock-keyhole-line-duotone'
                    : 'solar:lock-keyhole-unlocked-line-duotone'
                "
              />
              <span>{{ isLocked ? "Buka Kunci Grup" : "Kunci Grup" }}</span>
            </button>
            <button class="control-btn" @click="$emit('add-member')">
              <Icon icon="solar:user-plus-line-duotone" />
              <span>Tambah Anggota</span>
            </button>
            <button class="control-btn danger" @click="$emit('delete-group')">
              <Icon icon="solar:trash-bin-trash-line-duotone" />
              <span>Hapus Grup</span>
            </button>
          </div>

          <!-- Locked Indicator -->
          <div v-if="isLocked" class="locked-indicator">
            <Icon icon="solar:lock-keyhole-line-duotone" />
            <span>Grup terkunci - Hanya admin yang dapat mengirim pesan</span>
          </div>

          <!-- Members List -->
          <div class="group-members-section">
            <h4>Anggota</h4>
            <div class="members-list">
              <div
                v-for="member in participants"
                :key="member.userId"
                class="member-item"
              >
                <div class="member-avatar">
                  <img
                    v-if="getMemberPhoto(member)"
                    :src="getMemberPhoto(member)"
                    alt="Member"
                    class="member-avatar-img"
                  />
                  <span v-else>{{ getMemberInitial(member) }}</span>
                </div>
                <div class="member-info">
                  <span class="member-name">{{
                    getMemberDisplayName(member)
                  }}</span>
                  <span v-if="member.role === 'admin'" class="admin-badge"
                    >Admin</span
                  >
                  <span v-if="member.status === 'invited'" class="badge-invited"
                    >Diundang</span
                  >
                </div>
                <div
                  v-if="isAdmin && member.userId !== currentUserId"
                  class="member-actions"
                >
                  <button
                    class="member-action-btn"
                    @click="$emit('toggle-role', member)"
                    :title="
                      member.role === 'admin'
                        ? 'Jadikan Member'
                        : 'Jadikan Admin'
                    "
                  >
                    <Icon
                      :icon="
                        member.role === 'admin'
                          ? 'solar:user-id-line-duotone'
                          : 'solar:shield-user-line-duotone'
                      "
                    />
                  </button>
                  <button
                    class="member-action-btn danger"
                    @click="$emit('remove-member', member.userId)"
                    title="Keluarkan"
                  >
                    <Icon icon="solar:user-cross-line-duotone" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="panel-footer">
            <button class="leave-group-btn" @click="$emit('leave-group')">
              <Icon icon="solar:logout-2-line-duotone" />
              <span>Keluar dari Grup</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import {
  getMemberPhotoUrl,
  getMemberName,
  getMemberInitials,
} from "@/composables/chat";

const props = defineProps({
  name: {
    type: String,
    default: "",
  },
  avatar: {
    type: String,
    default: "",
  },
  participants: {
    type: Array,
    default: () => [],
  },
  participantCount: {
    type: Number,
    default: 0,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  editingName: {
    type: Boolean,
    default: false,
  },
  editNameValue: {
    type: String,
    default: "",
  },
  currentUserId: {
    type: [Number, String],
    default: null,
  },
});

defineEmits([
  "close",
  "upload-avatar",
  "start-edit-name",
  "save-name",
  "cancel-edit-name",
  "update:editNameValue",
  "toggle-lock",
  "add-member",
  "delete-group",
  "toggle-role",
  "remove-member",
  "leave-group",
]);

function getMemberPhoto(member) {
  return getMemberPhotoUrl(member);
}

function getMemberDisplayName(member) {
  return getMemberName(member);
}

function getMemberInitial(member) {
  return getMemberInitials(member);
}
</script>

<style scoped>
.group-info-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(2px);
}

.group-info-panel {
  background: white;
  width: 100%;
  max-width: 400px;
  height: auto;
  max-height: 85vh;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: modal-pop 0.2s ease-out;
}

@keyframes modal-pop {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.panel-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.group-header-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  background: linear-gradient(to bottom, #f8fafc, white);
}

.group-avatar-large {
  width: 80px;
  height: 80px;
  position: relative;
}

.relative-container {
  position: relative;
  display: inline-block;
}

.group-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.group-avatar-fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #602515 0%, #7e3c2f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.5rem;
  color: white;
}

.avatar-upload-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  background: white;
  border: 2px solid white;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #475569;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  z-index: 10;
}

.avatar-upload-btn:hover {
  background: #f1f5f9;
  color: #0ea5e9;
  transform: scale(1.1);
}

.group-name-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.group-name-display h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.edit-name-btn {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  transition: color 0.2s;
}

.edit-name-btn:hover {
  color: #602515;
}

.group-name-edit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.group-name-input {
  border: none;
  border-bottom: 2px solid #602515;
  padding: 0.5rem;
  font-size: 1rem;
  background: transparent;
  text-align: center;
}

.group-name-input:focus {
  outline: none;
}

.save-btn,
.cancel-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  font-size: 1.25rem;
}

.save-btn {
  color: #22c55e;
}

.cancel-btn {
  color: #ef4444;
}

.member-count {
  color: #64748b;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.admin-actions {
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #334155;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.control-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.control-btn.active {
  background: #eff6ff;
  color: #2563eb;
  border-color: #bfdbfe;
}

.control-btn.danger {
  color: #ef4444;
  border-color: #fecaca;
  background: #fef2f2;
}

.control-btn.danger:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

.locked-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef3c7;
  color: #92400e;
  font-size: 0.875rem;
}

.group-members-section {
  padding: 1rem;
}

.group-members-section h4 {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.2s;
}

.member-item:hover {
  background: #f8fafc;
}

.member-avatar {
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
  overflow: hidden;
}

.member-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.member-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.member-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-badge {
  font-size: 0.7rem;
  background: #602515;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.badge-invited {
  font-size: 0.7rem;
  color: #d97706;
  background-color: #fef3c7;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.member-actions {
  display: flex;
  gap: 0.25rem;
}

.member-action-btn {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
}

.member-action-btn:hover {
  background: #f1f5f9;
  color: #334155;
}

.member-action-btn.danger:hover {
  background: #fee2e2;
  color: #dc2626;
}

.panel-footer {
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.leave-group-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid #ef4444;
  color: #ef4444;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.leave-group-btn:hover {
  background: #ef4444;
  color: white;
}
</style>
