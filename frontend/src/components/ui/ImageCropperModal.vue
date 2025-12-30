<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm"
    @click.self="close"
  >
    <div
      class="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden flex flex-col max-h-[90vh]"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white"
      >
        <h3 class="text-lg font-bold text-slate-800">
          {{ title }}
        </h3>
        <button
          @click="close"
          class="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Icon icon="solar:close-circle-bold" class="w-6 h-6" />
        </button>
      </div>

      <!-- Cropper Area -->
      <div class="flex-1 bg-slate-900 overflow-hidden relative min-h-[400px]">
        <Cropper
          ref="cropperRef"
          :src="imageSrc"
          :stencil-props="{
            aspectRatio: aspectRatio,
            movable: true,
            resizable: true,
          }"
          :resize-image="{
            adjustStencil: false,
          }"
          image-restriction="stencil"
          class="h-[500px] w-full"
        />
      </div>

      <!-- Footer / Controls -->
      <div class="p-6 bg-white border-t border-slate-100 flex flex-col gap-4">
        <!-- Instructions -->
        <div
          class="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100"
        >
          <p class="flex items-center gap-2 font-medium text-slate-700">
            <Icon
              icon="solar:info-circle-bold"
              class="text-blue-500 shrink-0"
            />
            Petunjuk
          </p>
          <div class="mt-1 ml-6 text-xs text-slate-500 space-y-1">
            <p>Geser dan zoom untuk menyesuaikan area gambar.</p>
            <p>{{ description }}</p>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex items-center gap-3">
          <button
            @click="close"
            class="flex-1 px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all text-sm"
          >
            Batal
          </button>
          <button
            @click="cropImage"
            class="flex-1 px-4 py-3 rounded-xl bg-[#602515] font-bold text-white hover:bg-[#4a1c10] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#602515]/20 text-sm whitespace-nowrap"
          >
            <Icon icon="solar:scissors-bold" class="text-lg" />
            Potong & Simpan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import { Icon } from "@iconify/vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  imageSrc: {
    type: String,
    default: "",
  },
  aspectRatio: {
    type: Number,
    default: 5 / 1,
  },
  title: {
    type: String,
    default: "Sesuaikan Gambar Header",
  },
  description: {
    type: String,
    default: "Rasio aspek dikunci pad 5:1 untuk tampilan optimal di Excel.",
  },
});

const emit = defineEmits(["close", "crop"]);
const cropperRef = ref(null);

function close() {
  emit("close");
}

function cropImage() {
  const { canvas } = cropperRef.value.getResult();
  if (canvas) {
    canvas.toBlob((blob) => {
      emit("crop", blob);
    }, "image/png");
  }
}
</script>

<style scoped>
/* Custom stencil style if needed, but default is usually fine */
</style>
