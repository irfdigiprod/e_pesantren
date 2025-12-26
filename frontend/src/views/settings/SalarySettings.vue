<template>
  <div class="max-w-7xl mx-auto pb-12">
    <!-- DataTable -->
    <DataTable
      :key="currentTab"
      :items="paginatedData"
      :columns="currentColumns"
      :loading="loading"
      :pagination="pagination"
      :viewMode="viewMode"
      title="Komponen Gaji Guru"
      description="Kelola golongan gaji, tunjangan jabatan, masa kerja, dan tunjangan lainnya."
      icon="solar:wallet-money-bold-duotone"
      filterButtonIcon="solar:hamburger-menu-line-duotone"
      filterButtonLabel=""
      :search="search"
      @update:search="search = $event"
      @update:limit="
        pagination.limit = $event;
        pagination.page = 1;
      "
      @page-change="pagination.page = $event"
      @update:viewMode="viewMode = $event"
    >
      <!-- Filters Slot to hold Custom Menu List -->
      <template #filters="{ close }">
        <div class="flex flex-col min-w-[200px] py-1">
          <div
            class="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider"
          >
            Kategori Komponen
          </div>
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="
              currentTab = tab.id;
              close();
            "
            class="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-3 hover:bg-slate-50 relative"
            :class="
              currentTab === tab.id
                ? 'text-indigo-600 bg-indigo-50/50'
                : 'text-slate-600'
            "
          >
            <Icon :icon="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
            <Icon
              v-if="currentTab === tab.id"
              icon="lucide:check"
              class="w-4 h-4 ml-auto text-indigo-600"
            />
          </button>
        </div>
      </template>

      <!-- Header Actions -->
      <template #header-actions>
        <button
          @click="openModal(currentModalType)"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Icon icon="lucide:plus" class="w-4 h-4" />
          <span class="hidden sm:inline">Tambah {{ currentTabLabel }}</span>
          <span class="sm:hidden">Baru</span>
        </button>
      </template>

      <!-- SLOTS FOR GRADES -->
      <template #cell-baseSalary="{ item }">
        <span class="font-mono text-indigo-700 font-medium">
          {{ formatCurrency(item.baseSalary) }}
        </span>
      </template>
      <template #cell-dailyAttendanceRate="{ item }">
        <span class="font-mono">
          {{ formatCurrency(item.dailyAttendanceRate) }} /hari
        </span>
      </template>
      <template #cell-healthAllowance="{ item }">
        <span class="font-mono">{{
          formatCurrency(item.healthAllowance)
        }}</span>
      </template>
      <template #cell-others="{ item }">
        <div class="text-xs text-slate-500 space-y-0.5">
          <div class="flex justify-between gap-4">
            <span>Housing:</span>
            <span class="font-mono">{{
              formatCurrency(item.housingAllowance)
            }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span>Transport:</span>
            <span class="font-mono">{{
              formatCurrency(item.transportAllowance)
            }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span>KBM:</span>
            <span class="font-mono"
              >{{ formatCurrency(item.teachingHourRate) }}/jam</span
            >
          </div>
        </div>
      </template>

      <!-- SLOTS FOR POSITIONS / TENURE / CUSTOM -->
      <template #cell-amount="{ item }">
        <span class="font-mono font-medium text-slate-700">
          {{ formatCurrency(item.amount) }}
        </span>
      </template>

      <!-- SLOT FOR TENURE RANGE -->
      <template #cell-range="{ item }">
        <span class="font-medium text-slate-800">
          {{ item.minYears }} - {{ item.maxYears }} Tahun
        </span>
      </template>

      <!-- SLOT FOR CUSTOM STATUS -->
      <template #cell-status="{ item }">
        <span
          v-if="item.isActive"
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
        >
          Aktif
        </span>
        <span
          v-else
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"
        >
          Nonaktif
        </span>
      </template>

      <!-- COMMON ACTIONS SLOT -->
      <template #cell-actions="{ item }">
        <div class="flex justify-end gap-2">
          <button
            @click="openModal(currentModalType, item)"
            class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Icon icon="lucide:pencil" class="w-4 h-4" />
          </button>
          <button
            @click="deleteItem(currentModalType, item.id)"
            class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus"
          >
            <Icon icon="lucide:trash-2" class="w-4 h-4" />
          </button>
        </div>
      </template>

      <!-- CARD VIEW IMPLEMENTATION -->
      <template #card-item="{ item }">
        <div
          class="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow"
        >
          <!-- Header: Name/Title -->
          <div class="mb-3">
            <h3 class="font-semibold text-slate-800 text-lg">
              <span v-if="currentTab === 'grades'">{{ item.name }}</span>
              <span v-else-if="currentTab === 'positions'">{{
                item.position
              }}</span>
              <span v-else-if="currentTab === 'tenure'"
                >{{ item.minYears }} - {{ item.maxYears }} Tahun</span
              >
              <span v-else-if="currentTab === 'custom'">{{ item.name }}</span>
            </h3>
            <div v-if="currentTab === 'custom'" class="mt-1">
              <span
                v-if="item.isActive"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                >Aktif</span
              >
              <span
                v-else
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800"
                >Nonaktif</span
              >
            </div>
          </div>

          <!-- Body: Details based on Tab -->
          <div class="flex-1 space-y-2 text-sm text-slate-600 mb-4">
            <!-- Grade Details -->
            <template v-if="currentTab === 'grades'">
              <div
                class="flex justify-between items-center py-1 border-b border-slate-50"
              >
                <span>Gaji Pokok</span>
                <span class="font-mono font-medium text-indigo-600">{{
                  formatCurrency(item.baseSalary)
                }}</span>
              </div>
              <div
                class="flex justify-between items-center py-1 border-b border-slate-50"
              >
                <span>Tun. Kehadiran</span>
                <span class="font-mono"
                  >{{ formatCurrency(item.dailyAttendanceRate)
                  }}<span class="text-xs text-slate-400">/hari</span></span
                >
              </div>
              <div
                class="flex justify-between items-center py-1 border-b border-slate-50"
              >
                <span>Tun. Kesehatan</span>
                <span class="font-mono">{{
                  formatCurrency(item.healthAllowance)
                }}</span>
              </div>
              <div class="mt-2 p-2 bg-slate-50 rounded-lg space-y-1 text-xs">
                <div class="grid grid-cols-2 gap-2">
                  <span>Housing:</span>
                  <span class="font-mono text-right">{{
                    formatCurrency(item.housingAllowance)
                  }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <span>Transport:</span>
                  <span class="font-mono text-right">{{
                    formatCurrency(item.transportAllowance)
                  }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <span>KBM:</span>
                  <span class="font-mono text-right"
                    >{{ formatCurrency(item.teachingHourRate) }}/jam</span
                  >
                </div>
              </div>
            </template>

            <!-- Other Types (Simple Amount) -->
            <template v-else>
              <div
                class="flex justify-between items-center bg-slate-50 p-3 rounded-lg"
              >
                <span class="font-medium">Nominal</span>
                <span class="font-mono font-bold text-slate-700">{{
                  formatCurrency(item.amount)
                }}</span>
              </div>
            </template>
          </div>

          <!-- Footer: Actions -->
          <div
            class="flex items-center gap-2 mt-auto pt-3 border-t border-slate-100"
          >
            <button
              @click="openModal(currentModalType, item)"
              class="flex-1 py-2 px-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
            >
              <Icon icon="lucide:pencil" class="w-4 h-4" />
              Edit
            </button>
            <button
              @click="deleteItem(currentModalType, item.id)"
              class="flex-1 py-2 px-3 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <Icon icon="lucide:trash-2" class="w-4 h-4" />
              Hapus
            </button>
          </div>
        </div>
      </template>
    </DataTable>

    <!-- MODALS (Preserved) -->

    <!-- GRADE MODAL -->
    <Teleport to="body">
      <div
        v-if="modal.type === 'grade'"
        class="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
      >
        <div
          class="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto"
        >
          <h3 class="text-lg font-bold mb-4">
            {{ modal.isEdit ? "Edit" : "Tambah" }} Golongan Gaji
          </h3>
          <form @submit.prevent="submitModal">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1"
                  >Nama Golongan</label
                >
                <input
                  v-model="form.name"
                  type="text"
                  required
                  placeholder="Contoh: Golongan IA"
                  class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1"
                    >Gaji Pokok</label
                  >
                  <div class="relative">
                    <span class="absolute left-3 top-2 text-slate-400">Rp</span>
                    <input
                      v-model.number="form.baseSalary"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1"
                    >Tunjangan Kehadiran (Harian)</label
                  >
                  <div class="relative">
                    <span class="absolute left-3 top-2 text-slate-400">Rp</span>
                    <input
                      v-model.number="form.dailyAttendanceRate"
                      type="number"
                      min="0"
                      class="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1"
                    >Tunjangan Kesehatan</label
                  >
                  <div class="relative">
                    <span class="absolute left-3 top-2 text-slate-400">Rp</span>
                    <input
                      v-model.number="form.healthAllowance"
                      type="number"
                      min="0"
                      class="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1"
                    >Tunjangan Tempat Tinggal</label
                  >
                  <div class="relative">
                    <span class="absolute left-3 top-2 text-slate-400">Rp</span>
                    <input
                      v-model.number="form.housingAllowance"
                      type="number"
                      min="0"
                      class="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1"
                    >Tunjangan Transportasi</label
                  >
                  <div class="relative">
                    <span class="absolute left-3 top-2 text-slate-400">Rp</span>
                    <input
                      v-model.number="form.transportAllowance"
                      type="number"
                      min="0"
                      class="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1"
                    >Tunjangan Jam KBM (per jam)</label
                  >
                  <div class="relative">
                    <span class="absolute left-3 top-2 text-slate-400">Rp</span>
                    <input
                      v-model.number="form.teachingHourRate"
                      type="number"
                      min="0"
                      class="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-2 mt-6">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 border rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Position Modal -->
    <Teleport to="body">
      <div
        v-if="modal.type === 'position'"
        class="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50"
      >
        <div
          class="bg-white rounded-xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        >
          <h3 class="text-lg font-bold mb-4">
            {{ modal.isEdit ? "Edit" : "Tambah" }} Jabatan
          </h3>
          <form @submit.prevent="submitModal">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1"
                  >Nama Jabatan</label
                >
                <input
                  v-model="form.position"
                  type="text"
                  required
                  class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1"
                  >Nominal Tunjangan</label
                >
                <input
                  v-model.number="form.amount"
                  type="number"
                  min="0"
                  required
                  class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
            <div class="flex justify-end gap-2 mt-6">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 border rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Tenure Modal -->
    <Teleport to="body">
      <div
        v-if="modal.type === 'tenure'"
        class="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50"
      >
        <div
          class="bg-white rounded-xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        >
          <h3 class="text-lg font-bold mb-4">
            {{ modal.isEdit ? "Edit" : "Tambah" }} Masa Kerja
          </h3>
          <form @submit.prevent="submitModal">
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1"
                    >Min Tahun</label
                  >
                  <input
                    v-model.number="form.minYears"
                    type="number"
                    min="0"
                    required
                    class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1"
                    >Max Tahun</label
                  >
                  <input
                    v-model.number="form.maxYears"
                    type="number"
                    min="0"
                    required
                    class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1"
                  >Nominal Tunjangan</label
                >
                <input
                  v-model.number="form.amount"
                  type="number"
                  min="0"
                  required
                  class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
            <div class="flex justify-end gap-2 mt-6">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 border rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Custom Modal -->
    <Teleport to="body">
      <div
        v-if="modal.type === 'custom'"
        class="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50"
      >
        <div
          class="bg-white rounded-xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        >
          <h3 class="text-lg font-bold mb-4">
            {{ modal.isEdit ? "Edit" : "Tambah" }} Custom Allowance
          </h3>
          <form @submit.prevent="submitModal">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1"
                  >Nama Tunjangan</label
                >
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1"
                  >Nominal Default</label
                >
                <input
                  v-model.number="form.amount"
                  type="number"
                  min="0"
                  required
                  class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div v-if="modal.isEdit" class="flex items-center gap-2">
                <input
                  type="checkbox"
                  v-model="form.isActive"
                  id="isActive"
                  class="rounded text-indigo-600"
                />
                <label for="isActive" class="text-sm">Aktif</label>
              </div>
            </div>
            <div class="flex justify-end gap-2 mt-6">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 border rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <StatusModal
      :is-open="statusModal.open"
      :type="statusModal.type"
      :title="statusModal.title"
      :message="statusModal.message"
      @close="statusModal.open = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import { salaryApi, salaryGradesApi } from "@/services/api";
import StatusModal from "@/components/ui/StatusModal.vue";
import DataTable from "@/components/ui/DataTable.vue";

const tabs = [
  {
    id: "grades",
    label: "Golongan Gaji",
    icon: "solar:banknote-2-line-duotone",
  },
  { id: "positions", label: "Jabatan", icon: "lucide:briefcase" },
  { id: "tenure", label: "Masa Kerja", icon: "lucide:clock" },
  { id: "custom", label: "Tunjangan Lain", icon: "lucide:star" },
];
const currentTab = ref("grades");
const loading = ref(true);

const grades = ref([]);
const positions = ref([]);
const tenures = ref([]);
const customs = ref([]);

// DataTable State
const viewMode = ref(window.innerWidth < 768 ? "card" : "table");
const search = ref("");
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

const statusModal = reactive({
  open: false,
  type: "success",
  title: "",
  message: "",
});

const modal = reactive({
  type: null,
  isEdit: false,
  id: null,
});

const form = reactive({});

// Watch tab change to reset search/pagination
watch(currentTab, () => {
  search.value = "";
  pagination.page = 1;
});

const currentModalType = computed(() => {
  // Map tab ID to modal type name (grade, position, tenure, custom)
  // They happen to be the same in my code except potentially pluralization
  if (currentTab.value === "grades") return "grade";
  if (currentTab.value === "positions") return "position";
  return currentTab.value;
});

const currentTabLabel = computed(() => {
  const t = tabs.find((x) => x.id === currentTab.value);
  return t ? t.label : "Data";
});

const currentColumns = computed(() => {
  if (currentTab.value === "grades") {
    return [
      { field: "name", label: "Nama Golongan", sortable: true },
      {
        field: "baseSalary",
        label: "Gaji Pokok",
        sortable: true,
        align: "right",
      },
      { field: "dailyAttendanceRate", label: "Tun. Kehadiran", align: "right" },
      { field: "healthAllowance", label: "Tun. Kesehatan", align: "right" },
      { field: "others", label: "Tun. Lainnya", align: "right" },
      { field: "actions", label: "Aksi", align: "right" },
    ];
  } else if (currentTab.value === "positions") {
    return [
      { field: "position", label: "Nama Jabatan", sortable: true },
      {
        field: "amount",
        label: "Nominal Tunjangan",
        sortable: true,
        align: "right",
      },
      { field: "actions", label: "Aksi", align: "right" },
    ];
  } else if (currentTab.value === "tenure") {
    return [
      { field: "range", label: "Rentang Tahun", sortable: true },
      {
        field: "amount",
        label: "Nominal Tunjangan",
        sortable: true,
        align: "right",
      },
      { field: "actions", label: "Aksi", align: "right" },
    ];
  } else if (currentTab.value === "custom") {
    return [
      { field: "name", label: "Nama Tunjangan", sortable: true },
      {
        field: "amount",
        label: "Nominal Default",
        sortable: true,
        align: "right",
      },
      { field: "status", label: "Status", align: "center" },
      { field: "actions", label: "Aksi", align: "right" },
    ];
  }
  return [];
});

const filteredData = computed(() => {
  let data = [];
  if (currentTab.value === "grades") data = grades.value;
  else if (currentTab.value === "positions") data = positions.value;
  else if (currentTab.value === "tenure") data = tenures.value;
  else if (currentTab.value === "custom") data = customs.value;

  if (search.value) {
    const q = search.value.toLowerCase();
    data = data.filter((item) => {
      // Check common fields
      if (item.name && item.name.toLowerCase().includes(q)) return true;
      if (item.position && item.position.toLowerCase().includes(q)) return true;
      return false;
    });
  }
  return data;
});

const paginatedData = computed(() => {
  const start = (pagination.page - 1) * pagination.limit;
  const end = start + pagination.limit;

  pagination.total = filteredData.value.length;
  pagination.totalPages = Math.ceil(pagination.total / pagination.limit);

  return filteredData.value.slice(start, end);
});

// Actions
function openModal(type, item = null) {
  modal.type = type;
  modal.isEdit = !!item;
  modal.id = item ? item.id : null;

  // Reset form
  Object.keys(form).forEach((k) => delete form[k]);

  if (type === "grade") {
    form.name = item ? item.name : "";
    form.baseSalary = item ? parseFloat(item.baseSalary) : 0;
    form.dailyAttendanceRate = item ? parseFloat(item.dailyAttendanceRate) : 0;
    form.healthAllowance = item ? parseFloat(item.healthAllowance) : 0;
    form.housingAllowance = item ? parseFloat(item.housingAllowance) : 0;
    form.transportAllowance = item ? parseFloat(item.transportAllowance) : 0;
    form.teachingHourRate = item ? parseFloat(item.teachingHourRate) : 0;
  } else if (type === "position") {
    form.position = item ? item.position : "";
    form.amount = item ? parseFloat(item.amount) : 0;
  } else if (type === "tenure") {
    form.minYears = item ? item.minYears : 0;
    form.maxYears = item ? item.maxYears : 0;
    form.amount = item ? parseFloat(item.amount) : 0;
  } else if (type === "custom") {
    form.name = item ? item.name : "";
    form.amount = item ? parseFloat(item.amount) : 0;
    form.isActive = item ? item.isActive : true;
  }
}

function closeModal() {
  modal.type = null;
}

// Helpers
const formatCurrency = (val) => {
  if (!val) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
};

function showStatus(type, title, message) {
  statusModal.type = type;
  statusModal.title = title;
  statusModal.message = message;
  statusModal.open = true;
}

// API Calls (Preserving Original Logic)
async function loadData() {
  loading.value = true;
  try {
    const [resSettings, resGrades] = await Promise.all([
      salaryApi.getSettings(),
      salaryGradesApi.getAll(),
    ]);

    if (resSettings.success) {
      positions.value = resSettings.data.positionAllowances || [];
      tenures.value = resSettings.data.tenureAllowances || [];
      customs.value = resSettings.data.customAllowances || [];
    }

    if (resGrades.success) {
      grades.value = resGrades.data;
    }
  } catch (err) {
    console.error(err);
    showStatus("error", "Error", "Gagal memuat data");
  } finally {
    loading.value = false;
  }
}

async function submitModal() {
  try {
    if (modal.type === "grade") {
      if (modal.isEdit) {
        await salaryGradesApi.update(modal.id, form);
        showStatus("success", "Berhasil", "Golongan berhasil diperbarui");
      } else {
        await salaryGradesApi.create(form);
        showStatus("success", "Berhasil", "Golongan berhasil ditambahkan");
      }
    } else {
      const settingsPayload = {};
      if (modal.type === "position") {
        const newPositions = [...positions.value];
        if (modal.isEdit) {
          const idx = newPositions.findIndex((p) => p.id === modal.id);
          newPositions[idx] = { ...newPositions[idx], ...form };
        } else {
          newPositions.push({ ...form, id: Date.now() }); // Mock ID for optimistic, backend will solve
        }
        settingsPayload.positionAllowances = newPositions;
      } else if (modal.type === "tenure") {
        const newTenures = [...tenures.value];
        if (modal.isEdit) {
          const idx = newTenures.findIndex((t) => t.id === modal.id);
          newTenures[idx] = { ...newTenures[idx], ...form };
        } else {
          newTenures.push({ ...form, id: Date.now() });
        }
        settingsPayload.tenureAllowances = newTenures;
      } else if (modal.type === "custom") {
        const newCustoms = [...customs.value];
        if (modal.isEdit) {
          const idx = newCustoms.findIndex((c) => c.id === modal.id);
          newCustoms[idx] = { ...newCustoms[idx], ...form };
        } else {
          newCustoms.push({ ...form, id: Date.now() });
        }
        settingsPayload.customAllowances = newCustoms;
      }

      await salaryApi.updateSettings(settingsPayload);
      showStatus("success", "Berhasil", "Data berhasil disimpan");
    }
    closeModal();
    loadData();
  } catch (err) {
    console.error(err);
    showStatus("error", "Gagal", "Terjadi kesalahan saat menyimpan");
  }
}

async function deleteItem(type, id) {
  if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

  try {
    if (type === "grade") {
      await salaryGradesApi.delete(id);
    } else {
      const settingsPayload = {};
      if (type === "position") {
        settingsPayload.positionAllowances = positions.value.filter(
          (p) => p.id !== id
        );
      } else if (type === "tenure") {
        settingsPayload.tenureAllowances = tenures.value.filter(
          (t) => t.id !== id
        );
      } else if (type === "custom") {
        settingsPayload.customAllowances = customs.value.filter(
          (c) => c.id !== id
        );
      }
      await salaryApi.updateSettings(settingsPayload);
    }
    showStatus("success", "Berhasil", "Data berhasil dihapus");
    loadData();
  } catch (err) {
    console.error(err);
    showStatus("error", "Gagal", "Terjadi kesalahan saat menghapus");
  }
}

onMounted(() => {
  loadData();
});
</script>
