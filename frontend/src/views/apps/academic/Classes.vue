<template>
  <div>
    <DataTable
      title="Kelas / Rombel"
      description="Kelola data kelas dan anggota rombel"
      icon="solar:square-academic-cap-bold-duotone"
      :items="classes"
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
          <span>Tambah Kelas</span>
        </button>
      </template>

      <!-- Cell: Name -->
      <template #cell-name="{ item }">
        <span class="font-medium text-slate-800">{{ item.name }}</span>
      </template>

      <!-- Cell: Grade -->
      <template #cell-grade="{ item }">
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700"
        >
          Kelas {{ item.grade }}
        </span>
      </template>

      <!-- Cell: Academic Year -->
      <template #cell-academicYear="{ item }">
        <span class="text-slate-600">{{ item.academicYear || "-" }}</span>
      </template>

      <!-- Cell: Homeroom Teacher -->
      <template #cell-homeroomTeacher="{ item }">
        <button
          @click="openHomeroomTeachers(item)"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
        >
          <Icon icon="solar:square-academic-cap-bold-duotone" class="text-sm" />
          {{ item.homeroomTeachers?.length || 0 }} wali kelas
        </button>
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
                class="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"
              >
                <Icon
                  icon="solar:square-academic-cap-bold-duotone"
                  class="text-xl text-purple-600"
                />
              </div>
              <div>
                <h3 class="font-semibold text-slate-800">{{ item.name }}</h3>
                <div class="flex items-center gap-2 mt-0.5">
                  <span
                    class="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium"
                  >
                    Kelas {{ item.grade }}
                  </span>
                  <span class="text-xs text-slate-500">{{
                    item.academicYear
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-2 mb-3 text-sm">
            <div class="flex items-center gap-2 text-slate-600">
              <Icon
                icon="solar:square-academic-cap-line-duotone"
                class="text-slate-400"
              />
              <span class="text-slate-400">Wali:</span>
              <span>{{ item.homeRoomTeacher?.fullName || "-" }}</span>
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
                class="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"
              >
                <Icon
                  :icon="
                    modal.mode === 'create'
                      ? 'solar:add-circle-bold-duotone'
                      : 'solar:pen-2-bold-duotone'
                  "
                  class="text-xl text-purple-600"
                />
              </div>
              <div>
                <h3 class="font-semibold text-slate-800">
                  {{ modal.mode === "create" ? "Tambah" : "Edit" }} Kelas
                </h3>
                <p class="text-xs text-slate-500">Isi data kelas/rombel</p>
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
                  Nama Kelas <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.name"
                  class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                  placeholder="Contoh: 7A"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  Tingkat <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="form.grade"
                  class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="">Pilih Tingkat</option>
                  <option
                    v-for="g in [7, 8, 9, 10, 11, 12]"
                    :key="g"
                    :value="g"
                  >
                    Kelas {{ g }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  Tahun Ajaran <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.academicYear"
                  class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                  placeholder="2024/2025"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Wali Kelas</label
                >
                <select
                  v-model.number="form.homeroomTeacherId"
                  class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                >
                  <option :value="null">Pilih Wali Kelas</option>
                  <option v-for="t in allTeachers" :key="t.id" :value="t.id">
                    {{ t.fullName }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Kapasitas</label
                >
                <input
                  v-model="form.capacity"
                  type="number"
                  class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                  placeholder="Contoh: 30"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Deskripsi</label
                >
                <input
                  v-model="form.description"
                  class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                  placeholder="Deskripsi (opsional)"
                />
              </div>
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
              class="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
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
      :title="`Anggota: ${studentsModal.classItem?.name || ''}`"
      header-icon="solar:users-group-rounded-bold-duotone"
      available-title="Santri Tersedia"
      selected-title="Anggota Kelas"
      item-label="santri"
      :available-items="availableStudents"
      :selected-items="studentsModal.students"
      display-field="fullName"
      sub-field="nis"
      meta-field="classLabel"
      :loading-available="loadingStudents"
      :loading-selected="studentsModal.loading"
      :error="studentsModal.error"
      @close="closeStudentsModal"
      @add="addStudent"
      @remove="removeStudent"
    />

    <!-- Side-by-Side Homeroom Teachers Modal -->
    <SideBySidePicker
      :show="homeroomModal.show"
      title="Pilih Wali Kelas"
      header-icon="solar:user-id-bold-duotone"
      available-title="Guru Tersedia"
      selected-title="Wali Kelas Terpilih"
      item-label="guru"
      :available-items="availableTeachers"
      :selected-items="homeroomModal.teachers"
      display-field="fullName"
      sub-field="nip"
      meta-field="roleLabel"
      :loading-available="loadingTeachers"
      :loading-selected="homeroomModal.loading"
      :error="homeroomModal.error"
      @close="closeHomeroomModal"
      @add="addHomeroomTeacher"
      @remove="removeHomeroomTeacher"
    />

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      :isOpen="confirm.show"
      title="Hapus Kelas"
      :message="`Apakah Anda yakin ingin menghapus kelas '${confirm.item?.name}'? Data yang dihapus tidak dapat dikembalikan.`"
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
import { academicApi, studentsApi, teachersApi } from "@/services/api.js";
import { Icon } from "@iconify/vue";
import DataTable from "@/components/ui/DataTable.vue";
import SideBySidePicker from "@/components/ui/SideBySidePicker.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import StatusModal from "@/components/ui/StatusModal.vue";

// Columns configuration
const columns = [
  {
    field: "name",
    label: "Nama Kelas",
    sortable: true,
    width: "min-w-[120px]",
  },
  {
    field: "grade",
    label: "Tingkat",
    width: "min-w-[100px]",
  },
  {
    field: "academicYear",
    label: "Tahun Ajaran",
    width: "min-w-[120px]",
  },
  {
    field: "homeroomTeacher",
    label: "Wali Kelas",
    width: "min-w-[150px]",
  },
  {
    field: "students",
    label: "Anggota",
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
const classes = ref([]);
const allStudents = ref([]);
const allTeachers = ref([]);
const loading = ref(false);
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
const form = reactive({
  id: null,
  name: "",
  grade: "",
  academicYear: "",
  homeroomTeacherId: "",
  capacity: "",
  description: "",
});
const confirm = reactive({ show: false, item: null });

const studentsModal = reactive({
  show: false,
  classItem: null,
  students: [],
  loading: false,
  error: "",
});

const statusModal = reactive({
  isOpen: false,
  type: "success",
  title: "",
  message: "",
});

const homeroomModal = reactive({
  show: false,
  classItem: null,
  teachers: [],
  loading: false,
  error: "",
});

// Computed: Available students with class info
const availableStudents = computed(() => {
  const memberIds = studentsModal.students.map((s) => s.studentId || s.id);
  return allStudents.value
    .filter((s) => !memberIds.includes(s.id))
    .map((s) => {
      const className = s.class?.name;
      return {
        ...s,
        classLabel: className ? `Kelas: ${className}` : null,
      };
    });
});

// Computed: Available teachers with homeroom info
const availableTeachers = computed(() => {
  const selectedIds = homeroomModal.teachers.map((t) => t.id);
  return allTeachers.value
    .filter((t) => !selectedIds.includes(t.id))
    .map((t) => {
      const className = t.class?.name; // Assuming teacher object has class relation if they are homeroom
      return {
        ...t,
        roleLabel: className ? `Wali Kelas: ${className}` : null,
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
    const res = await academicApi.getClasses();
    let list = Array.isArray(res?.data) ? res.data : [];

    // Filter by search if needed
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      list = list.filter((c) => c.name?.toLowerCase().includes(q));
    }

    classes.value = list;
    pagination.total = list.length;
    pagination.totalPages = Math.ceil(list.length / pagination.limit);
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
  // Validation
  if (!form.name?.trim()) {
    modal.error = "Nama kelas wajib diisi";
    return;
  }
  if (!form.grade) {
    modal.error = "Tingkat wajib diisi";
    return;
  }
  if (!form.academicYear?.trim()) {
    modal.error = "Tahun ajaran wajib diisi";
    return;
  }

  saving.value = true;
  modal.error = "";

  try {
    const payload = {
      name: form.name.trim(),
      grade: parseInt(form.grade),
      academicYear: form.academicYear.trim(),
    };
    if (form.homeroomTeacherId)
      payload.homeroomTeacherId = parseInt(form.homeroomTeacherId);
    if (form.capacity) payload.capacity = parseInt(form.capacity);
    if (form.description) payload.description = form.description.trim();

    if (modal.mode === "edit" && form.id) {
      await academicApi.updateClass(form.id, payload);
      statusModal.message = "Data kelas berhasil diperbarui";
    } else {
      await academicApi.createClass(payload);
      statusModal.message = "Kelas baru berhasil ditambahkan";
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
    await academicApi.deleteClass(confirm.item.id);
    await fetchData();
    confirmCancel();

    statusModal.type = "success";
    statusModal.title = "Berhasil!";
    statusModal.message = "Kelas berhasil dihapus";
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
async function openStudents(classItem) {
  studentsModal.show = true;
  studentsModal.classItem = classItem;
  studentsModal.error = "";
  studentsModal.loading = true;

  if (allStudents.value.length === 0) {
    await fetchStudents();
  }

  try {
    const res = await academicApi.getClass(classItem.id);
    studentsModal.students = Array.isArray(res?.data?.students)
      ? res.data.students
      : [];
  } catch (e) {
    studentsModal.error = e.message || "Gagal memuat";
  } finally {
    studentsModal.loading = false;
  }
}

async function addStudent(student) {
  studentsModal.error = "";
  try {
    await studentsApi.update(student.id, {
      classId: studentsModal.classItem.id,
    });
    await fetchStudents();
    const res = await academicApi.getClass(studentsModal.classItem.id);
    studentsModal.students = Array.isArray(res?.data?.students)
      ? res.data.students
      : [];
    await fetchData();
  } catch (e) {
    studentsModal.error = e.message || "Gagal menambahkan";
  }
}

async function removeStudent(student) {
  studentsModal.error = "";
  try {
    await studentsApi.update(student.id, { classId: null });
    await fetchStudents();
    const res = await academicApi.getClass(studentsModal.classItem.id);
    studentsModal.students = Array.isArray(res?.data?.students)
      ? res.data.students
      : [];
    await fetchData();
  } catch (e) {
    studentsModal.error = e.message || "Gagal menghapus";
  }
}

function closeStudentsModal() {
  studentsModal.show = false;
  studentsModal.students = [];
}

// Homeroom teachers modal
async function openHomeroomTeachers(classItem) {
  homeroomModal.show = true;
  homeroomModal.classItem = classItem;
  homeroomModal.error = "";
  homeroomModal.loading = true;

  if (allTeachers.value.length === 0) {
    await fetchTeachers();
  }

  try {
    const res = await academicApi.getHomeroomTeachers(classItem.id);
    homeroomModal.teachers = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    homeroomModal.error = e.message || "Gagal memuat";
  } finally {
    homeroomModal.loading = false;
  }
}

async function addHomeroomTeacher(teacher) {
  homeroomModal.error = "";
  try {
    await academicApi.addHomeroomTeacher(
      homeroomModal.classItem.id,
      teacher.id
    );
    const res = await academicApi.getHomeroomTeachers(
      homeroomModal.classItem.id
    );
    homeroomModal.teachers = Array.isArray(res?.data) ? res.data : [];
    await fetchData();
  } catch (e) {
    homeroomModal.error = e.message || "Gagal menambahkan";
  }
}

async function removeHomeroomTeacher(teacher) {
  homeroomModal.error = "";
  try {
    await academicApi.removeHomeroomTeacher(
      homeroomModal.classItem.id,
      teacher.teacherId || teacher.id
    );
    const res = await academicApi.getHomeroomTeachers(
      homeroomModal.classItem.id
    );
    homeroomModal.teachers = Array.isArray(res?.data) ? res.data : [];
    await fetchData();
  } catch (e) {
    homeroomModal.error = e.message || "Gagal menghapus";
  }
}

function closeHomeroomModal() {
  homeroomModal.show = false;
  homeroomModal.teachers = [];
}

// Modal helpers
function openCreate() {
  modal.show = true;
  modal.mode = "create";
  modal.error = "";
  Object.assign(form, {
    id: null,
    name: "",
    grade: "",
    academicYear: "",
    homeroomTeacherId: null,
    capacity: "",
    description: "",
  });
  // Fetch teachers for dropdown if needed
  if (allTeachers.value.length === 0) fetchTeachers();
}

function openEdit(item) {
  modal.show = true;
  modal.mode = "edit";
  modal.error = "";
  Object.assign(form, {
    ...item,
    homeroomTeacherId: item.homeroomTeacherId || item.homeRoomTeacherId || null,
  });
  // Fetch teachers for dropdown if needed
  if (allTeachers.value.length === 0) fetchTeachers();
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
