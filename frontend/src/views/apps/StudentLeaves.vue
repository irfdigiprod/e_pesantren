<template>
  <div class="p-2 md:p-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 px-2 md:px-0">
      <div v-if="!inputMode">
        <h1 class="text-xl font-semibold text-slate-800">Izin Pulang Santri</h1>
        <p class="text-sm text-slate-500">
          Kelola perizinan pulang santri secara kolektif.
        </p>
      </div>
      <div v-else></div>

      <div class="flex gap-2">
        <button
          @click="toggleInputMode"
          class="px-4 py-2 rounded-lg bg-[#602515] text-white text-sm font-medium hover:bg-[#8c3d2a] transition flex items-center gap-2 shadow-lg shadow-[#602515]/20"
        >
          <Icon :icon="inputMode ? 'solar:list-bold' : 'solar:pen-new-square-bold'" />
          {{ inputMode ? "Lihat Riwayat" : "Input Izin Baru" }}
        </button>
      </div>
    </div>

    <!-- Mode: History Table -->
    <div v-if="!inputMode" class="bg-white rounded-xl shadow-sm border p-1">
      <DataTable
        :items="paginatedLeaves"
        :columns="columns"
        :loading="loading"
        :search="search"
        :pagination="pagination"
        :viewMode="viewMode"
        searchPlaceholder="Cari alasan atau nama..."
        show-index
        with-filter
        :filterable="true"
        filterButtonLabel="Filter Tanggal"
        @update:search="search = $event"
        @update:limit="pageSize = $event"
        @page-change="currentPage = $event"
        @update:viewMode="viewMode = $event"
      >
        <!-- Custom Filter -->
        <template #filters>
          <div class="p-2">
            <h3 class="font-semibold text-slate-800 mb-3 border-b pb-2 text-sm">
              Filter Rentang Tanggal
            </h3>
            <div class="space-y-4">
              <div class="grid grid-cols-1 gap-3">
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Dari Tanggal</label>
                  <input
                    type="date"
                    v-model="filters.startDate"
                    @change="fetchData"
                    class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#602515]/20 outline-none"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Sampai Tanggal</label>
                  <input
                    type="date"
                    v-model="filters.endDate"
                    @change="fetchData"
                    class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#602515]/20 outline-none"
                  />
                </div>
              </div>
            </div>
            <button
              @click="resetFilters"
              class="mt-4 w-full py-2 text-xs font-bold text-slate-400 hover:text-[#602515] transition-colors border border-dashed rounded-lg"
            >
              Reset Filter
            </button>
          </div>
        </template>

        <!-- Students Column -->
        <template #cell-students="{ item }">
          <div class="flex flex-wrap gap-1 max-w-xs">
            <span 
              v-for="subItem in item.items" 
              :key="subItem.id"
              class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold"
            >
              {{ subItem.student?.fullName }}
            </span>
            <span v-if="!item.items?.length" class="text-slate-300 text-xs">-</span>
          </div>
        </template>

        <!-- Date Column -->
        <template #cell-dates="{ item }">
          <div class="flex flex-col">
            <span class="text-xs font-bold text-slate-700">{{ formatDate(item.startDate) }}</span>
            <span class="text-[10px] text-slate-400">s/d {{ formatDate(item.endDate) }}</span>
          </div>
        </template>

        <!-- Category Column -->
        <template #cell-type="{ item }">
          <span
            class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
            :class="{
              'bg-purple-100 text-purple-700': item.type === 'sick',
              'bg-blue-100 text-blue-700': item.type === 'permit',
            }"
          >
            {{ item.type === 'sick' ? 'Sakit' : 'Izin' }}
          </span>
        </template>

        <!-- Reason Column -->
        <template #cell-reason="{ item }">
          <div class="max-w-xs truncate text-xs text-slate-600" :title="item.reason">
            {{ item.reason }}
          </div>
        </template>

        <!-- Actions -->
        <template #cell-actions="{ item }">
          <div class="flex justify-end gap-1">
            <button
              @click="editItem(item)"
              class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Edit"
            >
              <Icon icon="solar:pen-bold" width="16" />
            </button>
            <button
              @click="confirmDelete(item)"
              class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Hapus"
            >
              <Icon icon="solar:trash-bin-trash-bold" width="16" />
            </button>
          </div>
        </template>

        <!-- Card View -->
        <template #card-item="{ item }">
          <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div class="flex justify-between items-start mb-4">
              <span
                class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                :class="{
                  'bg-purple-100 text-purple-700': item.type === 'sick',
                  'bg-blue-100 text-blue-700': item.type === 'permit',
                }"
              >
                {{ item.type === 'sick' ? 'Sakit' : 'Izin' }}
              </span>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                {{ formatDate(item.createdAt) }}
              </div>
            </div>

            <div class="space-y-3 mb-4">
              <div class="flex flex-wrap gap-1.5">
                <span 
                  v-for="subItem in item.items" 
                  :key="subItem.id"
                  class="px-2 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-100"
                >
                  {{ subItem.student?.fullName }}
                </span>
              </div>
              
              <div class="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Icon icon="solar:calendar-date-linear" class="text-[#602515]" />
                {{ formatDate(item.startDate) }} - {{ formatDate(item.endDate) }}
              </div>

              <p class="text-xs text-slate-500 line-clamp-2 italic">
                "{{ item.reason }}"
              </p>
            </div>

            <div class="flex justify-end pt-4 border-t border-slate-50 gap-2">
              <button
                @click="editItem(item)"
                class="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold flex items-center gap-1.5 hover:bg-blue-100 transition-all"
              >
                <Icon icon="solar:pen-bold" width="14" />
                Edit
              </button>
              <button
                @click="confirmDelete(item)"
                class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <Icon icon="solar:trash-bin-trash-bold" width="18" />
              </button>
            </div>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Mode: Input Form -->
    <div v-else class="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <StudentLeaveInput 
        :initialData="editingItem" 
        @success="onInputSuccess" 
        @cancel="toggleInputMode" 
      />
    </div>

    <!-- Confirm Dialog -->
    <ConfirmModal
      :isOpen="confirm.show"
      title="Hapus Data Izin?"
      type="danger"
      @confirm="deleteItem"
      @cancel="confirm.show = false"
    >
      Menghapus data ini akan membatalkan status izin pada absensi dan mutabaah santri terkait.
    </ConfirmModal>

    <!-- Status Modal -->
    <StatusModal
      :isOpen="statusModal.show"
      :type="statusModal.type"
      :title="statusModal.title"
      :message="statusModal.message"
      @close="statusModal.show = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { Icon } from "@iconify/vue";
import DataTable from "@/components/ui/DataTable.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import StatusModal from "@/components/ui/StatusModal.vue";
import StudentLeaveInput from "./StudentLeaveInput.vue";
import { studentLeavesApi } from "@/services/api.js";

const loading = ref(false);
const inputMode = ref(false);
const leaves = ref([]);

// DataTable State
const search = ref("");
const currentPage = ref(1);
const pageSize = ref(10);
const viewMode = ref("table");

const filters = reactive({
  startDate: "",
  endDate: "",
});

const confirm = reactive({ show: false, item: null });
const editingItem = ref(null);
const statusModal = reactive({
  show: false,
  type: "success",
  title: "",
  message: "",
});

const columns = [
  { label: "Santri", field: "students" },
  { label: "Rentang Tanggal", field: "dates" },
  { label: "Kategori", field: "type" },
  { label: "Alasan", field: "reason" },
  { label: "Aksi", field: "actions", align: "right" },
];

// Computed Logic
const filteredLeaves = computed(() => {
  let items = leaves.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    items = items.filter((item) => {
      const reason = item.reason?.toLowerCase() || "";
      const studentNames = item.items?.map(i => i.student?.fullName?.toLowerCase()).join(" ") || "";
      return reason.includes(q) || studentNames.includes(q);
    });
  }
  return items;
});

const paginatedLeaves = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredLeaves.value.slice(start, end);
});

const pagination = computed(() => ({
  page: currentPage.value,
  limit: pageSize.value,
  total: filteredLeaves.value.length,
  totalPages: Math.ceil(filteredLeaves.value.length / pageSize.value),
}));

// Methods
function toggleInputMode() {
  if (inputMode.value) {
    editingItem.value = null;
  }
  inputMode.value = !inputMode.value;
  if (!inputMode.value) fetchData();
}

function editItem(item) {
  editingItem.value = item;
  inputMode.value = true;
}

function onInputSuccess() {
  editingItem.value = null;
  inputMode.value = false;
  fetchData();
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await studentLeavesApi.getLeaves(filters);
    leaves.value = res.data || [];
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  filters.startDate = "";
  filters.endDate = "";
  fetchData();
}

function confirmDelete(item) {
  confirm.item = item;
  confirm.show = true;
}

async function deleteItem() {
  if (!confirm.item) return;
  try {
    await studentLeavesApi.deleteLeave(confirm.item.id);
    confirm.show = false;
    showStatus("success", "Berhasil", "Data izin berhasil dihapus");
    fetchData();
  } catch (e) {
    showStatus("error", "Gagal", e.message || "Gagal menghapus data");
  }
}

function showStatus(type, title, message) {
  statusModal.type = type;
  statusModal.title = title;
  statusModal.message = message;
  statusModal.show = true;
}

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

onMounted(fetchData);
</script>
