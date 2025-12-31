<template>
  <div class="max-w-7xl mx-auto pb-12">
    <DataTable
      title="Mata Pelajaran"
      description="Kelola data mata pelajaran untuk rapor pesantren"
      icon="solar:book-bookmark-bold-duotone"
      :columns="columns"
      :items="paginatedItems"
      :loading="loading"
      :search="search"
      :pagination="paginationInfo"
      v-model:viewMode="viewMode"
      @update:search="search = $event"
      @page-change="currentPage = $event"
      @update:limit="itemsPerPage = $event"
    >
      <template #header-actions>
        <div class="flex gap-2">
          <button
            @click="openImport"
            class="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <Icon icon="solar:import-bold-duotone" />
            Import Excel
          </button>
          <button
            @click="openCreate"
            class="bg-[#602515] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-[#4a1c10] transition-colors"
          >
            <Icon icon="solar:add-circle-bold" />
            Tambah Mapel
          </button>
        </div>
      </template>

      <!-- Filters Slot -->
      <template #filters>
        <div class="space-y-4">
          <h3 class="font-medium text-slate-800 border-b pb-2">Filter Data</h3>

          <!-- Category Filter -->
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1"
              >Kategori</label
            >
            <select
              v-model="filters.category"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#602515]"
            >
              <option value="">Semua Kategori</option>
              <option value="Diniyah">Diniyah</option>
              <option value="Umum">Umum</option>
              <option value="Tahfidz">Tahfidz</option>
              <option value="Bahasa">Bahasa</option>
              <option value="Mulok">Muatan Lokal</option>
            </select>
          </div>

          <!-- Grade Filter -->
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1"
              >Tingkat Kelas</label
            >
            <select
              v-model="filters.grade"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#602515]"
            >
              <option value="">Semua Kelas</option>
              <option v-for="g in availableGrades" :key="g" :value="g">
                Kelas {{ g }}
              </option>
            </select>
          </div>

          <button
            @click="resetFilters"
            class="w-full py-2 text-sm text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Reset Filter
          </button>
        </div>
      </template>

      <!-- Custom Cells -->
      <template #cell-name="{ item }">
        <div>
          <div class="font-medium text-slate-800">{{ item.name }}</div>
          <div v-if="item.nameAr" class="text-sm text-slate-500 font-arabic">
            {{ item.nameAr }}
          </div>
        </div>
      </template>

      <template #cell-grades="{ item }">
        <div class="flex flex-wrap gap-1">
          <span
            v-for="g in parseGrades(item.grades)"
            :key="g"
            class="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
          >
            Kelas {{ g }}
          </span>
          <span
            v-if="!item.grades || parseGrades(item.grades).length === 0"
            class="text-slate-400 italic text-xs"
          >
            Semua
          </span>
        </div>
      </template>

      <template #cell-kkm="{ item }">
        <div
          class="font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded inline-block"
        >
          {{ item.kkm || "-" }}
        </div>
      </template>

      <template #cell-actions="{ item }">
        <div class="flex gap-2">
          <button
            @click="openEdit(item)"
            class="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
            title="Edit"
          >
            <Icon icon="solar:pen-bold-duotone" />
          </button>
          <button
            @click="confirmDelete(item)"
            class="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            title="Hapus"
          >
            <Icon icon="solar:trash-bin-trash-bold-duotone" />
          </button>
        </div>
      </template>

      <template #card-item="{ item }">
        <div
          class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-shadow"
        >
          <div class="space-y-3">
            <div class="flex items-start justify-between">
              <div>
                <div class="font-bold text-slate-800 text-lg">
                  {{ item.name }}
                </div>
                <div
                  v-if="item.nameAr"
                  class="text-slate-500 font-arabic text-right mb-1"
                >
                  {{ item.nameAr }}
                </div>
                <div
                  class="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded inline-block"
                >
                  {{ item.code }}
                </div>
              </div>
              <div class="flex gap-1">
                <button
                  @click="openEdit(item)"
                  class="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100"
                >
                  <Icon icon="solar:pen-bold-duotone" />
                </button>
                <button
                  @click="confirmDelete(item)"
                  class="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                >
                  <Icon icon="solar:trash-bin-trash-bold-duotone" />
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="flex flex-col">
                <span class="text-xs text-slate-400">Kategori</span>
                <span class="font-medium text-slate-700">{{
                  item.category || "-"
                }}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-xs text-slate-400">KKM</span>
                <span class="font-medium text-slate-700">{{ item.kkm }}</span>
              </div>
            </div>

            <div v-if="item.grades" class="pt-2 border-t border-slate-50">
              <span class="text-xs text-slate-400 block mb-1">Kelas:</span>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="g in parseGrades(item.grades)"
                  :key="g"
                  class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100"
                >
                  {{ g }}
                </span>
                <span
                  v-if="!item.grades || parseGrades(item.grades).length === 0"
                  class="text-slate-400 italic text-xs"
                >
                  Semua
                </span>
              </div>
            </div>

            <div
              class="flex items-center justify-between text-xs text-slate-400 mt-2"
            >
              <span>SKS: {{ item.creditHours || 0 }}</span>
              <span>Urut: {{ item.sortOrder || 0 }}</span>
            </div>
          </div>
        </div>
      </template>
    </DataTable>

    <!-- Modal Form -->
    <div
      v-if="modal.show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
    >
      <div
        class="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div
          class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"
        >
          <h3 class="font-bold text-lg text-slate-800">
            {{ modal.mode === "create" ? "Tambah" : "Edit" }} Mata Pelajaran
          </h3>
          <button
            @click="closeModal"
            class="text-slate-400 hover:text-slate-600"
          >
            <Icon icon="solar:close-circle-bold" class="w-6 h-6" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-4">
          <!-- Kode (Auto) -->
          <div
            v-if="form.code"
            class="bg-slate-50 p-3 rounded-lg border border-slate-200"
          >
            <label class="text-xs font-bold text-slate-500 uppercase"
              >Kode Mapel</label
            >
            <div class="font-mono text-slate-700 font-bold">
              {{ form.code }}
            </div>
            <div class="text-[10px] text-slate-400 mt-1">
              Kode digenerate otomatis
            </div>
          </div>

          <!-- Names -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Nama (Indonesia) <span class="text-red-500">*</span></label
              >
              <input
                v-model="form.name"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-[#602515] focus:ring-1 focus:ring-[#602515]"
                placeholder="Contoh: Matematika"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Nama (Arab)</label
              >
              <input
                v-model="form.nameAr"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-[#602515] focus:ring-1 focus:ring-[#602515] text-right font-arabic"
                placeholder="الرياضيات"
                dir="rtl"
              />
            </div>
          </div>

          <!-- KKM & Category -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >KKM</label
              >
              <input
                v-model="form.kkm"
                type="number"
                min="0"
                max="100"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-[#602515]"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Kategori</label
              >
              <select
                v-model="form.category"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-[#602515]"
              >
                <option value="">-- Pilih --</option>
                <option value="Diniyah">Diniyah (Agama)</option>
                <option value="Umum">Umum</option>
                <option value="Tahfidz">Tahfidz</option>
                <option value="Bahasa">Bahasa</option>
                <option value="Mulok">Muatan Lokal</option>
              </select>
            </div>
          </div>

          <!-- Grades Checklist -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2"
              >Tingkat Kelas</label
            >
            <div
              v-if="availableGrades.length === 0"
              class="text-sm text-slate-500 italic"
            >
              Tidak ada data kelas ditemukan.
            </div>
            <div class="grid grid-cols-3 gap-2">
              <label
                v-for="grade in availableGrades"
                :key="grade"
                class="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                :class="
                  form.grades.includes(grade)
                    ? 'border-[#602515] bg-[#602515]/5'
                    : 'border-slate-200'
                "
              >
                <input
                  type="checkbox"
                  :value="grade"
                  v-model="form.grades"
                  class="rounded text-[#602515] focus:ring-[#602515]"
                />
                <span class="text-sm font-medium">Kelas {{ grade }}</span>
              </label>
            </div>
            <p class="text-xs text-slate-400 mt-2">
              Pilih kelas yang mempelajari mapel ini.
            </p>
          </div>

          <!-- Urutan & Deskripsi -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Urutan Rapor</label
              >
              <input
                v-model="form.sortOrder"
                type="number"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-[#602515]"
                placeholder="1"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Jml Jam (SKS)</label
              >
              <input
                v-model="form.creditHours"
                type="number"
                min="0"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-[#602515]"
                placeholder="2"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Deskripsi</label
            >
            <textarea
              v-model="form.description"
              rows="2"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-[#602515]"
            ></textarea>
          </div>

          <!-- Errors -->
          <div
            v-if="modal.error"
            class="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2"
          >
            <Icon icon="solar:danger-triangle-bold" />
            {{ modal.error }}
          </div>
        </div>

        <div
          class="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3"
        >
          <button
            @click="closeModal"
            class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 bg-white"
          >
            Batal
          </button>
          <button
            @click="submitForm"
            :disabled="saving"
            class="px-4 py-2 bg-[#602515] text-white font-medium rounded-lg hover:bg-[#4a1c10] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Icon v-if="saving" icon="svg-spinners:ring-resize" />
            {{ saving ? "Menyimpan..." : "Simpan Mapel" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <ConfirmModal
      :isOpen="confirm.show"
      title="Hapus Mata Pelajaran"
      :message="`Apakah Anda yakin ingin menghapus mata pelajaran '${confirm.item?.name}'? Data nilai yang terkait mungkin akan hilang.`"
      confirmText="Hapus"
      type="danger"
      @confirm="deleteItem"
      @close="confirmCancel"
    />

    <!-- Import Modal -->
    <ImportModal
      v-model:isOpen="importModal.show"
      title="Import Mata Pelajaran"
      :api-preview="academicApi.importSubjectPreview"
      :api-import="academicApi.importSubject"
      :template-header="templateHeader"
      template-name="template_mapel"
      required-columns="Nama (Wajib), Kode (Opsional), Kelas (Contoh: 7,8,9)"
      @success="handleImportSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import { academicApi } from "@/services/api";
import { Icon } from "@iconify/vue";
import DataTable from "@/components/ui/DataTable.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import ImportModal from "@/components/common/ImportModal.vue";

const allSubjects = ref([]);
const availableGrades = ref([]); // List of distinct grades
const loading = ref(true);
const saving = ref(false);

const search = ref("");
const viewMode = ref("table");
const currentPage = ref(1);
const itemsPerPage = ref(10);

const filters = reactive({
  category: "",
  grade: "",
});

const modal = reactive({ show: false, mode: "create", error: "" });
const confirm = reactive({ show: false, item: null });
const importModal = reactive({ show: false });

const form = reactive({
  id: null,
  code: "",
  name: "",
  nameAr: "",
  category: "",
  grades: [], // Array of numbers
  kkm: 70,
  sortOrder: 0,
  creditHours: 2,
  description: "",
});

const columns = [
  { field: "code", label: "Kode", sortable: true, width: "100px" },
  { field: "name", label: "Mata Pelajaran", sortable: true },
  { field: "category", label: "Kategori", sortable: true },
  { field: "grades", label: "Tingkat Kelas" },
  { field: "creditHours", label: "SKS", width: "60px" },
  { field: "kkm", label: "KKM", sortable: true, width: "80px" },
  { field: "actions", label: "", width: "100px" },
];

const templateHeader = [
  {
    Kode: "", // Kosongkan untuk auto-generate
    Nama: "Matematika",
    "Nama Arab": "الرياضيات",
    Kategori: "Umum",
    Kelas: "7,8,9",
    KKM: 70,
    SKS: 2,
    Urutan: 1,
  },
];

/* Data Handling with Search & Filter & Pagination */
const filteredItems = computed(() => {
  let items = [...allSubjects.value];

  // 1. Search
  if (search.value) {
    const q = search.value.toLowerCase();
    items = items.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q))
    );
  }

  // 2. Filter Category
  if (filters.category) {
    items = items.filter((s) => s.category === filters.category);
  }

  // 3. Filter Grade
  if (filters.grade) {
    items = items.filter((s) => {
      // s.grades is JSON string "[1,2,3]" or null
      if (!s.grades) return true; // Show for all if no specific grades logic? Or false? Assuming 'Semua' if empty
      const gList = parseGrades(s.grades);
      // If empty/null => 'Semua' => matches any grade? Or strict?
      // Let's assume empty list = "All Grades"
      if (gList.length === 0) return true;
      return gList.includes(Number(filters.grade));
    });
  }

  // Sort by sortOrder asc, then name asc
  items.sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
  );

  return items;
});

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredItems.value.slice(start, end);
});

const paginationInfo = computed(() => ({
  page: currentPage.value,
  limit: itemsPerPage.value,
  total: filteredItems.value.length,
  totalPages: Math.ceil(filteredItems.value.length / itemsPerPage.value),
}));

// Reset pagination when search/filter changes
watch(
  [search, filters],
  () => {
    currentPage.value = 1;
  },
  { deep: true }
);

function resetFilters() {
  filters.category = "";
  filters.grade = "";
  search.value = "";
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await academicApi.getSubjects();
    allSubjects.value = Array.isArray(res?.data) ? res.data : [];

    // Fetch classes to get available grades
    const classesRes = await academicApi.getClasses();
    if (classesRes?.data) {
      // Extract unique grades
      const grades = classesRes.data.map((c) => c.grade);
      availableGrades.value = [...new Set(grades)].sort((a, b) => a - b);
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function generateCode(name) {
  if (!name) return "";
  const prefix = name
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, "X");
  const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
  return `${prefix}-${random}`;
}

// Helper to parse grades JSON
function parseGrades(gradesJson) {
  if (!gradesJson) return [];
  if (Array.isArray(gradesJson)) return gradesJson; // Already array
  try {
    const parsed = JSON.parse(gradesJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function submitForm() {
  saving.value = true;
  modal.error = "";
  try {
    if (!form.name) {
      modal.error = "Nama mapel wajib diisi";
      return;
    }

    // Auto generate code if empty and create mode
    if (modal.mode === "create" && !form.code) {
      form.code = generateCode(form.name);
    }

    const payload = {
      code: form.code,
      name: form.name,
      nameAr: form.nameAr,
      category: form.category || undefined,
      grades: JSON.stringify(form.grades), // Serialize array to JSON
      kkm: Number(form.kkm),
      sortOrder: Number(form.sortOrder),
      creditHours: Number(form.creditHours),
      description: form.description || undefined,
    };

    if (modal.mode === "edit" && form.id) {
      await academicApi.updateSubject(form.id, payload);
    } else {
      await academicApi.createSubject(payload);
    }
    await fetchData();
    closeModal();
  } catch (e) {
    modal.error = e.message || "Gagal menyimpan";
  } finally {
    saving.value = false;
  }
}

async function deleteItem() {
  saving.value = true;
  try {
    await academicApi.deleteSubject(confirm.item.id);
    await fetchData();
    confirmCancel();
  } catch (e) {
    alert(e.message || "Gagal menghapus");
  } finally {
    saving.value = false;
  }
}

function openCreate() {
  modal.show = true;
  modal.mode = "create";
  modal.error = "";
  Object.assign(form, {
    id: null,
    code: "",
    name: "",
    nameAr: "",
    category: "",
    grades: [],
    kkm: 70,
    sortOrder: (allSubjects.value.length || 0) + 1,
    creditHours: 2,
    description: "",
  });
}

function openEdit(item) {
  modal.show = true;
  modal.mode = "edit";
  modal.error = "";

  // Parse grades
  let itemGrades = [];
  try {
    itemGrades = JSON.parse(item.grades || "[]");
  } catch {
    itemGrades = [];
  }

  Object.assign(form, {
    ...item,
    grades: itemGrades,
    kkm: item.kkm || 70,
    sortOrder: item.sortOrder || 0,
    creditHours: item.creditHours || 2,
  });
}

function closeModal() {
  modal.show = false;
}

function confirmDelete(item) {
  confirm.show = true;
  confirm.item = item;
}

function confirmCancel() {
  confirm.show = false;
  confirm.item = null;
}

function openImport() {
  importModal.show = true;
}

function handleImportSuccess() {
  importModal.show = false;
  fetchData();
}

onMounted(fetchData);
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap");

.font-arabic {
  font-family: "Amiri", serif;
}
</style>
