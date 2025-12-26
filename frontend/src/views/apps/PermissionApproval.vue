<template>
  <div class="space-y-6 overflow-hidden max-w-full">
    <DataTable
      :items="paginatedPermissions"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      :viewMode="viewMode"
      title="Persetujuan Izin"
      description="Kelola pengajuan izin dari guru."
      icon="solar:check-read-bold-duotone"
      :search="search"
      @update:search="search = $event"
      @update:limit="
        pagination.limit = $event;
        pagination.page = 1;
      "
      @page-change="pagination.page = $event"
      @update:viewMode="viewMode = $event"
    >
      <!-- Filters -->
      <template #filters>
        <div class="space-y-4">
          <h3 class="font-medium text-slate-800 border-b border-slate-100 pb-2">
            Filter Status
          </h3>
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="all"
                v-model="filterStatus"
                class="rounded-full text-indigo-600 focus:ring-indigo-500"
              />
              <span class="text-sm text-slate-600">Semua</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="pending"
                v-model="filterStatus"
                class="rounded-full text-indigo-600 focus:ring-indigo-500"
              />
              <span class="text-sm text-slate-600">Menunggu</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="approved"
                v-model="filterStatus"
                class="rounded-full text-indigo-600 focus:ring-indigo-500"
              />
              <span class="text-sm text-slate-600">Disetujui</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="rejected"
                v-model="filterStatus"
                class="rounded-full text-indigo-600 focus:ring-indigo-500"
              />
              <span class="text-sm text-slate-600">Ditolak</span>
            </label>
          </div>
        </div>
      </template>
      <!-- Cell: Teacher Name -->
      <template #cell-teacherName="{ item }">
        <div class="font-medium text-slate-800">
          {{ item.teacherName || "-" }}
          <div
            v-if="item.teacherNip || item.teacherDivision"
            class="text-xs text-slate-400 font-normal"
          >
            <span v-if="item.teacherNip">{{ item.teacherNip }}</span>
            <span v-if="item.teacherNip && item.teacherDivision"> · </span>
            <span v-if="item.teacherDivision">{{ item.teacherDivision }}</span>
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
              : 'bg-blue-100 text-blue-800'
          "
        >
          {{ item.type === "sick" ? "Sakit" : "Izin" }}
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
        <p class="text-xs text-slate-400 mt-1">
          {{ new Date(item.createdAt).toLocaleDateString("id-ID") }}
        </p>
      </template>

      <!-- Cell: Status -->
      <template #cell-status="{ item }">
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
      </template>

      <!-- Cell: Actions -->
      <template #cell-actions="{ item }">
        <div
          v-if="item.status === 'pending'"
          class="flex items-center justify-end gap-2"
        >
          <!-- Attachment Button -->
          <button
            v-if="item.attachment"
            @click="openAttachment(item.attachment)"
            class="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            title="Lihat Lampiran"
          >
            <Icon icon="solar:paperclip-bold-duotone" class="w-4 h-4" />
          </button>
          <button
            @click="updateStatus(item.id, 'approved')"
            :disabled="processing === item.id"
            class="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
            title="Setujui"
          >
            <Icon
              v-if="processing === item.id"
              icon="lucide:loader-2"
              class="w-4 h-4 animate-spin"
            />
            <Icon v-else icon="solar:check-circle-bold" class="w-4 h-4" />
          </button>
          <button
            @click="updateStatus(item.id, 'rejected')"
            :disabled="processing === item.id"
            class="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
            title="Tolak"
          >
            <Icon
              v-if="processing !== item.id"
              icon="solar:close-circle-bold"
              class="w-4 h-4"
            />
          </button>
        </div>
        <div v-else class="flex items-center justify-end gap-2">
          <button
            v-if="item.attachment"
            @click="openAttachment(item.attachment)"
            class="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            title="Lihat Lampiran"
          >
            <Icon icon="solar:paperclip-bold-duotone" class="w-4 h-4" />
          </button>
          <span class="text-xs text-slate-400 italic">Selesai</span>
        </div>
      </template>

      <!-- Card Item View -->
      <template #card-item="{ item }">
        <div
          class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow h-full flex flex-col"
        >
          <div class="flex items-start justify-between gap-3 mb-3">
            <div>
              <div class="font-medium text-slate-800">
                {{ item.teacherName || "-" }}
              </div>
              <div
                v-if="item.teacherNip || item.teacherDivision"
                class="text-xs text-slate-400"
              >
                {{ item.teacherNip
                }}<span v-if="item.teacherNip && item.teacherDivision"> · </span
                >{{ item.teacherDivision }}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                :class="
                  item.type === 'sick'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-blue-100 text-blue-800'
                "
              >
                {{ item.type === "sick" ? "Sakit" : "Izin" }}
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
          </div>
          <div class="text-sm text-slate-700 mb-2">
            <span class="font-medium">{{ formatDate(item.startDate) }}</span>
            <span v-if="item.startDate !== item.endDate" class="text-slate-500">
              s.d {{ formatDate(item.endDate) }}
            </span>
          </div>
          <p class="text-sm text-slate-600 mb-3 line-clamp-2 mt-auto">
            {{ item.reason }}
          </p>

          <!-- Action Buttons for Pending -->
          <div
            v-if="item.status === 'pending'"
            class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100"
          >
            <button
              v-if="item.attachment"
              @click="openAttachment(item.attachment)"
              class="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
            >
              <Icon icon="solar:paperclip-bold-duotone" class="w-4 h-4" />
              Lampiran
            </button>
            <button
              @click="updateStatus(item.id, 'approved')"
              :disabled="processing === item.id"
              class="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
            >
              <Icon
                v-if="processing === item.id"
                icon="lucide:loader-2"
                class="w-4 h-4 animate-spin"
              />
              <Icon v-else icon="solar:check-circle-bold" class="w-4 h-4" />
              Setujui
            </button>
            <button
              @click="updateStatus(item.id, 'rejected')"
              :disabled="processing === item.id"
              class="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
            >
              <Icon
                v-if="processing !== item.id"
                icon="solar:close-circle-bold"
                class="w-4 h-4"
              />
              Tolak
            </button>
          </div>
          <div
            v-else
            class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100"
          >
            <button
              v-if="item.attachment"
              @click="openAttachment(item.attachment)"
              class="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
            >
              <Icon icon="solar:paperclip-bold-duotone" class="w-4 h-4" />
              Lampiran
            </button>
            <span class="text-xs text-slate-400 italic">Selesai</span>
          </div>
        </div>
      </template>
    </DataTable>

    <!-- Approval Modal with Salary Toggle -->
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
          v-if="approvalModal.show"
          class="fixed inset-0 z-[9999] flex items-center justify-center px-4"
        >
          <div
            class="absolute inset-0 bg-black/40 backdrop-blur-sm"
            @click="approvalModal.show = false"
          ></div>

          <div
            class="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative z-10 text-center"
          >
            <!-- Icon -->
            <div
              class="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6"
              :class="
                approvalModal.isApprove
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-red-100 text-red-600'
              "
            >
              <Icon
                :icon="
                  approvalModal.isApprove
                    ? 'solar:check-circle-bold'
                    : 'solar:close-circle-bold'
                "
                width="48"
              />
            </div>

            <h3 class="text-xl font-bold text-slate-800 mb-2">
              {{
                approvalModal.isApprove
                  ? "Setujui Pengajuan?"
                  : "Tolak Pengajuan?"
              }}
            </h3>
            <p class="text-slate-500 text-sm mb-6">
              {{
                approvalModal.isApprove
                  ? "Pengajuan izin akan disetujui dan record absensi otomatis dibuat."
                  : "Pengajuan izin ini akan ditolak."
              }}
            </p>

            <!-- Salary Deduction Toggle (Only for Approve) -->
            <div
              v-if="approvalModal.isApprove"
              class="bg-slate-50 rounded-xl p-4 mb-6 text-left"
            >
              <p class="text-sm font-medium text-slate-700 mb-3">
                Potong Gaji?
              </p>
              <div class="flex gap-3">
                <button
                  @click="approvalModal.deductSalary = true"
                  class="flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all border-2"
                  :class="
                    approvalModal.deductSalary
                      ? 'border-rose-500 bg-rose-50 text-rose-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  "
                >
                  <Icon
                    icon="solar:minus-circle-bold"
                    class="w-5 h-5 inline mr-2"
                  />
                  Ya, Potong
                </button>
                <button
                  @click="approvalModal.deductSalary = false"
                  class="flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all border-2"
                  :class="
                    !approvalModal.deductSalary
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  "
                >
                  <Icon
                    icon="solar:check-circle-bold"
                    class="w-5 h-5 inline mr-2"
                  />
                  Tidak Potong
                </button>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <button
                @click="approvalModal.show = false"
                class="flex-1 py-3 px-6 rounded-xl font-bold transition-all border-2 border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                @click="executeAction"
                :disabled="processing !== null"
                class="flex-1 py-3 px-6 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50"
                :class="
                  approvalModal.isApprove
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                "
              >
                <span
                  v-if="processing"
                  class="flex items-center justify-center gap-2"
                >
                  <Icon
                    icon="solar:spinner-line-duotone"
                    class="animate-spin"
                    width="20"
                  />
                  Memproses...
                </span>
                <span v-else>
                  {{ approvalModal.isApprove ? "Ya, Setujui" : "Ya, Tolak" }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

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
import { permissionsApi } from "@/services/api";
import DataTable from "@/components/ui/DataTable.vue";

// Responsive default: card for mobile (<768px), table for desktop
const isDesktop = window.matchMedia("(min-width: 768px)").matches;
const viewMode = ref(isDesktop ? "table" : "card");

const permissions = ref([]);
const loading = ref(false);
const processing = ref(null);
const filterStatus = ref("all");
const search = ref("");

// Pagination State
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

const columns = [
  { field: "teacherName", label: "Nama Guru", sortable: true },
  { field: "type", label: "Jenis", sortable: true },
  { field: "startDate", label: "Tanggal", sortable: true },
  { field: "reason", label: "Alasan", sortable: false },
  { field: "status", label: "Status", sortable: true },
  { field: "actions", label: "Aksi", sortable: false, align: "right" },
];

// Attachment Modal State
const attachmentModal = reactive({
  show: false,
  url: "",
});

// Computed for attachment viewer
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const attachmentFullUrl = computed(() => {
  if (!attachmentModal.url) return "";
  // If already absolute URL, return as is
  if (attachmentModal.url.startsWith("http")) return attachmentModal.url;
  // Otherwise prepend BASE_URL
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

// Approval Modal State
const approvalModal = reactive({
  show: false,
  isApprove: true,
  deductSalary: true, // Default: potong gaji
  actionId: null,
});

const filteredPermissions = computed(() => {
  let data = [...permissions.value];

  // Filter Status
  if (filterStatus.value !== "all") {
    data = data.filter((p) => p.status === filterStatus.value);
  }

  // Filter Search
  if (search.value) {
    const q = search.value.toLowerCase();
    data = data.filter(
      (p) =>
        (p.teacherName || "").toLowerCase().includes(q) ||
        p.reason.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        formatStatus(p.status).toLowerCase().includes(q)
    );
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
watch([search, filterStatus], () => {
  pagination.page = 1;
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

async function fetchPermissions() {
  loading.value = true;
  try {
    const res = await permissionsApi.getAllPermissions();
    if (res.success) {
      permissions.value = res.data;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function updateStatus(id, status) {
  approvalModal.isApprove = status === "approved";
  approvalModal.deductSalary = true; // Reset to default
  approvalModal.actionId = id;
  approvalModal.show = true;
}

async function executeAction() {
  if (!approvalModal.actionId) return;

  const id = approvalModal.actionId;
  const status = approvalModal.isApprove ? "approved" : "rejected";
  processing.value = id;

  try {
    await permissionsApi.updateStatus(id, status, approvalModal.deductSalary);
    // Optimistic update
    const idx = permissions.value.findIndex((p) => p.id === id);
    if (idx !== -1) {
      permissions.value[idx].status = status;
    }
  } catch (e) {
    console.error(e);
  } finally {
    processing.value = null;
    approvalModal.show = false;
    approvalModal.actionId = null;
  }
}

onMounted(() => {
  fetchPermissions();
});
</script>
