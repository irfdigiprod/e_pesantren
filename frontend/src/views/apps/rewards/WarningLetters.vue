<template>
  <div class="px-2">
    <!-- Filter (Optional) -->

    <!-- List -->
    <DataTable
      title="Daftar Surat Peringatan"
      description="Kelola penerbitan dan status surat peringatan santri"
      icon="solar:danger-circle-bold"
      :loading="loading"
      :items="paginatedWarnings"
      :columns="columns"
      :viewMode="viewMode"
      :search="search"
      :pagination="{
        page: currentPage,
        limit: itemsPerPage,
        total: filteredInfo.length,
        totalPages: Math.ceil(filteredInfo.length / itemsPerPage),
      }"
      @update:viewMode="viewMode = $event"
      @update:search="search = $event"
      @update:limit="itemsPerPage = $event"
      @page-change="currentPage = $event"
    >
      <template #header-actions>
        <!-- Actions if needed -->
        <button
          @click="openModal()"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 font-medium"
        >
          <Icon icon="solar:danger-circle-bold" />
          Terbitkan SP
        </button>
      </template>

      <!-- Filters Slot -->
      <template #filters>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Status</label
            >
            <select
              v-model="filterStatus"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="resolved">Selesai</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Tingkat SP</label
            >
            <select
              v-model="filterLevel"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="all">Semua Tingkat</option>
              <option :value="1">SP 1</option>
              <option :value="2">SP 2</option>
              <option :value="3">SP 3</option>
            </select>
          </div>
        </div>
      </template>

      <!-- Cell: Student -->
      <template #cell-student="{ item }">
        <div class="font-medium text-slate-800">
          {{ item.student?.fullName }}
        </div>
        <div class="text-xs text-slate-500">{{ item.student?.nis }}</div>
      </template>

      <!-- Cell: SP Level -->
      <template #cell-spLevel="{ item }">
        <span
          class="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-white shadow-sm"
          :class="getSpColor(item.spLevel)"
        >
          {{ item.spLevel }}
        </span>
      </template>

      <!-- Cell: Issue Date -->
      <template #cell-issueDate="{ item }">
        {{ formatDate(item.issueDate) }}
      </template>

      <!-- Cell: Valid Until -->
      <template #cell-validUntil="{ item }">
        <span class="text-slate-500">
          {{ formatDate(item.validUntil) || "-" }}
        </span>
      </template>

      <!-- Cell: Status -->
      <template #cell-status="{ item }">
        <span
          class="px-2 py-1 rounded text-xs font-medium border"
          :class="
            item.status === 'active'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-green-50 text-green-700 border-green-200'
          "
        >
          {{ item.status === "active" ? "Aktif" : "Selesai" }}
        </span>
      </template>

      <!-- Cell: Action -->
      <template #cell-action="{ item }">
        <div class="flex justify-end gap-2 items-center">
          <button
            v-if="item.status === 'active'"
            @click="resolveWarning(item)"
            class="text-green-600 hover:text-green-800 mr-2 text-xs border border-green-200 bg-green-50 px-2 py-1 rounded"
            title="Tandai Selesai"
          >
            Selesaikan
          </button>
          <button
            @click="openModal(item)"
            class="text-blue-600 hover:text-blue-800 mr-2"
          >
            <Icon icon="solar:pen-bold" />
          </button>
          <button
            @click="deleteWarning(item.id)"
            class="text-red-500 hover:text-red-700"
          >
            <Icon icon="solar:trash-bin-trash-bold" />
          </button>
        </div>
      </template>

      <!-- Card Item Slot -->
      <template #card-item="{ item }">
        <div
          class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
        >
          <div
            class="absolute left-0 top-0 bottom-0 w-1"
            :class="item.status === 'active' ? 'bg-red-500' : 'bg-green-500'"
          ></div>
          <div class="pl-3">
            <div class="flex justify-between items-start mb-2">
              <span
                class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white"
                :class="getSpColor(item.spLevel)"
              >
                {{ item.spLevel }}
              </span>
              <span
                class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                :class="
                  item.status === 'active'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-green-50 text-green-700 border-green-200'
                "
              >
                {{ item.status === "active" ? "Aktif" : "Selesai" }}
              </span>
            </div>

            <h3 class="font-bold text-slate-800 text-lg mb-0.5">
              {{ item.student?.fullName }}
            </h3>
            <p class="text-slate-500 text-xs mb-2">{{ item.student?.nis }}</p>

            <div class="space-y-1 text-sm text-slate-600 mb-3">
              <div class="flex justify-between">
                <span class="text-slate-400">Terbit:</span>
                <span>{{ formatDate(item.issueDate) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Berlaku:</span>
                <span>{{ formatDate(item.validUntil) || "-" }}</span>
              </div>
            </div>

            <p
              class="text-sm text-red-600 italic line-clamp-2 mb-3 bg-red-50 p-2 rounded"
            >
              "{{ item.reason }}"
            </p>

            <div class="flex justify-end gap-2 border-t pt-3">
              <button
                v-if="item.status === 'active'"
                @click="resolveWarning(item)"
                class="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg flex-1"
              >
                Selesaikan
              </button>
              <button
                @click="openModal(item)"
                class="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
              >
                <Icon icon="solar:pen-bold" />
              </button>
              <button
                @click="deleteWarning(item.id)"
                class="p-1.5 text-red-600 hover:bg-red-50 rounded"
              >
                <Icon icon="solar:trash-bin-trash-bold" />
              </button>
            </div>
          </div>
        </div>
      </template>
    </DataTable>

    <!-- Modal Form -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/40 backdrop-blur-sm"
        @click="closeModal"
      ></div>
      <div
        class="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-fade-in-up"
      >
        <h3 class="text-lg font-bold text-slate-800 mb-4">
          {{ isEditing ? "Edit" : "Terbitkan" }} Surat Peringatan
        </h3>

        <form @submit.prevent="submitForm" class="space-y-4">
          <!-- Student Selector -->
          <div class="relative">
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Cari Santri <span class="text-red-500">*</span></label
            >
            <div class="relative">
              <input
                type="text"
                v-model="studentSearch"
                @focus="showStudentDropdown = true"
                @input="onSearchStudent"
                placeholder="Nama atau NIS..."
                :disabled="isEditing"
                class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none disabled:bg-slate-100"
              />
              <Icon
                icon="solar:magnifer-line-duotone"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            <!-- Dropdown -->
            <div
              v-if="showStudentDropdown && filteredStudents.length > 0"
              class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
            >
              <div
                v-for="s in filteredStudents"
                :key="s.id"
                @click="selectStudent(s)"
                class="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b last:border-0"
              >
                <div class="font-medium text-slate-800">{{ s.fullName }}</div>
                <div class="text-xs text-slate-500">{{ s.nis }}</div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Tingkat SP <span class="text-red-500">*</span></label
              >
              <select
                v-model.number="form.spLevel"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
              >
                <option :value="1">SP 1 (Ringan)</option>
                <option :value="2">SP 2 (Sedang)</option>
                <option :value="3">SP 3 (Berat)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Status</label
              >
              <select
                v-model="form.status"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
              >
                <option value="active">Aktif</option>
                <option value="resolved">Selesai / Dicabut</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Tanggal Terbit</label
              >
              <input
                v-model="form.issueDate"
                type="date"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Berlaku Sampai</label
              >
              <input
                v-model="form.validUntil"
                type="date"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Alasan / Pelanggaran <span class="text-red-500">*</span></label
            >
            <textarea
              v-model="form.reason"
              rows="3"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-red-500"
              placeholder="Jelaskan alasan penerbitan SP..."
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Catatan Tambahan</label
            >
            <textarea
              v-model="form.notes"
              rows="2"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
              placeholder="Tindak lanjut, dll..."
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="processing"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
            >
              <Icon v-if="processing" icon="svg-spinners:ring-resize" />
              {{ processing ? "Menyimpan..." : "Simpan" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirm Modal -->
    <ConfirmModal
      :isOpen="confirmModal.isOpen"
      :title="confirmModal.title"
      :message="confirmModal.message"
      :confirmText="confirmModal.confirmText"
      :type="confirmModal.type"
      :loading="processing"
      @confirm="executeAction"
      @close="closeConfirmModal"
      @cancel="closeConfirmModal"
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

<script setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import { warningsApi, studentsApi } from "@/services/api";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import StatusModal from "@/components/ui/StatusModal.vue";
import DataTable from "@/components/ui/DataTable.vue";

const warnings = ref([]);
const students = ref([]);
const loading = ref(false);
const processing = ref(false);
const showModal = ref(false);
const isEditing = ref(false);

// DataTable State
const search = ref("");
const filterStatus = ref("all");
const filterLevel = ref("all");
const viewMode = ref("table");
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Student Search logic
const studentSearch = ref("");
const showStudentDropdown = ref(false);
const filteredStudents = ref([]);

const confirmModal = reactive({
  isOpen: false,
  title: "",
  message: "",
  confirmText: "Ya",
  type: "primary", // 'primary' | 'danger'
  action: null, // 'resolve' | 'delete'
  data: null,
});

const statusModal = reactive({
  isOpen: false,
  type: "success",
  title: "",
  message: "",
});

const form = reactive({
  id: null,
  studentId: null,
  spLevel: 1,
  status: "active",
  issueDate: new Date().toISOString().split("T")[0],
  validUntil: "",
  reason: "",
  notes: "",
});

const columns = [
  { field: "student", label: "Santri", sortable: true },
  { field: "spLevel", label: "Tingkat SP", sortable: true, align: "center" },
  { field: "issueDate", label: "Tanggal Terbit", sortable: true },
  { field: "validUntil", label: "Berlaku Sampai" },
  { field: "status", label: "Status", sortable: true },
  { field: "reason", label: "Alasan" },
  { field: "action", label: "Aksi", align: "right" },
];

// Computed
const filteredInfo = computed(() => {
  let res = warnings.value;

  if (filterStatus.value !== "all") {
    res = res.filter((w) => w.status === filterStatus.value);
  }

  if (filterLevel.value !== "all") {
    res = res.filter((w) => w.spLevel === filterLevel.value);
  }

  if (search.value) {
    const q = search.value.toLowerCase();
    res = res.filter(
      (w) =>
        w.student?.fullName?.toLowerCase().includes(q) ||
        w.student?.nis?.toLowerCase().includes(q) ||
        w.reason?.toLowerCase().includes(q),
    );
  }
  return res;
});

const paginatedWarnings = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredInfo.value.slice(start, end);
});

// Helpers
const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
const getSpColor = (level) => {
  if (level === 1) return "bg-yellow-500";
  if (level === 2) return "bg-orange-500";
  return "bg-red-600";
};

// API
async function fetchWarnings() {
  loading.value = true;
  try {
    const res = await warningsApi.getAll();
    if (res.success) warnings.value = res.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function fetchStudents() {
  try {
    const res = await studentsApi.getAll({ limit: 0 });
    if (res.data) {
      if (Array.isArray(res.data)) students.value = res.data;
      else if (res.data.data) students.value = res.data.data;
    }
  } catch (err) {
    console.error(err);
  }
}

function showStatus(type, title, message) {
  statusModal.type = type;
  statusModal.title = title;
  statusModal.message = message;
  statusModal.isOpen = true;
}

// Modal actions
function openModal(item = null) {
  if (item) {
    isEditing.value = true;
    form.id = item.id;
    form.studentId = item.studentId;
    form.spLevel = item.spLevel;
    form.status = item.status;
    form.issueDate = item.issueDate ? item.issueDate.split("T")[0] : "";
    form.validUntil = item.validUntil ? item.validUntil.split("T")[0] : "";
    form.reason = item.reason;
    form.notes = item.notes;

    // Find student name
    const s = students.value.find((x) => x.id === item.studentId);
    studentSearch.value = s ? s.fullName : item.student?.fullName || "";
  } else {
    isEditing.value = false;
    form.id = null;
    form.studentId = null;
    form.spLevel = 1;
    form.status = "active";
    form.issueDate = new Date().toISOString().split("T")[0];
    form.validUntil = "";
    form.reason = "";
    form.notes = "";
    studentSearch.value = "";
  }
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

// Student Search logic
function onSearchStudent() {
  if (!studentSearch.value) {
    filteredStudents.value = [];
    return;
  }
  const q = studentSearch.value.toLowerCase();
  filteredStudents.value = students.value.filter(
    (s) =>
      s.fullName.toLowerCase().includes(q) || s.nis?.toLowerCase().includes(q),
  );
  showStudentDropdown.value = true;
}
function selectStudent(s) {
  form.studentId = s.id;
  studentSearch.value = s.fullName;
  showStudentDropdown.value = false;
}

// Submit
async function submitForm() {
  processing.value = true;
  try {
    const payload = { ...form };
    if (!payload.validUntil) delete payload.validUntil; // Optional

    if (isEditing.value) {
      await warningsApi.update(form.id, payload);
    } else {
      await warningsApi.create(payload);
    }
    await fetchWarnings();
    closeModal();
    showStatus("success", "Berhasil", "Data SP berhasil disimpan.");
  } catch (err) {
    showStatus("error", "Gagal", err.message || "Gagal menyimpan data");
  } finally {
    processing.value = false;
  }
}

// Actions
function resolveWarning(w) {
  confirmModal.action = "resolve";
  confirmModal.data = w;
  confirmModal.title = "Selesaikan SP?";
  confirmModal.message = `Tandai status SP ${w.spLevel} untuk ${w.student?.fullName} sebagai Selesai?`;
  confirmModal.confirmText = "Selesaikan";
  confirmModal.type = "primary";
  confirmModal.isOpen = true;
}

function deleteWarning(id) {
  confirmModal.action = "delete";
  confirmModal.data = id;
  confirmModal.title = "Hapus Data SP?";
  confirmModal.message =
    "Apakah Anda yakin ingin menghapus data surat peringatan ini? Tindakan ini tidak dapat dibatalkan.";
  confirmModal.confirmText = "Hapus";
  confirmModal.type = "danger";
  confirmModal.isOpen = true;
}

function closeConfirmModal() {
  confirmModal.isOpen = false;
  confirmModal.data = null;
}

async function executeAction() {
  if (!confirmModal.action) return;

  processing.value = true;
  try {
    if (confirmModal.action === "resolve") {
      const w = confirmModal.data;
      await warningsApi.update(w.id, { status: "resolved" });
      showStatus(
        "success",
        "Berhasil",
        "Status SP diperbarui menjadi Selesai.",
      );
    } else if (confirmModal.action === "delete") {
      const id = confirmModal.data;
      await warningsApi.delete(id);
      showStatus("success", "Berhasil", "Data SP berhasil dihapus.");
    }
    await fetchWarnings();
    closeConfirmModal();
  } catch (err) {
    closeConfirmModal();
    showStatus("error", "Gagal", err.message || "Gagal memproses tindakan");
  } finally {
    processing.value = false;
  }
}

onMounted(() => {
  fetchWarnings();
  fetchStudents();
});
</script>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.2s ease-out;
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
