<template>
  <div class="p-6 max-w-6xl mx-auto pb-12">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Aturan Poin</h1>
      <p class="text-slate-500 text-sm mt-1">
        Kelola daftar aturan poin penghargaan dan pelanggaran standar.
      </p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-6 border-b border-slate-200">
      <button
        @click="activeTab = 'reward'"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
        :class="
          activeTab === 'reward'
            ? 'border-green-500 text-green-700'
            : 'border-transparent text-slate-500 hover:text-slate-700'
        "
      >
        Penghargaan (Reward)
      </button>
      <button
        @click="activeTab = 'punishment'"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
        :class="
          activeTab === 'punishment'
            ? 'border-red-500 text-red-700'
            : 'border-transparent text-slate-500 hover:text-slate-700'
        "
      >
        Pelanggaran (Punishment)
      </button>
    </div>

    <!-- Action Bar -->
    <div class="flex justify-end mb-4">
      <button
        @click="openImport()"
        class="px-4 py-2 rounded-lg text-green-700 bg-green-50 border border-green-200 text-sm font-medium flex items-center gap-2 hover:bg-green-100 mr-2"
      >
        <Icon icon="solar:file-send-bold-duotone" />
        Import Excel
      </button>
      <button
        @click="openModal()"
        class="px-4 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-2"
        :class="
          activeTab === 'reward'
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-red-600 hover:bg-red-700'
        "
      >
        <Icon icon="solar:add-circle-bold" />
        Tambah Aturan
        {{ activeTab === "reward" ? "Penghargaan" : "Pelanggaran" }}
      </button>
    </div>

    <!-- Content -->
    <DataTable
      :title="
        activeTab === 'reward' ? 'Daftar Penghargaan' : 'Daftar Pelanggaran'
      "
      :description="`Kelola aturan ${
        activeTab === 'reward' ? 'penghargaan' : 'pelanggaran'
      } santri`"
      :icon="
        activeTab === 'reward'
          ? 'solar:medal-star-bold'
          : 'solar:danger-circle-bold'
      "
      :loading="loading"
      :items="paginatedRules"
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
        <!-- Main Actions kept outside -->
      </template>

      <!-- Filters Slot -->
      <template #filters>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Kategori</label
            >
            <select
              v-model="selectedCategory"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="">Semua Kategori</option>
              <option v-for="cat in existingCategories" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>
        </div>
      </template>

      <!-- Cell: Category -->
      <template #cell-category="{ item }">
        <span
          class="px-2 py-1 rounded text-xs bg-slate-100 text-slate-600 border border-slate-200"
        >
          {{ item.category }}
        </span>
      </template>

      <!-- Cell: Points -->
      <template #cell-defaultPoints="{ item }">
        <span
          class="font-semibold"
          :class="activeTab === 'reward' ? 'text-green-600' : 'text-red-600'"
        >
          {{ item.defaultPoints }}
        </span>
      </template>

      <!-- Cell: Action -->
      <template #cell-action="{ item }">
        <div class="flex justify-end gap-2">
          <button
            @click="openModal(item)"
            class="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <Icon icon="solar:pen-bold" class="text-lg" />
          </button>
          <button
            @click="confirmDelete(item)"
            class="text-red-500 hover:text-red-700"
            title="Hapus"
          >
            <Icon icon="solar:trash-bin-trash-bold" class="text-lg" />
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
            :class="activeTab === 'reward' ? 'bg-green-500' : 'bg-red-500'"
          ></div>
          <div class="pl-2">
            <div class="flex justify-between items-start mb-2">
              <span
                class="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider"
              >
                {{ item.category }}
              </span>
              <span
                class="font-bold text-lg"
                :class="
                  activeTab === 'reward' ? 'text-green-600' : 'text-red-600'
                "
              >
                {{ item.defaultPoints }}
              </span>
            </div>
            <h3 class="font-bold text-slate-800 mb-1">{{ item.name }}</h3>
            <p class="text-sm text-slate-500 line-clamp-2 mb-4">
              {{ item.description || "-" }}
            </p>
            <div class="flex justify-end gap-2 border-t pt-3">
              <button
                @click="openModal(item)"
                class="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
              >
                Edit
              </button>
              <button
                @click="confirmDelete(item)"
                class="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      </template>
    </DataTable>

    <!-- Modal Form -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/40 backdrop-blur-sm"
        @click="closeModal"
      ></div>
      <div
        class="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in-up"
      >
        <h3 class="text-lg font-bold text-slate-800 mb-4">
          {{ isEditing ? "Edit" : "Tambah" }} Aturan
          {{ activeTab === "reward" ? "Penghargaan" : "Pelanggaran" }}
        </h3>

        <form @submit.prevent="saveRule" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Nama Aturan <span class="text-red-500">*</span></label
            >
            <input
              v-model="form.name"
              type="text"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition"
              placeholder="Contoh: Datang Tepat Waktu"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Kategori <span class="text-red-500">*</span></label
            >
            <div class="relative">
              <input
                v-model="form.category"
                type="text"
                list="categorySuggestions"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition"
                placeholder="Contoh: Kedisiplinan"
                required
              />
              <datalist id="categorySuggestions">
                <option
                  v-for="cat in existingCategories"
                  :key="cat"
                  :value="cat"
                ></option>
              </datalist>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Poin Default <span class="text-red-500">*</span></label
            >
            <input
              v-model.number="form.defaultPoints"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Deskripsi</label
            >
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition"
              placeholder="Keterangan tambahan..."
            ></textarea>
          </div>

          <div v-if="error" class="text-sm text-red-600 bg-red-50 p-2 rounded">
            {{ error }}
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="processing"
              class="px-4 py-2 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
              :class="
                activeTab === 'reward'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              "
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
      confirmText="Hapus"
      cancelText="Batal"
      type="danger"
      :loading="processing"
      @confirm="executeDelete"
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

    <!-- Import Modal -->
    <ImportModal
      v-model:isOpen="showImportModal"
      title="Import Aturan Poin"
      :apiPreview="rulesApi.importPreview"
      :apiImport="rulesApi.import"
      :templateHeader="rulesImportTemplate"
      templateName="template_aturan_poin"
      requiredColumns="Tipe, Kategori, Nama Aturan, Poin"
      @success="onImportSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from "vue";
import { Icon } from "@iconify/vue";
import { rulesApi } from "@/services/api";
import ImportModal from "@/components/common/ImportModal.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import StatusModal from "@/components/ui/StatusModal.vue";
import DataTable from "@/components/ui/DataTable.vue";

const activeTab = ref("reward"); // 'reward' | 'punishment'
const rules = ref([]);
const loading = ref(false);
const processing = ref(false);
const error = ref("");

// DataTable State
const search = ref("");
const selectedCategory = ref("");
const viewMode = ref("table");
const currentPage = ref(1);
const itemsPerPage = ref(10);

const showModal = ref(false);
const showImportModal = ref(false);
const ruleToDelete = ref(null);
const isEditing = ref(false);

const confirmModal = reactive({
  isOpen: false,
  title: "",
  message: "",
});

const statusModal = reactive({
  isOpen: false,
  type: "success",
  title: "",
  message: "",
});

const form = reactive({
  id: null,
  name: "",
  category: "",
  defaultPoints: 0,
  description: "",
});

const rulesImportTemplate = [
  {
    Tipe: "Penghargaan",
    Kategori: "Akhlak",
    "Nama Aturan": "Contoh Aturan",
    Poin: 10,
    Deskripsi: "Keterangan",
  },
  {
    Tipe: "Pelanggaran",
    Kategori: "Kedisiplinan",
    "Nama Aturan": "Terlambat",
    Poin: 5,
    Deskripsi: "Datang terlambat",
  },
  {
    Tipe: "Penghargaan",
    Kategori: "Ibadah",
    "Nama Aturan": "Sholat Dhuha",
    Poin: 5,
    Deskripsi: "Rutinitas harian",
  },
];

const columns = [
  { field: "name", label: "Nama Aturan", sortable: true },
  { field: "category", label: "Kategori", sortable: true },
  { field: "defaultPoints", label: "Poin", sortable: true },
  { field: "description", label: "Deskripsi", sortable: true },
  { field: "action", label: "Aksi", align: "right" },
];

// Computed
const filteredInfo = computed(() => {
  let res = rules.value.filter((r) => r.type === activeTab.value);

  if (selectedCategory.value) {
    res = res.filter((r) => r.category === selectedCategory.value);
  }

  if (search.value) {
    const q = search.value.toLowerCase();
    res = res.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }
  return res;
});

const paginatedRules = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredInfo.value.slice(start, end);
});

const existingCategories = computed(() => {
  const cats = new Set(
    rules.value.filter((r) => r.type === activeTab.value).map((r) => r.category)
  );
  return Array.from(cats);
});

// Watch activeTab to reset search & page
watch(activeTab, () => {
  search.value = "";
  selectedCategory.value = "";
  currentPage.value = 1;
});

// Implementation
function openImport() {
  showImportModal.value = true;
}

function onImportSuccess() {
  fetchRules();
  showImportModal.value = false;
  showStatus("success", "Import Berhasil", "Data aturan berhasil diimport.");
}

function showStatus(type, title, message) {
  statusModal.type = type;
  statusModal.title = title;
  statusModal.message = message;
  statusModal.isOpen = true;
}

async function fetchRules() {
  loading.value = true;
  try {
    const res = await rulesApi.getAll();
    if (res.success) {
      rules.value = res.data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

function openModal(rule = null) {
  error.value = "";
  if (rule) {
    isEditing.value = true;
    form.id = rule.id;
    form.name = rule.name;
    form.category = rule.category;
    form.defaultPoints = rule.defaultPoints;
    form.description = rule.description;
  } else {
    isEditing.value = false;
    form.id = null;
    form.name = "";
    form.category = "";
    form.defaultPoints = 0;
    form.description = "";
  }
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  ruleToDelete.value = null;
  processing.value = false;
}

async function saveRule() {
  processing.value = true;
  error.value = "";

  try {
    const payload = {
      type: activeTab.value,
      name: form.name,
      category: form.category,
      defaultPoints: form.defaultPoints,
      description: form.description,
    };

    if (isEditing.value) {
      await rulesApi.update(form.id, payload);
    } else {
      await rulesApi.create(payload);
    }

    await fetchRules();
    closeModal();
    showStatus("success", "Berhasil", "Data aturan berhasil disimpan.");
  } catch (err) {
    error.value = err.message || "Gagal menyimpan aturan";
  } finally {
    processing.value = false;
  }
}

function confirmDelete(rule) {
  ruleToDelete.value = rule;
  confirmModal.title = "Hapus Aturan?";
  confirmModal.message = `Apakah Anda yakin ingin menghapus aturan "${rule.name}"? Tindakan ini tidak dapat dibatalkan.`;
  confirmModal.isOpen = true;
}

function closeConfirmModal() {
  confirmModal.isOpen = false;
  ruleToDelete.value = null;
}

async function executeDelete() {
  if (!ruleToDelete.value) return;

  processing.value = true;
  try {
    await rulesApi.delete(ruleToDelete.value.id);
    await fetchRules();
    closeConfirmModal();
    showStatus("success", "Berhasil", "Aturan berhasil dihapus.");
  } catch (err) {
    closeConfirmModal(); // Close confirm modal to show error
    showStatus("error", "Gagal", err.message || "Gagal menghapus aturan");
  } finally {
    processing.value = false;
  }
}

onMounted(() => {
  fetchRules();
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
