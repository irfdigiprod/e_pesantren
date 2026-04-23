<template>
  <div class="space-y-6 max-w-full">
    <DataTable
      :items="paginatedPermissions"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      :viewMode="viewMode"
      title="Perizinan Saya"
      description="Daftar pengajuan izin dan sakit saya."
      icon="solar:clipboard-list-bold-duotone"
      :search="search"
      @update:search="search = $event"
      @update:limit="
        pagination.limit = $event;
        pagination.page = 1;
      "
      @page-change="pagination.page = $event"
      @update:viewMode="viewMode = $event"
    >
      <!-- Header Actions -->
      <template #header-actions>
        <button
          @click="showModal = true"
          class="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-400 font-medium text-sm flex items-center gap-2 transition-colors"
        >
          <Icon icon="solar:add-circle-bold-duotone" class="w-5 h-5" />
          <span class="hidden sm:inline">Ajukan Izin</span>
        </button>
      </template>

      <!-- Filters -->
      <template #filters>
        <div class="space-y-4">
          <h3 class="font-medium text-slate-800 border-b border-slate-100 pb-2">
            Filter Status
          </h3>
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value="pending"
                v-model="filterStatus"
                class="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span class="text-sm text-slate-600">Diajukan (Menunggu)</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value="approved"
                v-model="filterStatus"
                class="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span class="text-sm text-slate-600">Disetujui</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value="rejected"
                v-model="filterStatus"
                class="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span class="text-sm text-slate-600">Ditolak</span>
            </label>
          </div>
        </div>
      </template>

      <!-- Cell: Type -->
      <template #cell-type="{ item }">
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
          :class="
            item.type === 'sick'
              ? 'bg-rose-100 text-rose-800'
              : item.type === 'leave'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-blue-100 text-blue-800'
          "
        >
          {{ item.type === "sick" ? "Sakit" : item.type === "leave" ? "Cuti" : "Izin" }}
        </span>
      </template>

      <!-- Cell: Date -->
      <template #cell-startDate="{ item }">
        <div class="flex flex-col">
          <span class="font-medium text-slate-700">{{
            formatDate(item.startDate)
          }}</span>
          <span
            v-if="item.startDate !== item.endDate"
            class="text-slate-400 text-xs"
          >
            s.d {{ formatDate(item.endDate) }}
          </span>
        </div>
      </template>

      <!-- Cell: Reason -->
      <template #cell-reason="{ item }">
        <p class="line-clamp-2 text-slate-600 max-w-xs" :title="item.reason">
          {{ item.reason }}
        </p>
      </template>

      <!-- Cell: Status -->
      <template #cell-status="{ item }">
        <div class="flex flex-col items-start gap-1">
          <span
            class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
            :class="{
              'bg-amber-100 text-amber-800': item.status === 'pending',
              'bg-emerald-100 text-emerald-800': item.status === 'approved',
              'bg-slate-100 text-slate-600': item.status === 'rejected',
            }"
          >
            <Icon :icon="statusIcon(item.status)" class="w-3.5 h-3.5" />
            <span class="capitalize">{{ formatStatus(item.status) }}</span>
          </span>
          <!-- Rejection Reason -->
          <div
            v-if="item.status === 'rejected' && item.rejectionReason"
            class="mt-1.5 flex items-start gap-1.5 px-2 py-1.5 bg-rose-50 border border-rose-100 rounded-lg max-w-[180px]"
          >
            <Icon
              icon="solar:info-circle-bold"
              class="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5"
            />
            <span class="text-[10px] leading-tight text-rose-700 font-medium">
              {{ item.rejectionReason }}
            </span>
          </div>
        </div>
      </template>

      <!-- Cell: CreatedAt -->
      <template #cell-createdAt="{ item }">
        <span class="text-slate-400 text-xs">
          {{ new Date(item.createdAt).toLocaleDateString("id-ID") }}
        </span>
      </template>

      <!-- Cell: Attachment -->
      <template #cell-attachment="{ item }">
        <button
          v-if="item.attachment"
          @click="openAttachment(item.attachment)"
          class="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          title="Lihat Lampiran"
        >
          <Icon icon="solar:paperclip-bold-duotone" class="w-4 h-4" />
        </button>
        <span v-else class="text-slate-400 text-xs">-</span>
      </template>

      <!-- Card Item View (Responsive Grid) -->
      <template #card-item="{ item }">
        <div
          class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow h-full flex flex-col relative"
        >
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                :class="
                  item.type === 'sick'
                    ? 'bg-rose-100 text-rose-800'
                    : item.type === 'leave'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                "
              >
                {{ item.type === "sick" ? "Sakit" : item.type === "leave" ? "Cuti" : "Izin" }}
              </span>
              <span
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-amber-100 text-amber-800': item.status === 'pending',
                  'bg-emerald-100 text-emerald-800': item.status === 'approved',
                  'bg-slate-100 text-slate-600': item.status === 'rejected',
                }"
              >
                <Icon :icon="statusIcon(item.status)" class="w-3 h-3" />
                {{ formatStatus(item.status) }}
              </span>
            </div>
            <span class="text-xs text-slate-400">{{
              new Date(item.createdAt).toLocaleDateString("id-ID")
            }}</span>
          </div>
          <div class="text-sm text-slate-700 mb-2">
            <span class="font-medium">{{ formatDate(item.startDate) }}</span>
            <span v-if="item.startDate !== item.endDate" class="text-slate-500">
              s.d {{ formatDate(item.endDate) }}
            </span>
          </div>
          <p class="text-sm text-slate-600 line-clamp-2 mt-auto">
            {{ item.reason }}
          </p>
          <div
            v-if="item.status === 'rejected' && item.rejectionReason"
            class="mt-3 flex items-start gap-2 p-2.5 bg-rose-50 border border-rose-100 rounded-lg"
          >
            <Icon
              icon="solar:info-circle-bold"
              class="w-4 h-4 text-rose-500 shrink-0 mt-0.5"
            />
            <div class="text-xs text-rose-700 leading-relaxed">
              <span class="font-bold text-rose-800">Alasan Penolakan:</span>
              {{ item.rejectionReason }}
            </div>
          </div>

          <!-- Attachment Link (Card) -->
          <div
            v-if="item.attachment"
            class="mt-3 pt-3 border-t border-slate-50 flex justify-end"
          >
            <button
              @click="openAttachment(item.attachment)"
              class="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
            >
              <Icon icon="solar:paperclip-bold-duotone" class="w-4 h-4" />
              Lampiran
            </button>
          </div>
        </div>
      </template>
    </DataTable>

    <!-- Submission Modal -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          @click="showModal = false"
        ></div>

        <!-- Content -->
        <div
          class="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div
            class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50"
          >
            <h3 class="font-bold text-lg text-slate-800">
              Form Pengajuan Izin
            </h3>
            <button
              @click="showModal = false"
              class="text-slate-400 hover:text-slate-600"
            >
              <Icon icon="solar:close-circle-bold" class="w-6 h-6" />
            </button>
          </div>

          <div class="p-6 overflow-y-auto space-y-4 flex-1 min-h-0">
            <!-- Type -->
            <div class="grid grid-cols-3 gap-4">
              <button
                type="button"
                class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
                :class="
                  form.type === 'sick'
                    ? 'border-rose-500 bg-rose-50 text-rose-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                "
                @click="form.type = 'sick'"
              >
                <Icon icon="solar:medical-kit-bold-duotone" class="w-8 h-8" />
                <span class="font-medium">Sakit</span>
              </button>
              <button
                type="button"
                class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
                :class="
                  form.type === 'permit'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                "
                @click="form.type = 'permit'"
              >
                <Icon
                  icon="solar:clipboard-list-bold-duotone"
                  class="w-8 h-8"
                />
                <span class="font-medium">Izin</span>
              </button>
              <button
                type="button"
                class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
                :class="
                  form.type === 'leave'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                "
                @click="form.type = 'leave'"
              >
                <Icon
                  icon="solar:calendar-date-bold-duotone"
                  class="w-8 h-8"
                />
                <span class="font-medium">Cuti</span>
              </button>
            </div>

            <!-- Date Range -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Tanggal Mulai - Selesai</label
              >
              <div class="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  v-model="form.startDate"
                  class="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Mulai"
                />
                <input
                  type="date"
                  v-model="form.endDate"
                  class="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Selesai"
                />
              </div>
            </div>

            <!-- Reason -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Alasan</label
              >
              <textarea
                v-model="form.reason"
                rows="3"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Jelaskan alasan pengajuan..."
              ></textarea>
            </div>

            <!-- File Attachment -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Bukti Koordinasi Atasan <span class="text-rose-500">*</span>
              </label>
              <p class="text-xs text-slate-500 mb-2">
                Upload bukti chat/dokumen koordinasi dengan atasan (jpg, png,
                pdf). Maks 5MB.
              </p>
              <div
                class="border-2 border-dashed rounded-lg p-4 text-center transition-colors"
                :class="
                  form.attachmentFile
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                "
              >
                <input
                  type="file"
                  ref="fileInput"
                  accept="image/jpeg,image/png,image/jpg,.pdf"
                  class="hidden"
                  @change="handleFileSelect"
                />

                <div
                  v-if="!form.attachmentFile"
                  @click="$refs.fileInput.click()"
                  class="cursor-pointer"
                >
                  <Icon
                    icon="solar:cloud-upload-bold-duotone"
                    class="w-10 h-10 mx-auto text-slate-400 mb-2"
                  />
                  <p class="text-sm text-slate-500">Klik untuk upload file</p>
                </div>

                <div v-else class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <Icon
                      :icon="
                        form.attachmentFile.type.includes('pdf')
                          ? 'solar:document-bold-duotone'
                          : 'solar:gallery-bold-duotone'
                      "
                      class="w-8 h-8 text-emerald-600"
                    />
                    <div class="text-left">
                      <p
                        class="text-sm font-medium text-slate-700 truncate max-w-[200px]"
                      >
                        {{ form.attachmentFile.name }}
                      </p>
                      <p class="text-xs text-slate-500">
                        {{ formatFileSize(form.attachmentFile.size) }}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    @click="removeFile"
                    class="p-1 text-rose-500 hover:bg-rose-50 rounded-full"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" class="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p v-if="fileError" class="text-xs text-rose-500 mt-1">
                {{ fileError }}
              </p>
            </div>
          </div>

          <div
            class="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3"
          >
            <button
              @click="showModal = false"
              class="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium text-sm"
            >
              Batal
            </button>
            <button
              @click="submit"
              :disabled="submitting"
              class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center gap-2"
            >
              <Icon
                v-if="submitting"
                icon="lucide:loader-2"
                class="w-4 h-4 animate-spin"
              />
              {{ submitting ? "Mengirim..." : "Kirim Pengajuan" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    <!-- Status Modal -->
    <StatusModal
      :isOpen="statusModal.isOpen"
      :type="statusModal.type"
      :title="statusModal.title"
      :message="statusModal.message"
      @close="closeStatusModal"
    />

    <!-- Attachment Viewer Modal -->
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
          v-if="attachmentModal.show"
          class="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
        >
          <!-- Close Button -->
          <button
            @click="attachmentModal.show = false"
            class="absolute top-4 right-4 z-20 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <Icon icon="solar:close-circle-bold" class="w-8 h-8" />
          </button>

          <!-- Image Viewer -->
          <img
            v-if="isImageAttachment"
            :src="attachmentFullUrl"
            alt="Lampiran"
            class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />

          <!-- PDF Viewer -->
          <iframe
            v-else
            :src="attachmentFullUrl"
            class="w-full h-[90vh] max-w-4xl rounded-lg bg-white shadow-2xl"
          ></iframe>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import { permissionsApi, uploadFile } from "@/services/api";
import DataTable from "@/components/ui/DataTable.vue";
import StatusModal from "@/components/ui/StatusModal.vue";

// Responsive default: card for mobile (<768px), table for desktop
const isDesktop = window.matchMedia("(min-width: 768px)").matches;
const viewMode = ref(isDesktop ? "table" : "card");

const permissions = ref([]);
const loading = ref(true);
const showModal = ref(false);
const submitting = ref(false);
const fileError = ref("");
const fileInput = ref(null);

// Pagination & Filter State
const search = ref("");
const filterStatus = ref([]);
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

const columns = [
  { field: "type", label: "Jenis", sortable: true },
  { field: "startDate", label: "Tanggal", sortable: true },
  { field: "reason", label: "Alasan", sortable: false },
  { field: "attachment", label: "Bukti", sortable: false },
  { field: "status", label: "Status", sortable: true },
  { field: "createdAt", label: "Dibuat", sortable: true, align: "right" },
];

const statusModal = reactive({
  isOpen: false,
  type: "success",
  title: "",
  message: "",
});

function showStatus(type, title, message) {
  statusModal.type = type;
  statusModal.title = title;
  statusModal.message = message;
  statusModal.isOpen = true;
}

function closeStatusModal() {
  statusModal.isOpen = false;
}

const form = reactive({
  type: "sick",
  startDate: "",
  endDate: "",
  reason: "",
  attachment: "",
  attachmentFile: null,
});

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(s) {
  if (s === "all") return "Semua";
  if (s === "pending") return "Menunggu";
  if (s === "approved") return "Disetujui";
  if (s === "rejected") return "Ditolak";
  return s;
}

function statusIcon(status) {
  if (status === "approved") return "solar:check-circle-bold";
  if (status === "rejected") return "solar:close-circle-bold";
  return "solar:clock-circle-bold";
}

// Attachment Modal Logic
const attachmentModal = reactive({
  show: false,
  url: "",
});

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3000" : "");

const attachmentFullUrl = computed(() => {
  if (!attachmentModal.url) return "";
  if (attachmentModal.url.startsWith("http")) return attachmentModal.url;
  return `${BASE_URL}${attachmentModal.url}`;
});

const isImageAttachment = computed(() => {
  const url = attachmentModal.url.toLowerCase();
  return (
    url.endsWith(".jpg") ||
    url.endsWith(".jpeg") ||
    url.endsWith(".png") ||
    url.endsWith(".gif") ||
    url.endsWith(".webp")
  );
});

function openAttachment(url) {
  attachmentModal.url = url;
  attachmentModal.show = true;
}

// Client-side Filtering & Pagination
const filteredPermissions = computed(() => {
  let data = [...permissions.value];

  // Search
  if (search.value) {
    const q = search.value.toLowerCase();
    data = data.filter(
      (p) =>
        p.reason.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        formatStatus(p.status).toLowerCase().includes(q)
    );
  }

  // Filter Status
  if (filterStatus.value.length > 0) {
    data = data.filter((p) => filterStatus.value.includes(p.status));
  }

  return data;
});

const paginatedPermissions = computed(() => {
  const start = (pagination.page - 1) * pagination.limit;
  const end = start + pagination.limit;

  // Update total counts
  pagination.total = filteredPermissions.value.length;
  pagination.totalPages = Math.ceil(pagination.total / pagination.limit);

  return filteredPermissions.value.slice(start, end);
});

// Reset page when filter changes
watch(search, () => {
  pagination.page = 1;
});

// File handling functions
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/pdf",
];

function handleFileSelect(event) {
  const file = event.target.files[0];
  fileError.value = "";

  if (!file) return;

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    fileError.value = "Format file tidak didukung. Hanya jpg, png, dan pdf.";
    event.target.value = "";
    return;
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    fileError.value = `Ukuran file terlalu besar. Maksimal ${
      MAX_FILE_SIZE / (1024 * 1024)
    }MB.`;
    event.target.value = "";
    return;
  }

  form.attachmentFile = file;
}

function removeFile() {
  form.attachmentFile = null;
  form.attachment = "";
  fileError.value = "";
  if (fileInput.value) {
    fileInput.value.value = "";
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

async function fetchPermissions() {
  loading.value = true;
  try {
    const res = await permissionsApi.getMyPermissions();
    if (res.success) {
      permissions.value = res.data;
    }
  } catch (e) {
    console.error(e);
    showStatus(
      "error",
      "Gagal Memuat",
      e.message || "Gagal memuat data perizinan."
    );
  } finally {
    loading.value = false;
  }
}

async function submit() {
  if (!form.startDate || !form.endDate || !form.reason) {
    showStatus(
      "error",
      "Data Belum Lengkap",
      "Mohon lengkapi semua field yang tersedia."
    );
    return;
  }

  // Validate file attachment is required
  if (!form.attachmentFile) {
    fileError.value = "Bukti koordinasi atasan wajib dilampirkan.";
    showStatus(
      "error",
      "Lampiran Kurang",
      "Bukti koordinasi atasan wajib dilampirkan."
    );
    return;
  }

  submitting.value = true;
  try {
    // Upload file first using API service
    const uploadData = await uploadFile(form.attachmentFile);
    if (!uploadData.success) {
      throw new Error(uploadData.message || "Gagal mengupload file.");
    }

    // Submit permission with attachment URL
    await permissionsApi.submitPermission({
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason,
      attachment: uploadData.data.url,
    });

    showModal.value = false;
    removeFile(); // Clear file
    Object.assign(form, {
      type: "sick",
      startDate: "",
      endDate: "",
      reason: "",
      attachment: "",
      attachmentFile: null,
    });

    showStatus("success", "Berhasil", "Pengajuan izin berhasil dikirim.");
    await fetchPermissions();
  } catch (e) {
    console.error(e);
    showStatus(
      "error",
      "Gagal Mengirim",
      e.message || "Gagal mengirim pengajuan."
    );
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  fetchPermissions();
});
</script>
