<template>
  <div>
    <!-- Data Table -->
    <DataTable
      title="Manajemen Apotik"
      description="Kelola apotik klinik, data apoteker, dan alokasi obat pesantren."
      icon="solar:shop-2-bold-duotone"
      :columns="columns"
      :items="pharmacies"
      :loading="loading"
      :pagination="pagination"
      :viewMode="viewMode"
      :searchQuery="searchQuery"
      @search="onSearchInput"
      @update:limit="changeLimit"
      @page-change="changePage"
      @update:viewMode="(v) => (viewMode = v)"
    >
      <!-- Header Actions -->
      <template #header-actions>
        <button
          @click="openCreate"
          class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all shadow-sm hover:shadow-md"
          style="background: #602515"
        >
          <Icon icon="solar:add-circle-bold-duotone" class="text-lg" />
          <span>Tambah Apotik</span>
        </button>
      </template>

      <!-- Cell: Pharmacists -->
      <template #cell-members="{ item }">
        <button
          @click="openPharmacists(item)"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-100"
        >
          <Icon icon="solar:user-speak-rounded-bold-duotone" class="text-sm" />
          {{ item.memberCount || 0 }} apoteker
        </button>
      </template>

      <!-- Cell: Action -->
      <template #cell-action="{ item }">
        <div class="flex items-center gap-1">
          <button
            @click="openEdit(item)"
            class="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#602515] transition-colors"
            title="Edit"
          >
            <Icon icon="solar:pen-2-bold-duotone" />
          </button>
          <button
            @click="confirmDelete(item)"
            class="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors"
            title="Hapus"
          >
            <Icon icon="solar:trash-bin-trash-bold-duotone" />
          </button>
        </div>
      </template>

      <!-- Grid View Template -->
      <template #card-item="{ item }">
        <div
          class="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col relative group"
        >
          <div class="absolute top-3 right-3 flex gap-1">
            <button
              @click="openEdit(item)"
              class="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
            >
              <Icon icon="solar:pen-2-bold-duotone" class="text-lg" />
            </button>
            <button
              @click="confirmDelete(item)"
              class="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              <Icon icon="solar:trash-bin-trash-bold-duotone" class="text-lg" />
            </button>
          </div>

          <div class="flex items-center gap-4 mb-3">
            <div
              class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center"
            >
              <Icon icon="solar:shop-2-bold-duotone" class="text-2xl" />
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-lg line-clamp-1">
                {{ item.name }}
              </h3>
              <p class="text-xs text-slate-400">ID: {{ item.id }}</p>
            </div>
          </div>

          <p class="text-sm text-slate-600 mb-4 line-clamp-2 min-h-[40px]">
            {{ item.description || "Tidak ada deskripsi" }}
          </p>

          <div class="mt-auto pt-3 border-t">
            <button
              @click="openPharmacists(item)"
              class="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white transition-colors text-sm font-medium"
            >
              <Icon icon="solar:user-speak-rounded-bold-duotone" />
              Kelola {{ item.memberCount || 0 }} Apoteker
            </button>
          </div>
        </div>
      </template>
    </DataTable>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div
        v-if="modal.show"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      >
        <div
          class="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        >
          <!-- Header -->
          <div class="p-4 border-b flex items-center justify-between">
            <h3 class="font-semibold text-slate-800">
              {{ modal.mode === "create" ? "Tambah Apotik Baru" : "Edit Data Apotik" }}
            </h3>
            <button
              @click="closeModal"
              class="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Icon
                icon="solar:close-circle-line-duotone"
                class="text-xl text-slate-400"
              />
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4">
            <form @submit.prevent="submitForm">
              <div
                v-if="modal.error"
                class="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2"
              >
                <Icon icon="solar:danger-circle-bold-duotone" />
                {{ modal.error }}
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1"
                    >Nama Apotik <span class="text-red-500">*</span></label
                  >
                  <input
                    v-model="form.name"
                    type="text"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#602515]"
                    placeholder="Contoh: Apotik Utama"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1"
                    >Deskripsi / Lokasi Penyimpanan</label
                  >
                  <textarea
                    v-model="form.description"
                    rows="3"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#602515]"
                    placeholder="Deskripsi apotik (opsional)"
                  ></textarea>
                </div>
              </div>

              <!-- Footer -->
              <div
                class="pt-6 mt-6 border-t flex items-center justify-end gap-3"
              >
                <button
                  type="button"
                  @click="closeModal"
                  class="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 bg-[#f8ae19] hover:bg-[#e09d0f]"
                >
                  <Icon
                    v-if="saving"
                    icon="solar:spinner-bold"
                    class="animate-spin"
                  />
                  <Icon v-else icon="solar:diskette-bold-duotone" />
                  {{ saving ? "Menyimpan..." : "Simpan" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Side-by-Side Pharmacists Picker -->
    <SideBySidePicker
      :show="pharmacistsModal.show"
      :title="`Apoteker: ${pharmacistsModal.pharmacyItem?.name || ''}`"
      header-icon="solar:user-speak-rounded-bold-duotone"
      available-title="Guru / Staff Tersedia"
      selected-title="Apoteker Apotik"
      item-label="apoteker"
      :available-items="availableTeachers"
      :selected-items="pharmacistsModal.pharmacists"
      display-field="fullName"
      sub-field="nip"
      meta-field="pharmacyLabel"
      :loading-available="loadingTeachers"
      :loading-selected="pharmacistsModal.loading"
      :error="pharmacistsModal.error"
      @close="closePharmacistsModal"
      @add="addPharmacist"
      @remove="removePharmacist"
    />

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      :isOpen="confirm.show"
      title="Hapus Apotik"
      :message="`Apakah Anda yakin ingin menghapus apotik '${confirm.item?.name}'? Semua apoteker akan dibebastugaskan dari apotik ini.`"
      confirmText="Hapus"
      cancelText="Batal"
      @confirm="deleteItem"
      @cancel="confirmCancel"
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
import { ref, reactive, computed, onMounted } from "vue";
import { clinicApi, teachersApi } from "@/services/api.js";
import { Icon } from "@iconify/vue";
import DataTable from "@/components/ui/DataTable.vue";
import SideBySidePicker from "@/components/ui/SideBySidePicker.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import StatusModal from "@/components/ui/StatusModal.vue";

const columns = [
  { field: "name", label: "NAMA APOTIK", sortable: true },
  { field: "description", label: "DESKRIPSI / KETERANGAN" },
  { field: "members", label: "APOTEKER" },
  { field: "action", label: "AKSI", align: "center", width: "w-32" },
];

// State
const pharmacies = ref([]);
const allTeachers = ref([]);
const loading = ref(false);
const loadingTeachers = ref(false);
const saving = ref(false);
const searchQuery = ref("");
const viewMode = ref("table");

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
});

const modal = reactive({
  show: false,
  mode: "create",
  error: "",
});

const form = reactive({
  id: null,
  name: "",
  description: "",
});

const confirm = reactive({
  show: false,
  item: null,
});

const pharmacistsModal = reactive({
  show: false,
  pharmacyItem: null,
  pharmacists: [],
  loading: false,
  error: "",
});

const statusModal = reactive({
  isOpen: false,
  type: "success",
  title: "",
  message: "",
});

// Computed: available teachers/staff for pharmacist assignment
const availableTeachers = computed(() => {
  const pharmacistIds = pharmacistsModal.pharmacists.map((m) => m.teacherId || m.id);
  return allTeachers.value
    .filter((t) => !pharmacistIds.includes(t.id))
    .map((t) => {
      // Find which pharmacies this teacher is currently assigned to (optional info)
      return {
        ...t,
        pharmacyLabel: t.nip ? `NIP: ${t.nip}` : null,
      };
    });
});

let searchTimer = null;
function onSearchInput(value) {
  searchQuery.value = value;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    fetchData();
  }, 300);
}

function changeLimit(limit) {
  pagination.limit = limit;
  pagination.page = 1;
  fetchData();
}

function changePage(page) {
  pagination.page = page;
  fetchData();
}

// Fetch pharmacies
async function fetchData() {
  loading.value = true;
  try {
    const res = await clinicApi.getPharmacies();
    let list = Array.isArray(res?.data) ? res.data : [];

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      list = list.filter((d) => d.name?.toLowerCase().includes(q));
    }

    pagination.total = list.length;
    pagination.totalPages = Math.ceil(list.length / pagination.limit) || 1;

    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    pharmacies.value = list.slice(start, end);
  } catch (e) {
    statusModal.type = "error";
    statusModal.title = "Gagal!";
    statusModal.message = e.message || "Gagal memuat data apotik";
    statusModal.isOpen = true;
  } finally {
    loading.value = false;
  }
}

// Fetch teachers/staff
async function fetchTeachers() {
  loadingTeachers.value = true;
  try {
    const res = await teachersApi.getAll();
    allTeachers.value = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    console.error("Gagal memuat guru:", e);
  } finally {
    loadingTeachers.value = false;
  }
}

// CRUD Apotik
async function submitForm() {
  if (!form.name?.trim()) {
    modal.error = "Nama apotik wajib diisi";
    return;
  }

  saving.value = true;
  modal.error = "";

  try {
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || "",
    };

    if (modal.mode === "create") {
      await clinicApi.createPharmacy(payload);
      statusModal.type = "success";
      statusModal.title = "Berhasil!";
      statusModal.message = "Apotik berhasil ditambahkan";
    } else {
      await clinicApi.updatePharmacy(form.id, payload);
      statusModal.type = "success";
      statusModal.title = "Berhasil!";
      statusModal.message = "Apotik berhasil diperbarui";
    }

    statusModal.isOpen = true;
    closeModal();
    fetchData();
  } catch (e) {
    modal.error = e.message || "Gagal menyimpan data";
  } finally {
    saving.value = false;
  }
}

async function deleteItem() {
  if (!confirm.item) return;

  try {
    const res = await clinicApi.deletePharmacy(confirm.item.id);
    statusModal.type = "success";
    statusModal.title = "Berhasil!";
    statusModal.message = res?.message || "Apotik berhasil dihapus";
    statusModal.isOpen = true;
    confirmCancel();
    fetchData();
  } catch (e) {
    statusModal.type = "error";
    statusModal.title = "Gagal!";
    statusModal.message = e.message || "Gagal menghapus data";
    statusModal.isOpen = true;
  }
}

// Pharmacists Assignment
async function openPharmacists(item) {
  pharmacistsModal.show = true;
  pharmacistsModal.pharmacyItem = item;
  pharmacistsModal.error = "";
  pharmacistsModal.loading = true;

  if (allTeachers.value.length === 0) {
    await fetchTeachers();
  }

  try {
    const res = await clinicApi.getPharmacists(item.id);
    const list = Array.isArray(res?.data) ? res.data : [];
    // Map to structure expected by SideBySidePicker
    pharmacistsModal.pharmacists = list.map((record) => ({
      id: record.teacher?.id || record.teacherId,
      teacherId: record.teacher?.id || record.teacherId,
      fullName: record.teacher?.fullName || "Apoteker",
      nip: record.teacher?.nip || "-",
    }));
  } catch (e) {
    pharmacistsModal.error = e.message || "Gagal memuat apoteker";
  } finally {
    pharmacistsModal.loading = false;
  }
}

async function addPharmacist(teacher) {
  pharmacistsModal.error = "";
  try {
    await clinicApi.addPharmacist(pharmacistsModal.pharmacyItem.id, teacher.id);
    
    // Refresh lists
    const res = await clinicApi.getPharmacists(pharmacistsModal.pharmacyItem.id);
    const list = Array.isArray(res?.data) ? res.data : [];
    pharmacistsModal.pharmacists = list.map((record) => ({
      id: record.teacher?.id || record.teacherId,
      teacherId: record.teacher?.id || record.teacherId,
      fullName: record.teacher?.fullName || "Apoteker",
      nip: record.teacher?.nip || "-",
    }));
    await fetchData();
  } catch (e) {
    pharmacistsModal.error = e.message || "Gagal menambahkan apoteker";
  }
}

async function removePharmacist(member) {
  pharmacistsModal.error = "";
  try {
    await clinicApi.removePharmacist(pharmacistsModal.pharmacyItem.id, member.teacherId || member.id);
    
    // Refresh lists
    const res = await clinicApi.getPharmacists(pharmacistsModal.pharmacyItem.id);
    const list = Array.isArray(res?.data) ? res.data : [];
    pharmacistsModal.pharmacists = list.map((record) => ({
      id: record.teacher?.id || record.teacherId,
      teacherId: record.teacher?.id || record.teacherId,
      fullName: record.teacher?.fullName || "Apoteker",
      nip: record.teacher?.nip || "-",
    }));
    await fetchData();
  } catch (e) {
    pharmacistsModal.error = e.message || "Gagal menghapus apoteker";
  }
}

function closePharmacistsModal() {
  pharmacistsModal.show = false;
  pharmacistsModal.pharmacists = [];
}

// Modal Helpers
function openCreate() {
  modal.show = true;
  modal.mode = "create";
  modal.error = "";
  Object.assign(form, {
    id: null,
    name: "",
    description: "",
  });
}

function openEdit(item) {
  modal.show = true;
  modal.mode = "edit";
  modal.error = "";
  Object.assign(form, { ...item });
}

function closeModal() {
  modal.show = false;
}

function confirmDelete(item) {
  confirm.show = true;
  confirm.item = item;
}

// Revert logic
function confirmCancel() {
  confirm.show = false;
  confirm.item = null;
}

onMounted(() => {
  fetchData();
  fetchTeachers();
});
</script>
