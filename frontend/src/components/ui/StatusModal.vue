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
          @click="close"
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
              class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-current rounded-full blur-3xl opacity-10 -mt-16 pointer-events-none"
              :class="type === 'success' ? 'text-green-500' : 'text-red-500'"
            ></div>

            <!-- Icon -->
            <div
              class="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 relative"
              :class="
                type === 'success'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'
              "
            >
              <Icon
                :icon="
                  type === 'success'
                    ? 'solar:check-circle-bold'
                    : 'solar:danger-circle-bold'
                "
                width="48"
              />
            </div>

            <!-- Content -->
            <h3 class="text-xl font-bold text-slate-800 mb-2">
              {{ title }}
            </h3>
            <p class="text-slate-500 text-sm mb-8 leading-relaxed">
              {{ message }}
            </p>

            <!-- Action -->
            <button
              @click="close"
              class="w-full py-3 px-6 rounded-xl font-bold transition-all transform active:scale-95 shadow-lg shadow-current/20"
              :class="
                type === 'success'
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/30'
                  : 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/30'
              "
            >
              OK, Mengerti
            </button>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String, // 'success' | 'error'
    default: "success",
  },
  title: {
    type: String,
    default: "",
  },
  message: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["close"]);

function close() {
  emit("close");
}
</script>
