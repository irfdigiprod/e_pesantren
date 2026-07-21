<template>
  <div>
    <DataTable
      title="Obat-obatan"
      description="Kelola inventaris dan stok obat klinik."
      icon="solar:medical-kit-bold-duotone"
      :items="filteredMedicines"
      :columns="columns"
      :loading="loading"
      :viewMode="viewMode"
      v-model:viewMode="viewMode"
      v-model:search="search"
      :hideFilter="false"
      filterButtonLabel="Filter Stok"
    >
      <template #header-actions>
        <div class="flex gap-2">
          <button
            @click="importModal.show = true"
            class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 text-sm font-medium"
          >
            <Icon icon="solar:file-send-bold-duotone" />
            Import Excel
          </button>
          <button
            @click="openCreate"
            :disabled="saving"
            class="px-4 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1d10] transition flex items-center gap-2 text-sm font-medium"
          >
            <Icon icon="solar:add-circle-bold" />
            Tambah Obat
          </button>
        </div>
      </template>

      <!-- Custom Filter Content -->
      <template #filters="{ close }">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2"
              >Status Stok</label
            >
            <div class="space-y-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  v-model="filterStatus"
                  value="all"
                  class="text-primary focus:ring-primary"
                  @change="close"
                />
                <span class="text-sm text-slate-600">Semua</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  v-model="filterStatus"
                  value="low"
                  class="text-amber-500 focus:ring-amber-500"
                  @change="close"
                />
                <span class="text-sm text-slate-600">Stok Menipis</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  v-model="filterStatus"
                  value="out"
                  class="text-red-500 focus:ring-red-500"
                  @change="close"
                />
                <span class="text-sm text-slate-600">Stok Habis</span>
              </label>
            </div>
          </div>
        </div>
      </template>

      <!-- Custom Cell Slots -->
      <template #cell-name="{ item }">
        <div class="font-medium text-slate-800">{{ item.name }}</div>
        <div class="text-xs text-slate-400 truncate max-w-[200px]">
          {{ item.description || "-" }}
        </div>
      </template>

      <template #cell-category="{ item }">
        <span
          class="inline-flex px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200"
        >
          {{ item.category || "Umum" }}
        </span>
      </template>

      <template #cell-administrationRoute="{ item }">
        <span
          v-if="item.administrationRoute"
          class="inline-flex px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100"
        >
          {{ item.administrationRoute }}
        </span>
        <span v-else class="text-slate-400 text-xs">-</span>
      </template>

      <template #cell-stock="{ item }">
        <div :class="getStockClass(item)">
          {{ item.stock }}
        </div>
        <div
          v-if="item.stock <= (item.minStock || 10)"
          class="text-xs text-red-500 font-medium mt-1"
        >
          Min: {{ item.minStock || 10 }}
        </div>
      </template>

      <template #cell-expiryDate="{ item }">
        <div v-if="item.expiryDate" :class="getExpiryClass(item.expiryDate)">
          {{ item.expiryDate }}
        </div>
        <span v-else class="text-slate-400">-</span>
      </template>

      <template #cell-actions="{ item }">
        <div class="flex justify-end gap-2">
          <button
            @click="openEdit(item)"
            class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Edit"
          >
            <Icon icon="solar:pen-new-square-linear" class="text-lg" />
          </button>
          <button
            @click="confirmDelete(item)"
            class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Hapus"
          >
            <Icon icon="solar:trash-bin-trash-linear" class="text-lg" />
          </button>
        </div>
      </template>

      <!-- Card View Implementation -->
      <template #card-item="{ item }">
        <div
          class="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition group relative flex flex-col gap-3 h-full"
        >
          <div class="flex justify-between items-start gap-2">
            <div>
              <h3
                class="font-bold text-slate-800 text-sm mb-0.5 line-clamp-2"
                :title="item.name"
              >
                {{ item.name }}
              </h3>
              <div class="flex flex-wrap gap-1">
                <span
                  class="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
                >
                  {{ item.category || "Umum" }}
                </span>
                <span
                  v-if="item.administrationRoute"
                  class="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100"
                >
                  {{ item.administrationRoute }}
                </span>
              </div>
            </div>

            <!-- Stock Badge -->
            <div
              class="shrink-0 px-2 py-1 rounded-lg text-xs font-bold border flex flex-col items-center min-w-[3rem]"
              :class="[
                item.stock <= 0
                  ? 'bg-red-50 text-red-700 border-red-100'
                  : item.stock <= (item.minStock || 10)
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-100',
              ]"
            >
              <span class="text-sm">{{ item.stock }}</span>
              <span class="text-[9px] font-normal uppercase opacity-80">{{
                item.unit || "Pcs"
              }}</span>
            </div>
          </div>

          <div class="space-y-2 mt-auto text-xs text-slate-500">
            <div class="line-clamp-2 min-h-[2.5em]">
              {{ item.description || "Tidak ada deskripsi" }}
            </div>

            <div
              class="pt-2 border-t border-slate-100 flex items-center justify-between"
            >
              <div
                v-if="item.expiryDate"
                class="flex items-center gap-1.5"
                :class="getExpiryClass(item.expiryDate)"
              >
                <Icon icon="solar:calendar-date-bold" class="text-sm" />
                <span class="font-medium"
                  >Exp:
                  {{
                    new Date(item.expiryDate).toLocaleDateString("id-ID")
                  }}</span
                >
              </div>
              <div v-else class="text-slate-400 italic">No Exp Date</div>

              <!-- Actions (Always visible on mobile, hover on desktop) -->
              <div
                class="flex gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              >
                <button
                  @click.stop="openEdit(item)"
                  class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <Icon icon="solar:pen-new-square-linear" class="text-base" />
                </button>
                <button
                  @click.stop="confirmDelete(item)"
                  class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Icon icon="solar:trash-bin-trash-linear" class="text-base" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </DataTable>

    <!-- Modal Form (Keeping custom layout for form but reusing styles) -->
    <Teleport to="body">
      <div
        v-if="modal.show"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          @click="closeModal"
        ></div>

        <div
          class="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-fade-in-up relative z-10"
        >
          <div
            class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"
          >
            <h3 class="text-lg font-bold text-slate-800">
              {{
                modal.mode === "create" ? "Tambah Obat Baru" : "Edit Data Obat"
              }}
            </h3>
            <button
              @click="closeModal"
              class="text-slate-400 hover:text-slate-600"
            >
              <Icon icon="solar:close-circle-bold" class="text-xl" />
            </button>
          </div>

          <div class="p-6 space-y-4">
            <div class="space-y-4">
              <div>
                <label
                  class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider"
                  >Nama Obat <span class="text-red-500">*</span></label
                >
                <input
                  v-model="form.name"
                  class="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#602515]/20 focus:border-[#602515] transition"
                  placeholder="Contoh: Paracetamol 500mg"
                />
              </div>

              <div>
                <label
                  class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider"
                  >Rute Pemberian Obat (Route of Administration)</label
                >
                <select
                  v-model="form.administrationRoute"
                  class="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#602515]/20 focus:border-[#602515] transition bg-white"
                >
                  <option value="">- Pilih Rute Pemberian -</option>
                  <option
                    v-for="opt in administrationRouteOptions"
                    :key="opt"
                    :value="opt"
                  >
                    {{ opt }}
                  </option>
                </select>
              </div>

              <div v-if="form.administrationRoute === 'Lainnya'">
                <label
                  class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider"
                  >Tulis Rute Pemberian Manual <span class="text-red-500">*</span></label
                >
                <input
                  v-model="form.customAdministrationRoute"
                  class="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#602515]/20 focus:border-[#602515] transition"
                  placeholder="Misal: Sublingual, Bintik Mata, dll..."
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label
                    class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider"
                    >Kategori</label
                  >
                  <input
                    v-model="form.category"
                    class="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#602515]/20 focus:border-[#602515] transition"
                    placeholder="Antibiotik, Analgesik, dll"
                  />
                </div>
                <div>
                  <label
                    class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider"
                    >Satuan</label
                  >
                  <input
                    v-model="form.unit"
                    class="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#602515]/20 focus:border-[#602515] transition"
                    placeholder="Tablet, Botol, Strip"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label
                    class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider"
                    >Stok Saat Ini</label
                  >
                  <input
                    v-model="form.stock"
                    type="number"
                    class="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#602515]/20 focus:border-[#602515] transition"
                  />
                </div>
                <div>
                  <label
                    class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider"
                    >Min. Stok (Alert)</label
                  >
                  <input
                    v-model="form.minStock"
                    type="number"
                    class="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#602515]/20 focus:border-[#602515] transition"
                  />
                </div>
              </div>

              <div>
                <label
                  class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider"
                  >Tanggal Kadaluarsa</label
                >
                <input
                  v-model="form.expiryDate"
                  type="date"
                  class="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#602515]/20 focus:border-[#602515] transition"
                />
              </div>

              <div>
                <label
                  class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider"
                  >Deskripsi / Indikasi</label
                >
                <textarea
                  v-model="form.description"
                  rows="3"
                  class="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#602515]/20 focus:border-[#602515] transition"
                  placeholder="Keterangan tambahan..."
                ></textarea>
              </div>
            </div>
          </div>

          <div
            class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3"
          >
            <button
              @click="closeModal"
              class="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 transition text-sm font-medium"
            >
              Batal
            </button>
            <button
              @click="submitForm"
              :disabled="saving"
              class="px-5 py-2.5 rounded-lg bg-[#602515] text-white hover:bg-[#4a1d10] transition text-sm font-medium flex items-center gap-2 shadow-lg shadow-[#602515]/20"
            >
              <span
                v-if="saving"
                class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
              ></span>
              {{ saving ? "Menyimpan..." : "Simpan Data" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Import Modal -->
    <ImportModal
      v-model:isOpen="importModal.show"
      title="Import Data Obat"
      :apiPreview="onImportPreview"
      :apiImport="onImportSubmit"
      :templateHeader="medicineImportTemplate"
      templateName="template_import_obat"
      requiredColumns="Nama Obat"
      @success="onImportSuccess"
    >
      <!-- Custom Preview Columns if needed, otherwise default -->
    </ImportModal>

    <!-- Confirm Modal -->
    <ConfirmModal
      :isOpen="confirm.show"
      :loading="saving"
      title="Hapus Obat?"
      type="danger"
      confirmText="Ya, Hapus"
      cancelText="Batal"
      @confirm="deleteItem"
      @cancel="confirmCancel"
    >
      Anda akan menghapus data <strong>{{ confirm.item?.name }}</strong
      >. Tindakan ini tidak dapat dibatalkan.
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
import { ref, reactive, onMounted, computed } from "vue";
import { Icon } from "@iconify/vue";
import DataTable from "@/components/ui/DataTable.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import StatusModal from "@/components/ui/StatusModal.vue";
import ImportModal from "@/components/common/ImportModal.vue";
import { clinicApi } from "@/services/api.js";

const medicines = ref([]);
const loading = ref(false);
const saving = ref(false);
const search = ref("");
const viewMode = ref("table");
const filterStatus = ref("all");

const modal = reactive({ show: false, mode: "create" });
const importModal = reactive({ show: false });
const statusModal = reactive({
  show: false,
  type: "success",
  title: "",
  message: "",
});
const confirm = reactive({ show: false, item: null });

const administrationRouteOptions = [
  "Injeksi (parenteral)",
  "Obat oral (tablet, kapsul)",
  "Obat oral cair (sirup, suspensi)",
  "Obat topikal (salep, krim, gel)",
  "Obat inhalasi",
  "Obat rektal/vaginal",
  "Obat tetes (mata, telinga, hidung)",
  "Lainnya",
];

const form = reactive({
  id: null,
  name: "",
  category: "",
  administrationRoute: "",
  customAdministrationRoute: "",
  stock: 0,
  minStock: 10,
  unit: "",
  expiryDate: "",
  description: "",
});

const columns = [
  { label: "Nama Obat", field: "name", sortable: true },
  { label: "Kategori", field: "category", sortable: true },
  { label: "Rute Pemberian", field: "administrationRoute", sortable: true },
  { label: "Stok", field: "stock", sortable: true, align: "center" },
  { label: "Satuan", field: "unit" },
  { label: "Kadaluarsa", field: "expiryDate", sortable: true },
  { label: "Aksi", field: "actions", align: "right" },
];

const medicineImportTemplate = [
  {
    "Nama Obat": "Paracetamol 500mg",
    Kategori: "Analgesik",
    "Rute Pemberian": "Obat oral (tablet, kapsul)",
    Stok: 100,
    Satuan: "Strip",
    Harga: 5000,
    "Min Stok": 10,
    "Kadaluarsa (YYYY-MM-DD)": "2025-12-31",
    Deskripsi: "Obat penurun panas",
  },
];

const filteredMedicines = computed(() => {
  let result = [...medicines.value];

  if (search.value) {
    const q = search.value.toLowerCase();
    result = result.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.category && m.category.toLowerCase().includes(q)) ||
        (m.administrationRoute && m.administrationRoute.toLowerCase().includes(q)),
    );
  }

  // Filter Status
  if (filterStatus.value !== "all") {
    result = result.filter((m) => {
      const isLow = m.stock <= (m.minStock || 10) && m.stock > 0;
      const isOut = m.stock <= 0;

      if (filterStatus.value === "low") return isLow;
      if (filterStatus.value === "out") return isOut;
      if (filterStatus.value === "good") return !isLow && !isOut;
      return true;
    });
  }

  // Always sort alphabetically by name (A-Z)
  result.sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", "id", { sensitivity: "base" })
  );

  return result;
});

function showStatus(type, title, message) {
  statusModal.type = type;
  statusModal.title = title;
  statusModal.message = message;
  statusModal.show = true;
}

function getStockClass(item) {
  if (item.stock <= 0) return "text-red-600 font-bold";
  if (item.stock <= (item.minStock || 10)) return "text-amber-600 font-bold";
  return "text-emerald-600 font-bold";
}

function getExpiryClass(dateStr) {
  const today = new Date();
  const expiry = new Date(dateStr);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "text-red-600 font-bold flex items-center gap-1";
  if (diffDays < 30) return "text-amber-600 font-medium";
  return "text-slate-600";
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await clinicApi.getMedicines();
    medicines.value = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    showStatus("error", "Gagal", e.message || "Gagal memuat data");
  } finally {
    loading.value = false;
  }
}

async function submitForm() {
  saving.value = true;
  try {
    if (!form.name) {
      throw new Error("Nama obat wajib diisi");
    }

    const finalRoute =
      form.administrationRoute === "Lainnya"
        ? form.customAdministrationRoute || "Lainnya"
        : form.administrationRoute;

    const payload = {
      name: form.name,
      category: form.category || undefined,
      administrationRoute: finalRoute || undefined,
      stock: parseInt(form.stock) || 0,
      minStock: parseInt(form.minStock) || 10,
      unit: form.unit || undefined,
      expiryDate: form.expiryDate || undefined,
      description: form.description || undefined,
    };
    if (modal.mode === "edit" && form.id) {
      await clinicApi.updateMedicine(form.id, payload);
    } else {
      await clinicApi.createMedicine(payload);
    }
    await fetchData();
    closeModal();
    showStatus("success", "Berhasil", "Data obat berhasil disimpan");
  } catch (e) {
    showStatus("error", "Gagal", e.message || "Gagal menyimpan");
  } finally {
    saving.value = false;
  }
}

async function deleteItem() {
  saving.value = true;
  try {
    await clinicApi.deleteMedicine(confirm.item.id);
    await fetchData();
    confirmCancel();
    showStatus("success", "Terhapus", "Data obat berhasil dihapus");
  } catch (e) {
    showStatus("error", "Gagal", e.message || "Gagal menghapus");
  } finally {
    saving.value = false;
  }
}

function openCreate() {
  modal.show = true;
  modal.mode = "create";
  Object.assign(form, {
    id: null,
    name: "",
    category: "",
    administrationRoute: "",
    customAdministrationRoute: "",
    stock: 0,
    minStock: 10,
    unit: "",
    expiryDate: "",
    description: "",
  });
}

function openEdit(item) {
  modal.show = true;
  modal.mode = "edit";

  let routeVal = item.administrationRoute || "";
  let customRouteVal = "";

  if (routeVal && !administrationRouteOptions.includes(routeVal)) {
    customRouteVal = routeVal;
    routeVal = "Lainnya";
  }

  Object.assign(form, {
    ...item,
    administrationRoute: routeVal,
    customAdministrationRoute: customRouteVal,
    minStock: item.minStock || 10,
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

// Import Handlers
async function onImportPreview(formData) {
  return await clinicApi.importMedicinePreview(formData);
}

async function onImportSubmit(formData) {
  return await clinicApi.importMedicine(formData);
}

function onImportSuccess() {
  fetchData();
}

onMounted(fetchData);
</script>

<style scoped>
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
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}
</style>
