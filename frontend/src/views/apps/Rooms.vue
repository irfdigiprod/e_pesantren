<template>
  <div>
    <DataTable
      title="Kamar"
      description="Kelola kamar asrama, penghuni, dan pengawas"
      icon="solar:bed-bold-duotone"
      :items="rooms"
      :columns="columns"
      :loading="loading"
      v-model:viewMode="viewMode"
      v-model:search="searchQuery"
      :pagination="pagination"
      @update:search="onSearchInput"
      @update:limit="changeLimit"
      @page-change="changePage"
    >
      <!-- Header Actions -->
      <template #header-actions>
        <button
          @click="openCreate"
          :disabled="saving"
          class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
          style="background: #602515"
        >
          <Icon icon="solar:add-circle-line-duotone" class="text-lg" />
          <span>Tambah Kamar</span>
        </button>
      </template>

      <!-- Cell: Name -->
      <template #cell-name="{ item }">
        <span class="font-medium text-slate-800">{{ item.name }}</span>
      </template>

      <!-- Cell: Capacity -->
      <template #cell-capacity="{ item }">
        <span class="text-slate-600">{{ item.capacity || "-" }}</span>
      </template>

      <!-- Cell: Students -->
      <template #cell-students="{ item }">
        <button
          @click="openStudents(item)"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <Icon icon="solar:users-group-rounded-bold-duotone" class="text-sm" />
          {{ item.students?.length || 0 }} santri
        </button>
      </template>

      <!-- Cell: Supervisors -->
      <template #cell-supervisors="{ item }">
        <button
          @click="openSupervisors(item)"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
        >
          <Icon icon="solar:shield-user-bold-duotone" class="text-sm" />
          {{ item.supervisors?.length || 0 }} pengawas
        </button>
      </template>

      <!-- Cell: Action -->
      <template #cell-action="{ item }">
        <div class="flex items-center gap-1">
          <button
            @click="openEdit(item)"
            class="p-2 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
            title="Edit"
          >
            <Icon icon="solar:pen-2-bold-duotone" />
          </button>
          <button
            @click="confirmDelete(item)"
            class="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
            title="Hapus"
          >
            <Icon icon="solar:trash-bin-trash-bold-duotone" />
          </button>
        </div>
      </template>

      <!-- Card Item for mobile view -->
      <template #card-item="{ item }">
        <div
          class="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-[#602515]/10 flex items-center justify-center"
              >
                <Icon
                  icon="solar:bed-bold-duotone"
                  class="text-xl text-[#602515]"
                />
              </div>
              <div>
                <h3 class="font-semibold text-slate-800">{{ item.name }}</h3>
                <p class="text-xs text-slate-500">
                  Kapasitas: {{ item.capacity || "-" }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 mb-3">
            <button
              @click="openStudents(item)"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
            >
              <Icon
                icon="solar:users-group-rounded-bold-duotone"
                class="text-sm"
              />
              {{ item.students?.length || 0 }} santri
            </button>
            <button
              @click="openSupervisors(item)"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700"
            >
              <Icon icon="solar:shield-user-bold-duotone" class="text-sm" />
              {{ item.supervisors?.length || 0 }} pengawas
            </button>
          </div>

          <div class="flex gap-2 pt-3 border-t border-slate-100">
            <button
              @click="openEdit(item)"
              class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <Icon icon="solar:pen-2-bold-duotone" class="text-amber-500" />
              Edit
            </button>
            <button
              @click="confirmDelete(item)"
              class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 hover:bg-red-50 text-red-600 transition-colors"
            >
              <Icon icon="solar:trash-bin-trash-bold-duotone" />
              Hapus
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
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-[#602515]/10 flex items-center justify-center"
              >
                <Icon
                  :icon="
                    modal.mode === 'create'
                      ? 'solar:add-circle-bold-duotone'
                      : 'solar:pen-2-bold-duotone'
                  "
                  class="text-xl text-[#602515]"
                />
              </div>
              <div>
                <h3 class="font-semibold text-slate-800">
                  {{ modal.mode === "create" ? "Tambah" : "Edit" }} Kamar
                </h3>
                <p class="text-xs text-slate-500">Isi data kamar asrama</p>
              </div>
            </div>
            <button
              @click="closeModal"
              class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Icon
                icon="solar:close-circle-line-duotone"
                class="text-xl text-slate-400"
              />
            </button>
          </div>

          <!-- Content -->
          <div class="p-5 space-y-4">
            <div
              v-if="modal.error"
              class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
            >
              {{ modal.error }}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  Nama Kamar <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.name"
                  class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#602515]"
                  placeholder="Contoh: Kamar A1"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Kapasitas</label
                >
                <input
                  v-model="form.capacity"
                  type="number"
                  class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#602515]"
                  placeholder="Contoh: 10"
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
                class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#602515] resize-none"
                placeholder="Deskripsi kamar (opsional)"
              ></textarea>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="p-4 border-t bg-slate-50 flex items-center justify-end gap-3"
          >
            <button
              @click="closeModal"
              class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              @click="submitForm"
              :disabled="saving"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style="background: #602515"
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
        </div>
      </div>
    </Teleport>

    <!-- Side-by-Side Students Modal -->
    <SideBySidePicker
      :show="studentsModal.show"
      :title="`Penghuni: ${studentsModal.room?.name || ''}`"
      header-icon="solar:users-group-rounded-bold-duotone"
      available-title="Santri Tersedia"
      selected-title="Penghuni Kamar"
      item-label="santri"
      :available-items="availableStudents"
      :selected-items="studentsModal.students"
      display-field="fullName"
      sub-field="nis"
      meta-field="roomLabel"
      :loading-available="loadingStudents"
      :loading-selected="studentsModal.loading"
      :error="studentsModal.error"
      @close="studentsModal.show = false"
      @add="addStudent"
      @remove="removeStudent"
    />

    <!-- Side-by-Side Supervisors Modal -->
    <SideBySidePicker
      :show="supervisorsModal.show"
      :title="`Pengawas: ${supervisorsModal.room?.name || ''}`"
      header-icon="solar:user-id-bold-duotone"
      available-title="Guru Tersedia"
      selected-title="Pengawas Kamar"
      item-label="guru"
      :available-items="availableSupervisors"
      :selected-items="supervisorsModal.supervisors"
      display-field="fullName"
      sub-field="nip"
      :loading-available="loadingTeachers"
      :loading-selected="supervisorsModal.loading"
      :error="supervisorsModal.error"
      @close="supervisorsModal.show = false"
      @add="addSupervisor"
      @remove="removeSupervisor"
    />

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      :isOpen="confirm.show"
      title="Hapus Kamar"
      :message="`Apakah Anda yakin ingin menghapus kamar '${confirm.item?.name}'? Data yang dihapus tidak dapat dikembalikan.`"
      confirmText="Hapus"
      cancelText="Batal"
      @confirm="deleteItem"
      @cancel="confirmCancel"
    />

    <!-- Confirm Move Student Modal -->
    <ConfirmModal
      :isOpen="confirmMove.show"
      title="Pindahkan Santri?"
      :message="`Santri '${confirmMove.student?.fullName}' sudah terdaftar di kamar '${confirmMove.existingRoom?.name}'. Apakah Anda ingin memindahkan ke kamar ini?`"
      confirmText="Ya, Pindahkan"
      cancelText="Batal"
      @confirm="confirmMoveStudent"
      @cancel="cancelMoveStudent"
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
import { roomsApi, studentsApi, teachersApi } from "@/services/api.js";
import { Icon } from "@iconify/vue";
import DataTable from "@/components/ui/DataTable.vue";
import SideBySidePicker from "@/components/ui/SideBySidePicker.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import StatusModal from "@/components/ui/StatusModal.vue";

// Columns configuration
const columns = [
  {
    field: "name",
    label: "Nama Kamar",
    sortable: true,
    width: "min-w-[150px]",
  },
  {
    field: "capacity",
    label: "Kapasitas",
    width: "min-w-[100px]",
    align: "center",
  },
  {
    field: "students",
    label: "Penghuni",
    width: "min-w-[120px]",
  },
  {
    field: "supervisors",
    label: "Pengawas",
    width: "min-w-[120px]",
  },
  {
    field: "action",
    label: "Aksi",
    width: "w-24",
    align: "center",
  },
];

// State
const rooms = ref([]);
const allStudents = ref([]);
const allTeachers = ref([]);
const loading = ref(true);
const loadingStudents = ref(false);
const loadingTeachers = ref(false);
const saving = ref(false);
const viewMode = ref("table");
const searchQuery = ref("");

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

const modal = reactive({ show: false, mode: "create", error: "" });
const form = reactive({ id: null, name: "", capacity: "", description: "" });
const confirm = reactive({ show: false, item: null });

const studentsModal = reactive({
  show: false,
  room: null,
  students: [],
  loading: false,
  error: "",
});

const supervisorsModal = reactive({
  show: false,
  room: null,
  supervisors: [],
  loading: false,
  error: "",
});

// State for confirming move between rooms
const confirmMove = reactive({
  show: false,
  student: null,
  existingRoom: null,
});

// Computed: Available students with room info
const availableStudents = computed(() => {
  const memberIds = studentsModal.students.map((s) => s.studentId || s.id);
  return allStudents.value
    .filter((s) => !memberIds.includes(s.id))
    .map((s) => {
      const roomName = s.room?.name;
      return {
        ...s,
        roomLabel: roomName ? `Kamar: ${roomName}` : null,
      };
    });
});

// Computed: Available supervisors
const availableSupervisors = computed(() => {
  const memberIds = supervisorsModal.supervisors.map(
    (t) => t.teacherId || t.id
  );
  return allTeachers.value.filter((t) => !memberIds.includes(t.id));
});

const statusModal = reactive({
  isOpen: false,
  type: "success",
  title: "",
  message: "",
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
    const res = await roomsApi.getAll();
    const list = Array.isArray(res?.data) ? res.data : [];

    // Filter by search if needed
    let filtered = list;
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      filtered = list.filter((r) => r.name?.toLowerCase().includes(q));
    }

    // Enrich with students/supervisors
    const enriched = await Promise.all(
      filtered.map(async (r) => {
        try {
          const [studentsRes, supervisorsRes] = await Promise.all([
            roomsApi.getStudents(r.id),
            roomsApi.getSupervisors(r.id),
          ]);
          return {
            ...r,
            students: studentsRes?.data || [],
            supervisors: supervisorsRes?.data || [],
          };
        } catch {
          return { ...r, students: [], supervisors: [] };
        }
      })
    );

    rooms.value = enriched;
    pagination.total = enriched.length;
    pagination.totalPages = Math.ceil(enriched.length / pagination.limit);
  } catch (e) {
    statusModal.type = "error";
    statusModal.title = "Gagal!";
    statusModal.message = e.message || "Gagal memuat data";
    statusModal.isOpen = true;
  } finally {
    loading.value = false;
  }
}

async function fetchStudents() {
  loadingStudents.value = true;
  try {
    const res = await studentsApi.getAll();
    allStudents.value = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    console.error(e);
  } finally {
    loadingStudents.value = false;
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
    modal.error = "Nama kamar wajib diisi";
    return;
  }

  saving.value = true;
  modal.error = "";

  try {
    const payload = {
      name: form.name.trim(),
      capacity: form.capacity ? parseInt(form.capacity) : undefined,
      description: form.description?.trim() || undefined,
    };

    if (modal.mode === "edit" && form.id) {
      await roomsApi.update(form.id, payload);
      statusModal.message = "Data kamar berhasil diperbarui";
    } else {
      await roomsApi.create(payload);
      statusModal.message = "Kamar baru berhasil ditambahkan";
    }

    await fetchData();
    closeModal();

    statusModal.type = "success";
    statusModal.title = "Berhasil!";
    statusModal.isOpen = true;
  } catch (e) {
    modal.error = e.message || "Gagal menyimpan";
  } finally {
    saving.value = false;
  }
}

async function deleteItem() {
  saving.value = true;
  try {
    await roomsApi.delete(confirm.item.id);
    await fetchData();
    confirmCancel();

    statusModal.type = "success";
    statusModal.title = "Berhasil!";
    statusModal.message = "Kamar berhasil dihapus";
    statusModal.isOpen = true;
  } catch (e) {
    statusModal.type = "error";
    statusModal.title = "Gagal!";
    statusModal.message = e.message || "Gagal menghapus";
    statusModal.isOpen = true;
  } finally {
    saving.value = false;
  }
}

// Students modal
async function openStudents(room) {
  studentsModal.show = true;
  studentsModal.room = room;
  studentsModal.error = "";
  studentsModal.loading = true;
  if (allStudents.value.length === 0) await fetchStudents();
  try {
    const res = await roomsApi.getStudents(room.id);
    studentsModal.students = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    studentsModal.error = e.message || "Gagal memuat";
  } finally {
    studentsModal.loading = false;
  }
}

async function addStudent(student) {
  studentsModal.error = "";
  try {
    const res = await roomsApi.assignStudent(studentsModal.room.id, student.id);

    // Check if requires confirmation to move from another room
    if (res.requiresConfirm && res.existingRoom) {
      confirmMove.show = true;
      confirmMove.student = student;
      confirmMove.existingRoom = res.existingRoom;
      return;
    }

    // Success - reload students
    const studentsRes = await roomsApi.getStudents(studentsModal.room.id);
    studentsModal.students = Array.isArray(studentsRes?.data)
      ? studentsRes.data
      : [];
    await fetchStudents(); // Refresh student data to update room labels
    await fetchData();
  } catch (e) {
    studentsModal.error = e.message || "Gagal menambahkan";
  }
}

// Confirm moving student from one room to another
async function confirmMoveStudent() {
  studentsModal.error = "";
  try {
    await roomsApi.assignStudent(
      studentsModal.room.id,
      confirmMove.student.id,
      true // force = true
    );

    // Reload students
    const studentsRes = await roomsApi.getStudents(studentsModal.room.id);
    studentsModal.students = Array.isArray(studentsRes?.data)
      ? studentsRes.data
      : [];
    await fetchStudents();
    await fetchData();

    // Reset confirm state
    confirmMove.show = false;
    confirmMove.student = null;
    confirmMove.existingRoom = null;
  } catch (e) {
    studentsModal.error = e.message || "Gagal memindahkan";
    confirmMove.show = false;
  }
}

function cancelMoveStudent() {
  confirmMove.show = false;
  confirmMove.student = null;
  confirmMove.existingRoom = null;
}

async function removeStudent(member) {
  studentsModal.error = "";
  try {
    await roomsApi.removeStudent(
      studentsModal.room.id,
      member.studentId || member.id
    );
    const res = await roomsApi.getStudents(studentsModal.room.id);
    studentsModal.students = Array.isArray(res?.data) ? res.data : [];
    await fetchStudents(); // Refresh student data to update room labels
    await fetchData();
  } catch (e) {
    studentsModal.error = e.message || "Gagal menghapus";
  }
}

function closeStudentsModal() {
  studentsModal.show = false;
  studentsModal.students = [];
}

// Supervisors modal
async function openSupervisors(room) {
  supervisorsModal.show = true;
  supervisorsModal.room = room;
  supervisorsModal.error = "";
  supervisorsModal.loading = true;
  if (allTeachers.value.length === 0) await fetchTeachers();
  try {
    const res = await roomsApi.getSupervisors(room.id);
    supervisorsModal.supervisors = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    supervisorsModal.error = e.message || "Gagal memuat";
  } finally {
    supervisorsModal.loading = false;
  }
}

async function addSupervisor(teacher) {
  supervisorsModal.error = "";
  try {
    await roomsApi.assignSupervisor(supervisorsModal.room.id, teacher.id);
    const res = await roomsApi.getSupervisors(supervisorsModal.room.id);
    supervisorsModal.supervisors = Array.isArray(res?.data) ? res.data : [];
    await fetchTeachers(); // Refresh teacher data to update room labels
    await fetchData();
  } catch (e) {
    supervisorsModal.error = e.message || "Gagal menambahkan";
  }
}

async function removeSupervisor(supervisor) {
  supervisorsModal.error = "";
  try {
    await roomsApi.removeSupervisor(
      supervisorsModal.room.id,
      supervisor.teacherId || supervisor.id
    );
    const res = await roomsApi.getSupervisors(supervisorsModal.room.id);
    supervisorsModal.supervisors = Array.isArray(res?.data) ? res.data : [];
    await fetchTeachers(); // Refresh teacher data to update room labels
    await fetchData();
  } catch (e) {
    supervisorsModal.error = e.message || "Gagal menghapus";
  }
}

function closeSupervisorsModal() {
  supervisorsModal.show = false;
  supervisorsModal.supervisors = [];
}

// Modal helpers
function openCreate() {
  modal.show = true;
  modal.mode = "create";
  modal.error = "";
  Object.assign(form, { id: null, name: "", capacity: "", description: "" });
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

onMounted(fetchData);
</script>
