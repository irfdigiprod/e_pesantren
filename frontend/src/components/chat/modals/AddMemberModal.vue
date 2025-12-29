<template>
  <Teleport to="body">
    <div class="add-member-overlay" @click.self="$emit('close')">
      <div class="modal-content add-member-modal">
        <div class="modal-header">
          <h3>Tambah Anggota</h3>
          <button @click="$emit('close')" class="close-btn">
            <Icon icon="solar:close-circle-line-duotone" />
          </button>
        </div>
        <div class="modal-body">
          <div class="search-box">
            <Icon icon="solar:magnifer-line-duotone" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari pengguna..."
              @input="handleSearch"
              class="search-input"
            />
          </div>
          <div class="add-member-results">
            <div
              v-for="user in searchResults"
              :key="user.id"
              class="add-member-item"
              @click="$emit('add', user.id)"
            >
              <div class="member-avatar">
                {{ user.email?.charAt(0).toUpperCase() }}
              </div>
              <div class="user-info">
                <span class="user-name">{{ user.name || user.email }}</span>
                <span class="user-email">{{ user.email }}</span>
              </div>
              <Icon icon="solar:add-circle-line-duotone" class="add-icon" />
            </div>
            <p
              v-if="searchResults.length === 0 && searchQuery"
              class="no-results"
            >
              Tidak ada pengguna ditemukan
            </p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from "vue";
import { Icon } from "@iconify/vue";

defineProps({
  searchResults: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close", "add", "search"]);

const searchQuery = ref("");

function handleSearch() {
  emit("search", searchQuery.value);
}
</script>

<style scoped>
.add-member-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: white;
  border-radius: 16px;
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

.add-member-modal {
  width: 100%;
  max-width: 350px;
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #64748b;
  padding: 0.25rem;
  display: flex;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #1e293b;
}

.modal-body {
  padding: 0;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.search-icon {
  color: #64748b;
  font-size: 1.25rem;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.875rem;
  background: transparent;
}

.add-member-results {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  max-height: 300px;
}

.add-member-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}

.add-member-item:hover {
  background: #f1f5f9;
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
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-name {
  font-weight: 500;
  font-size: 0.875rem;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.75rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.add-icon {
  color: #602515;
  font-size: 1.5rem;
}

.no-results {
  text-align: center;
  color: #64748b;
  padding: 1rem;
  font-size: 0.875rem;
}
</style>
