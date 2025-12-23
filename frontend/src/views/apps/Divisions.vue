<template>
  <div>
    <!-- Data Table -->
    <DataTable
      title="Divisi"
      description="Kelola divisi dan anggota di pesantren"
      icon="solar:buildings-2-bold-duotone"
      :columns="columns"
      :items="divisions"
      :loading="loading"
      :pagination="pagination"
      :viewMode="viewMode"
      :searchQuery="searchQuery"
      @search="onSearchInput"
      @changeLimit="changeLimit"
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
          <span>Tambah Divisi</span>
        </button>
      </template>

      <!-- Cell: Members -->
      <template #cell-members="{ item }">
        <button
          @click="openMembers(item)"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors border border-amber-100"
        >
          <Icon icon="solar:users-group-rounded-bold-duotone" class="text-sm" />
          {{ item.memberCount || 0 }} anggota
        </button>
      </template>

      <!-- Cell: Action -->
      <template #cell-action="{ item }">
        <div class="flex items-center gap-1">
          <button
            @click="openEdit(item)"
            class="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-amber-600 transition-colors"
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
              class="w-12 h-12 rounded-xl bg-amber-50 text-[#602515] flex items-center justify-center"
            >
              <Icon icon="solar:buildings-2-bold-duotone" class="text-2xl" />
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
              @click="openMembers(item)"
              class="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium"
            >
              <Icon icon="solar:users-group-rounded-bold-duotone" />
              Lihat {{ item.memberCount || 0 }} Anggota
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
              {{ modal.mode === "create" ? "Tambah Divisi" : "Edit Divisi" }}
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
                    >Nama Divisi <span class="text-red-500">*</span></label
                  >
                  <input
                    v-model="form.name"
                    type="text"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#602515]"
                    placeholder="Contoh: Kurikulum"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1"
                    >Deskripsi</label
                  >
                  <textarea
                    v-model="form.description"
                    rows="3"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#602515]"
                    placeholder="Deskripsi divisi (opsional)"
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

    <!-- Side-by-Side Members Modal -->
    <SideBySidePicker
      :show="membersModal.show"
      :title="`Anggota: ${membersModal.divisionItem?.name || ''}`"
      header-icon="solar:users-group-rounded-bold-duotone"
      available-title="Guru Tersedia"
      selected-title="Anggota Divisi"
      item-label="guru"
      :available-items="availableTeachers"
      :selected-items="membersModal.members"
      display-field="fullName"
      sub-field="nip"
      meta-field="divisionLabel"
      :loading-available="loadingTeachers"
      :loading-selected="membersModal.loading"
      :error="membersModal.error"
      @close="closeMembersModal"
      @add="addMember"
      @remove="removeMember"
    />

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      :isOpen="confirm.show"
      title="Hapus Divisi"
      :message="`Apakah Anda yakin ingin menghapus divisi '${confirm.item?.name}'? Semua anggota akan dikeluarkan dari divisi ini.`"
      confirmText="Hapus"
      cancelText="Batal"
      @confirm="deleteItem"
      @cancel="confirmCancel"
    />

    <!-- Confirm Move Teacher Modal -->
    <ConfirmModal
      :isOpen="confirmMove.show"
      title="Pindahkan Guru?"
      :message="`Guru '${confirmMove.teacher?.fullName}' sudah terdaftar di divisi '${confirmMove.existingDivision?.name}'. Apakah Anda ingin memindahkan ke divisi ini?`"
      confirmText="Ya, Pindahkan"
      cancelText="Batal"
      @confirm="confirmMoveTeacher"
      @cancel="cancelMoveTeacher"
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
import { divisionsApi, teachersApi } from "@/services/api.js";
import { Icon } from "@iconify/vue";
import DataTable from "@/components/ui/DataTable.vue";
import SideBySidePicker from "@/components/ui/SideBySidePicker.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import StatusModal from "@/components/ui/StatusModal.vue";

// Table columns - CORRECTED property names 'field' per DataTable
const columns = [
  { field: "name", label: "NAMA DIVISI", sortable: true },
  { field: "description", label: "DESKRIPSI" },
  { field: "members", label: "ANGGOTA" },
  { field: "action", label: "AKSI", align: "center", width: "w-32" },
];

// State
const divisions = ref([]);
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

const membersModal = reactive({
  show: false,
  divisionItem: null,
  members: [],
  loading: false,
  error: "",
});

const statusModal = reactive({
  isOpen: false,
  type: "success",
  title: "",
  message: "",
});

// State for confirming move between divisions
const confirmMove = reactive({
  show: false,
  teacher: null,
  existingDivision: null,
});

// Computed: available teachers (not in current division)
const availableTeachers = computed(() => {
  const memberIds = membersModal.members.map((m) => m.teacherId || m.id);
  return allTeachers.value
    .filter((t) => !memberIds.includes(t.id))
    .map((t) => {
      const divNames = t.divisions
        ?.map((d) => d.name)
        .filter(Boolean)
        .join(", ");
      return {
        ...t,
        divisionLabel: divNames ? `Divisi: ${divNames}` : null,
      };
    });
});

// Debounce for search
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

// Data fetching
async function fetchData() {
  loading.value = true;
  try {
    const res = await divisionsApi.getAll();
    let list = Array.isArray(res?.data) ? res.data : [];

    // Filter by search if needed - basic client side search as fallback
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      list = list.filter((d) => d.name?.toLowerCase().includes(q));
    }

    // Client side pagination fallback as divisions API seems to return all currently
    pagination.total = list.length;
    pagination.totalPages = Math.ceil(list.length / pagination.limit) || 1;

    // Slice for current page
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    divisions.value = list.slice(start, end);
  } catch (e) {
    statusModal.type = "error";
    statusModal.title = "Gagal!";
    statusModal.message = e.message || "Gagal memuat data";
    statusModal.isOpen = true;
  } finally {
    loading.value = false;
  }
}

async function fetchTeachers() {
  loadingTeachers.value = true;
  try {
    const res = await teachersApi.getAll();
    allTeachers.value = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    console.error(e);
  } finally {
    loadingTeachers.value = false;
  }
}

// CRUD operations
async function submitForm() {
  if (!form.name?.trim()) {
    modal.error = "Nama divisi wajib diisi";
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
      await divisionsApi.create(payload);
      statusModal.type = "success";
      statusModal.title = "Berhasil!";
      statusModal.message = "Divisi berhasil ditambahkan";
    } else {
      await divisionsApi.update(form.id, payload);
      statusModal.type = "success";
      statusModal.title = "Berhasil!";
      statusModal.message = "Divisi berhasil diperbarui";
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
    await divisionsApi.delete(confirm.item.id);
    statusModal.type = "success";
    statusModal.title = "Berhasil!";
    statusModal.message = "Divisi berhasil dihapus";
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

// Members modal
async function openMembers(item) {
  membersModal.show = true;
  membersModal.divisionItem = item;
  membersModal.error = "";
  membersModal.loading = true;

  if (allTeachers.value.length === 0) {
    await fetchTeachers();
  }

  try {
    const res = await divisionsApi.getMembers(item.id);
    membersModal.members = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    membersModal.error = e.message || "Gagal memuat";
  } finally {
    membersModal.loading = false;
  }
}

async function addMember(teacher) {
  membersModal.error = "";
  try {
    const res = await divisionsApi.addMember(
      membersModal.divisionItem.id,
      teacher.id
    );

    // Check if requires confirmation to move from another division
    if (res.requiresConfirm && res.existingDivision) {
      confirmMove.show = true;
      confirmMove.teacher = teacher;
      confirmMove.existingDivision = res.existingDivision;
      return;
    }

    // Success - reload members and refresh teachers list for division labels
    const membersRes = await divisionsApi.getMembers(
      membersModal.divisionItem.id
    );
    membersModal.members = Array.isArray(membersRes?.data)
      ? membersRes.data
      : [];
    await fetchTeachers(); // Refresh teacher data to update division labels
    await fetchData();
  } catch (e) {
    membersModal.error = e.message || "Gagal menambahkan";
  }
}

// Confirm moving teacher from one division to another
async function confirmMoveTeacher() {
  membersModal.error = "";
  try {
    await divisionsApi.addMember(
      membersModal.divisionItem.id,
      confirmMove.teacher.id,
      true // force = true
    );

    // Reload members and refresh teachers list for division labels
    const membersRes = await divisionsApi.getMembers(
      membersModal.divisionItem.id
    );
    membersModal.members = Array.isArray(membersRes?.data)
      ? membersRes.data
      : [];
    await fetchTeachers(); // Refresh teacher data to update division labels
    await fetchData();

    // Reset confirm state
    confirmMove.show = false;
    confirmMove.teacher = null;
    confirmMove.existingDivision = null;
  } catch (e) {
    membersModal.error = e.message || "Gagal memindahkan";
    confirmMove.show = false;
  }
}

function cancelMoveTeacher() {
  confirmMove.show = false;
  confirmMove.teacher = null;
  confirmMove.existingDivision = null;
}

async function removeMember(member) {
  membersModal.error = "";
  try {
    await divisionsApi.removeMember(
      membersModal.divisionItem.id,
      member.teacherId || member.id
    );
    const res = await divisionsApi.getMembers(membersModal.divisionItem.id);
    membersModal.members = Array.isArray(res?.data) ? res.data : [];
    await fetchTeachers(); // Refresh teacher data to update division labels
    await fetchData();
  } catch (e) {
    membersModal.error = e.message || "Gagal menghapus";
  }
}

function closeMembersModal() {
  membersModal.show = false;
  membersModal.members = [];
}

// Modal helpers
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

function confirmCancel() {
  confirm.show = false;
  confirm.item = null;
}

onMounted(() => {
  fetchData();
  fetchTeachers();
});
</script>
