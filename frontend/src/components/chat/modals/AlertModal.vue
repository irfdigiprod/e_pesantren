<template>
  <Teleport to="body">
    <div class="alert-overlay" @click.self="$emit('close')">
      <div class="modal-content modal-alert">
        <div class="modal-header">
          <h3>Pemberitahuan</h3>
          <button @click="$emit('close')" class="close-btn">
            <Icon icon="solar:close-circle-line-duotone" />
          </button>
        </div>
        <div class="modal-body">
          <p>{{ message }}</p>
        </div>
        <div class="modal-actions">
          <button class="btn-primary" @click="$emit('close')">OK</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { Icon } from "@iconify/vue";

defineProps({
  message: {
    type: String,
    default: "",
  },
});

defineEmits(["close"]);
</script>

<style scoped>
.alert-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: modal-pop 0.2s ease-out;
  width: 100%;
  max-width: 350px;
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
}

.modal-body {
  padding: 1rem;
}

.modal-body p {
  margin: 0;
  color: #475569;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn-primary {
  padding: 0.5rem 1.5rem;
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
</style>
