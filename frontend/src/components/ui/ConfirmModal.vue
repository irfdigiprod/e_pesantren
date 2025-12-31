<template>
  <Teleport to="body">
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center px-4"
        role="dialog"
        aria-modal="true"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          @click="cancel"
        ></div>

        <!-- Modal Card -->
        <transition
          enter-active-class="transition duration-300 cubic-bezier(0.16, 1, 0.3, 1)"
          enter-from-class="transform scale-90 opacity-0 translate-y-4"
          enter-to-class="transform scale-100 opacity-100 translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="transform scale-100 opacity-100 translate-y-0"
          leave-to-class="transform scale-95 opacity-0 translate-y-4"
        >
          <div
            v-if="isOpen"
            class="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full relative z-10 text-center overflow-hidden"
          >
            <!-- Decorative Blob -->
            <div
              class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl opacity-10 -mt-16 pointer-events-none"
              :class="typeColors.blob"
            ></div>

            <!-- Icon -->
            <div
              class="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 relative"
              :class="typeColors.iconBg"
            >
              <Icon :icon="typeIcon" width="48" />
            </div>

            <!-- Content -->
            <h3 class="text-xl font-bold text-slate-800 mb-2">
              {{ title }}
            </h3>
            <div class="text-slate-500 text-sm mb-8 leading-relaxed">
              <slot>{{ message }}</slot>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <button
                @click="cancel"
                class="flex-1 py-3 px-6 rounded-xl font-bold transition-all transform active:scale-95 border-2 border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                {{ cancelText }}
              </button>
              <button
                @click="confirm"
                :disabled="loading"
                class="flex-1 py-3 px-6 rounded-xl font-bold transition-all transform active:scale-95 shadow-lg disabled:opacity-50"
                :class="typeColors.button"
              >
                <span
                  v-if="loading"
                  class="flex items-center justify-center gap-2"
                >
                  <Icon
                    icon="solar:spinner-line-duotone"
                    class="animate-spin"
                    width="20"
                  />
                  <span>Memproses...</span>
                </span>
                <span v-else>{{ confirmText }}</span>
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String, // 'danger' | 'warning' | 'info'
    default: "danger",
  },
  title: {
    type: String,
    default: "Konfirmasi",
  },
  message: {
    type: String,
    default: "",
  },
  confirmText: {
    type: String,
    default: "Ya, Lanjutkan",
  },
  cancelText: {
    type: String,
    default: "Batal",
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["confirm", "cancel", "close"]);

const typeIcon = computed(() => {
  switch (props.type) {
    case "warning":
      return "solar:danger-triangle-bold";
    case "info":
      return "solar:info-circle-bold";
    default:
      return "solar:trash-bin-trash-bold";
  }
});

const typeColors = computed(() => {
  switch (props.type) {
    case "warning":
      return {
        blob: "bg-amber-500",
        iconBg: "bg-amber-100 text-amber-600",
        button:
          "bg-amber-600 text-white hover:bg-amber-700 shadow-amber-500/30",
      };
    case "info":
      return {
        blob: "bg-blue-500",
        iconBg: "bg-blue-100 text-blue-600",
        button: "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30",
      };
    default:
      return {
        blob: "bg-red-500",
        iconBg: "bg-red-100 text-red-600",
        button: "bg-red-600 text-white hover:bg-red-700 shadow-red-500/30",
      };
  }
});

function confirm() {
  emit("confirm");
}

function cancel() {
  if (!props.loading) {
    emit("cancel");
  }
}
</script>
