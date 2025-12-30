<script setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
  show: {
    type: Boolean,
    default: false,
  },
  positionClass: {
    type: String,
    default: "absolute right-0 mt-2", // Default for desktop
  },
});

const emit = defineEmits(["close", "profile", "logout"]);

const username = computed(
  () => props.user?.name || props.user?.email?.split("@")[0] || "Pengguna"
);
</script>

<template>
  <transition name="fade-slide">
    <div
      v-if="show"
      :class="[
        'bg-white border border-slate-100 rounded-xl shadow-xl py-1 z-[110] origin-top-right w-48',
        positionClass,
      ]"
    >
      <!-- Header -->
      <div class="px-4 py-2 border-b border-slate-50 mb-1">
        <p class="text-sm font-bold text-slate-800 truncate">
          {{ username }}
        </p>
        <p class="text-xs text-emerald-500 font-medium">Online</p>
      </div>

      <!-- Actions -->
      <button
        @click="emit('profile')"
        class="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
      >
        <Icon
          icon="solar:user-circle-line-duotone"
          class="text-lg opacity-70"
        />
        Profile
      </button>

      <button
        @click="emit('logout')"
        class="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
      >
        <Icon icon="solar:logout-2-line-duotone" class="text-lg opacity-70" />
        Logout
      </button>
    </div>
  </transition>

  <!-- Overlay -->
  <div v-if="show" class="fixed inset-0 z-[100]" @click="emit('close')"></div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
