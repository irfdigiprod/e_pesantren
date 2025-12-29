<template>
  <div class="max-w-4xl mx-auto pb-12">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-800">Identitas Lembaga</h1>
      <p class="text-slate-500 mt-1">
        Pengaturan data identitas lembaga yang akan ditampilkan pada laporan dan
        dokumen.
      </p>
    </div>

    <!-- SKELETON -->
    <div
      v-if="loading"
      class="bg-white rounded-xl shadow-sm border border-slate-200 animate-pulse"
    >
      <div class="p-6 border-b border-slate-100">
        <div class="h-6 bg-slate-200 rounded w-1/4"></div>
      </div>
      <div class="p-6 space-y-6">
        <div>
          <div class="h-4 bg-slate-200 rounded w-32 mb-2"></div>
          <div class="flex items-center gap-6">
            <div class="w-32 h-32 bg-slate-200 rounded-lg"></div>
            <div class="flex-1 space-y-2">
              <div class="h-10 w-40 bg-slate-200 rounded"></div>
              <div class="h-3 w-64 bg-slate-100 rounded"></div>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="col-span-full space-y-2">
            <div class="h-4 w-32 bg-slate-200 rounded"></div>
            <div class="h-10 bg-slate-100 rounded"></div>
          </div>
          <div class="col-span-full space-y-2">
            <div class="h-4 w-32 bg-slate-200 rounded"></div>
            <div class="h-10 bg-slate-100 rounded"></div>
          </div>
          <div class="col-span-full space-y-2">
            <div class="h-4 w-32 bg-slate-200 rounded"></div>
            <div class="h-20 bg-slate-100 rounded"></div>
          </div>
          <div class="space-y-2">
            <div class="h-4 w-32 bg-slate-200 rounded"></div>
            <div class="h-10 bg-slate-100 rounded"></div>
          </div>
          <div class="space-y-2">
            <div class="h-4 w-32 bg-slate-200 rounded"></div>
            <div class="h-10 bg-slate-100 rounded"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="bg-white rounded-xl shadow-sm border border-slate-200">
      <div class="p-6 border-b border-slate-100">
        <h2 class="font-semibold text-slate-800">Profil Lembaga</h2>
      </div>

      <div class="p-6 space-y-6">
        <!-- ALERT ERROR -->
        <div
          v-if="error"
          class="p-4 bg-rose-50 text-rose-600 rounded-lg text-sm flex items-center gap-2"
        >
          <Icon icon="lucide:alert-circle" class="w-5 h-5 flex-shrink-0" />
          {{ error }}
        </div>

        <!-- FORM -->
        <form @submit.prevent="saveSettings" class="space-y-6">
          <!-- LOGO UPLOAD -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2"
              >Logo Lembaga</label
            >
            <div class="flex items-center gap-6">
              <div
                class="w-32 h-32 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative"
              >
                <img
                  v-if="previewLogo"
                  :src="previewLogo"
                  alt="Logo Preview"
                  class="w-full h-full object-contain p-2"
                />
                <div v-else class="text-center text-slate-400">
                  <Icon icon="lucide:image" class="w-8 h-8 mx-auto mb-1" />
                  <span class="text-xs">No Logo</span>
                </div>

                <!-- Loading Overlay -->
                <div
                  v-if="uploading"
                  class="absolute inset-0 bg-white/80 flex items-center justify-center"
                >
                  <Icon
                    icon="lucide:loader-2"
                    class="w-6 h-6 animate-spin text-indigo-600"
                  />
                </div>
              </div>
              <div class="flex-1">
                <input
                  type="file"
                  ref="fileInput"
                  accept="image/png, image/jpeg"
                  class="hidden"
                  @change="handleFileChange"
                />
                <button
                  type="button"
                  @click="$refs.fileInput.click()"
                  class="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  :disabled="uploading"
                >
                  Pilih Logo Baru
                </button>
                <p class="text-xs text-slate-500 mt-2">
                  Format: PNG, JPG. Maksimal 2MB. Disarankan background
                  transparan.
                </p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- NAMA YAYASAN -->
            <div class="col-span-full">
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Nama Yayasan</label
              >
              <input
                v-model="form.foundation_name"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                placeholder="Contoh: Yayasan Minhajul Haq"
              />
            </div>

            <!-- NAMA LEMBAGA -->
            <div class="col-span-full">
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Nama Lembaga / Pesantren</label
              >
              <input
                v-model="form.institution_name"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                placeholder="Contoh: Pondok Pesantren Minhajul Haq"
              />
            </div>

            <!-- ALAMAT WILAYAH (Cascading) -->
            <div class="col-span-full">
              <AddressSelector
                v-model="form.institution_address_region"
                label="Alamat Lembaga"
              />
            </div>

            <!-- NOMOR IZIN/SK -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Nomor Statistik / Izin (Opsional)</label
              >
              <input
                v-model="form.institution_number"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                placeholder="Contoh: NSPP 12345678"
              />
            </div>

            <!-- KONTAK -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Kontak (Email / Telp)</label
              >
              <input
                v-model="form.institution_contact"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                placeholder="Contoh: 0812-3456-7890 / admin@minhajulhaq.com"
              />
            </div>
          </div>

          <div class="pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              :disabled="saving"
            >
              <Icon
                v-if="saving"
                icon="lucide:loader-2"
                class="w-4 h-4 animate-spin"
              />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- STATUS MODAL -->
    <StatusModal
      :isOpen="statusModal.isOpen"
      :type="statusModal.type"
      :title="statusModal.title"
      :message="statusModal.message"
      @close="statusModal.isOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import { settingsApi, uploadsApi } from "@/services/api";
import StatusModal from "@/components/ui/StatusModal.vue";
import AddressSelector from "@/components/ui/AddressSelector.vue";

const loading = ref(true);
const saving = ref(false);
const uploading = ref(false);
const error = ref(null);
const fileInput = ref(null);

// Modal State
const statusModal = reactive({
  isOpen: false,
  type: "success", // success | error
  title: "",
  message: "",
});

function openModal(type, title, message) {
  statusModal.type = type;
  statusModal.title = title;
  statusModal.message = message;
  statusModal.isOpen = true;
}

// Form State
const form = reactive({
  institution_name: "",
  foundation_name: "",
  institution_address_region: null, // Cascading address data { province, regency, district, village, addressDetail, postalCode }
  institution_number: "",
  institution_contact: "",
  institution_logo: "", // URL path
});

const previewLogo = computed(() => {
  if (!form.institution_logo) return null;
  if (form.institution_logo.startsWith("data:")) return form.institution_logo; // Local preview before upload? No, we upload immediately usually or wait. Let's direct upload on change.
  // Assuming backend returns full URL or relative path handled by rendering logic?
  // Let's rely on full URL from upload response or prepend API_URL if needed.
  // Based on sidebar logic:
  const base = import.meta.env.VITE_API_BASE_URL || "";
  if (form.institution_logo.startsWith("/api/uploads")) {
    return `${base}${form.institution_logo}`;
  }
  // If it's a relative path starting with 'uploads/' (legacy)
  if (form.institution_logo.startsWith("uploads/")) {
    return `${base}/api/${form.institution_logo}`;
  }

  return form.institution_logo;
});

async function loadSettings() {
  loading.value = true;
  try {
    const res = await settingsApi.getAll(); // We need to check if getAll supports fetching all or specific keys
    if (res.success) {
      const data = res.data;
      if (data.institution_name) form.institution_name = data.institution_name;
      if (data.foundation_name) form.foundation_name = data.foundation_name;
      if (data.institution_number)
        form.institution_number = data.institution_number;
      if (data.institution_contact)
        form.institution_contact = data.institution_contact;
      if (data.institution_logo) form.institution_logo = data.institution_logo;

      // Reconstruct address object from separate fields
      const addressRegion = {
        province: null,
        regency: null,
        district: null,
        village: null,
        addressDetail: data.institution_address_detail || "",
        postalCode: data.institution_postal_code || "",
      };

      // Parse province
      if (data.institution_province) {
        try {
          addressRegion.province = JSON.parse(data.institution_province);
        } catch {
          addressRegion.province = null;
        }
      }
      // Parse regency
      if (data.institution_regency) {
        try {
          addressRegion.regency = JSON.parse(data.institution_regency);
        } catch {
          addressRegion.regency = null;
        }
      }
      // Parse district
      if (data.institution_district) {
        try {
          addressRegion.district = JSON.parse(data.institution_district);
        } catch {
          addressRegion.district = null;
        }
      }
      // Parse village
      if (data.institution_village) {
        try {
          addressRegion.village = JSON.parse(data.institution_village);
        } catch {
          addressRegion.village = null;
        }
      }

      form.institution_address_region = addressRegion;
    }
  } catch (err) {
    console.error("Failed to load settings:", err);
    error.value = "Gagal memuat pengaturan data lembaga.";
  } finally {
    loading.value = false;
  }
}

async function handleFileChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate size (2MB)
  if (file.size > 2 * 1024 * 1024) {
    openModal("error", "Gagal Upload", "Ukuran file maksimal 2MB");
    return;
  }

  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append("file", file);

    // Use existing uploads API
    // Function needs to be added to api.js first, but assuming typical usage:
    // Or directly call axios if api.js method not present yet.
    // Let's implement uploadsApi.upload(formData) in api.js next.
    const res = await uploadsApi.upload(formData);

    if (res.success) {
      // The existing backend returns data.url as /api/uploads/image/...
      form.institution_logo = res.data.url;
    }
  } catch (err) {
    console.error("Upload failed", err);
    openModal(
      "error",
      "Gagal Upload",
      "Gagal mengupload logo. Silakan coba lagi."
    );
  } finally {
    uploading.value = false;
    // Reset input
    if (fileInput.value) fileInput.value.value = "";
  }
}

async function saveSettings() {
  saving.value = true;
  error.value = null;
  try {
    // Transform formatting to bulk update format expected by backend
    const addr = form.institution_address_region || {};
    const settingsPayload = [
      { key: "institution_name", value: form.institution_name },
      { key: "foundation_name", value: form.foundation_name },
      { key: "institution_number", value: form.institution_number },
      { key: "institution_contact", value: form.institution_contact },
      { key: "institution_logo", value: form.institution_logo },
      // Save address fields separately
      {
        key: "institution_province",
        value: addr.province ? JSON.stringify(addr.province) : "",
      },
      {
        key: "institution_regency",
        value: addr.regency ? JSON.stringify(addr.regency) : "",
      },
      {
        key: "institution_district",
        value: addr.district ? JSON.stringify(addr.district) : "",
      },
      {
        key: "institution_village",
        value: addr.village ? JSON.stringify(addr.village) : "",
      },
      { key: "institution_address_detail", value: addr.addressDetail || "" },
      { key: "institution_postal_code", value: addr.postalCode || "" },
    ];

    await settingsApi.update(settingsPayload);
    openModal(
      "success",
      "Berhasil Simpan",
      "Pengaturan identitas lembaga berhasil disimpan."
    );
  } catch (err) {
    console.error(err);
    openModal(
      "error",
      "Gagal Simpan",
      "Terjadi kesalahan saat menyimpan pengaturan."
    );
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadSettings();
});
</script>
