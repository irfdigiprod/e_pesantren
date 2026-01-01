<script setup>
import { ref, onMounted, reactive } from "vue";
import { Icon } from "@iconify/vue";
import ImageCropperModal from "@/components/ui/ImageCropperModal.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import StatusModal from "@/components/ui/StatusModal.vue";

const images = ref([]);
const loading = ref(false);
const uploading = ref(false);

const showCropper = ref(false);
const cropperImageSrc = ref("");

// Modal States
const statusModal = reactive({
  isOpen: false,
  type: "success",
  title: "",
  message: "",
});

const confirmModal = reactive({
  isOpen: false,
  title: "Konfirmasi Hapus",
  message: "Apakah Anda yakin ingin menghapus gambar ini?",
  type: "danger",
  loading: false,
  itemId: null,
});

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("uploads/")) return `${API_BASE}/api/${path}`;
  return path;
};

async function fetchImages() {
  loading.value = true;
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/api/information-board`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (json.success) images.value = json.data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (images.value.length >= 7) {
    showStatus("error", "Batas Maksimal", "Maksimal 7 gambar diperbolehkan.");
    e.target.value = "";
    return;
  }

  // Max 10MB check
  if (file.size > 10 * 1024 * 1024) {
    showStatus(
      "error",
      "File Terlalu Besar",
      "Ukuran maksimal file adalah 10MB."
    );
    e.target.value = "";
    return;
  }

  cropperImageSrc.value = URL.createObjectURL(file);
  showCropper.value = true;
  e.target.value = "";
}

async function handleCrop(blob) {
  showCropper.value = false;
  if (!blob) return;

  const file = new File([blob], "slider-cropped.png", { type: "image/png" });
  await uploadImage(file);
}

async function uploadImage(file) {
  uploading.value = true;
  try {
    const token = localStorage.getItem("token");

    // 1. Upload File
    const formData = new FormData();
    formData.append("file", file);

    const upRes = await fetch(`${API_BASE}/api/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (upRes.status === 413) {
      throw new Error("Ukuran file terlalu besar (Max 10MB)");
    }

    if (!upRes.ok) {
      const text = await upRes.text();
      try {
        const json = JSON.parse(text);
        throw new Error(json.message || "Gagal upload gambar");
      } catch (e) {
        throw new Error(`Upload gagal: ${upRes.statusText}`);
      }
    }

    const upJson = await upRes.json();
    const filePath = upJson.data.filePath;

    // 2. Save to Info Board
    const saveRes = await fetch(`${API_BASE}/api/information-board`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ imageUrl: filePath }),
    });

    if (saveRes.ok) {
      await fetchImages();
      showStatus("success", "Berhasil", "Gambar berhasil ditambahkan.");
    } else {
      throw new Error("Gagal menyimpan data gambar.");
    }
  } catch (e) {
    showStatus("error", "Gagal Upload", e.message);
  } finally {
    uploading.value = false;
  }
}

// Trigger Delete Confirmation
function confirmDelete(id) {
  confirmModal.itemId = id;
  confirmModal.isOpen = true;
}

// Execute Delete
async function handleDelete() {
  confirmModal.loading = true;
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API_BASE}/api/information-board/${confirmModal.itemId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const json = await res.json();

    if (json.success) {
      await fetchImages();
      confirmModal.isOpen = false;
      showStatus("success", "Berhasil", "Gambar berhasil dihapus.");
    } else {
      throw new Error(json.message);
    }
  } catch (e) {
    showStatus("error", "Gagal Hapus", e.message || "Terjadi kesalahan.");
  } finally {
    confirmModal.loading = false;
  }
}

function showStatus(type, title, message) {
  statusModal.type = type;
  statusModal.title = title;
  statusModal.message = message;
  statusModal.isOpen = true;
}

onMounted(() => {
  fetchImages();
});
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Papan Informasi</h1>
      <p class="text-slate-500">
        Kelola gambar slider untuk dashboard mobile (Max 7). Rasio disarankan
        3:1.
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-10 text-center text-slate-400">
      Loading...
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Existing Images -->
      <div
        v-for="img in images"
        :key="img.id"
        class="relative aspect-[3/1] bg-slate-100 rounded-xl overflow-hidden group shadow-sm border border-slate-200"
      >
        <img
          :src="getImageUrl(img.imageUrl)"
          class="w-full h-full object-cover"
        />
        <div
          class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"
        ></div>
        <button
          @click="confirmDelete(img.id)"
          class="absolute top-2 right-2 bg-white text-rose-500 w-8 h-8 flex items-center justify-center rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 hover:scale-110"
          title="Hapus"
        >
          <Icon icon="solar:trash-bin-trash-bold" />
        </button>
      </div>

      <!-- Upload Button -->
      <label
        v-if="images.length < 7"
        class="aspect-[3/1] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-[#602515] hover:bg-[#602515]/5 transition-colors text-slate-400 hover:text-[#602515] group"
      >
        <div v-if="uploading" class="animate-spin">
          <Icon icon="solar:spinner-linear" class="text-2xl" />
        </div>
        <div v-else class="flex flex-col items-center gap-2">
          <div
            class="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-[#602515]/10 flex items-center justify-center transition-colors"
          >
            <Icon icon="solar:upload-square-line-duotone" class="text-xl" />
          </div>
          <span class="text-xs font-semibold">Upload Gambar Baru</span>
        </div>
        <input
          type="file"
          class="hidden"
          accept="image/*"
          @change="handleFileSelect"
          :disabled="uploading"
        />
      </label>
    </div>

    <!-- Cropper Modal -->
    <ImageCropperModal
      v-if="showCropper"
      :isOpen="showCropper"
      :imageSrc="cropperImageSrc"
      :aspectRatio="3 / 1"
      title="Sesuaikan Gambar Slider"
      description="Rasio dikunci pada 3:1 untuk tampilan optimal di dashboard."
      @close="showCropper = false"
      @crop="handleCrop"
    />

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      :isOpen="confirmModal.isOpen"
      :title="confirmModal.title"
      :message="confirmModal.message"
      :type="confirmModal.type"
      :loading="confirmModal.loading"
      confirmText="Ya, Hapus"
      cancelText="Batal"
      @confirm="handleDelete"
      @cancel="confirmModal.isOpen = false"
    />

    <!-- Status Modal -->
    <StatusModal
      :isOpen="statusModal.isOpen"
      :type="statusModal.type"
      :title="statusModal.title"
      :message="statusModal.message"
      @close="statusModal.isOpen = false"
    />
  </div>
</template>
