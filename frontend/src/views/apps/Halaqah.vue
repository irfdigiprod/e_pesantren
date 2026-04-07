<template>
  <div>
    <DataTable
      title="Halaqah"
      description="Kelola grup halaqah, anggota, dan mentor"
      icon="solar:book-2-bold-duotone"
      :items="groups"
      :columns="columns"
      :loading="loading"
      v-model:viewMode="viewMode"
      v-model:search="searchQuery"
      :pagination="pagination"
      @update:search="onSearchInput"
      @update:limit="changeLimit"
      @page-change="changePage"
    >
      <template #filters>
        <div class="flex flex-wrap items-center gap-3">
          <!-- Gender Filter -->
          <div class="w-40">
            <select
              v-model="filters.gender"
              class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#602515]"
            >
              <option value="">Semua Ikhwan/Akhwat</option>
              <option value="male">Ikhwan</option>
              <option value="female">Akhwat</option>
            </select>
          </div>

          <!-- Musyrif Filter -->
          <div class="w-48">
            <select
              v-model="filters.mentorId"
              class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#602515]"
            >
              <option value="">Semua Musyrif</option>
              <option v-for="t in allTeachers" :key="t.id" :value="t.id">
                {{ t.fullName }}
              </option>
            </select>
          </div>

          <!-- Apply Button -->
          <button
            @click="applyFilters"
            class="h-10 px-4 rounded-lg bg-[#602515] text-white text-sm font-medium hover:bg-[#4a1c10] transition-colors"
          >
            Terapkan
          </button>

          <button
            v-if="filters.gender || filters.mentorId"
            @click="resetFilters"
            class="h-10 px-4 rounded-lg bg-orange-100 text-[#602515] text-sm font-medium hover:bg-orange-200 transition-colors"
          >
            Reset
          </button>
        </div>
      </template>

      <!-- Header Actions -->
      <template #header-actions>
        <button
          @click="openCreate"
          :disabled="saving"
          class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
          style="background: #602515"
        >
          <Icon icon="solar:add-circle-line-duotone" class="text-lg" />
          <span>Tambah Halaqah</span>
        </button>
      </template>

      <!-- Cell: Name -->
      <template #cell-name="{ item }">
        <span class="font-medium text-slate-800">{{ item.name }}</span>
      </template>

      <!-- Cell: Description -->
      <template #cell-description="{ item }">
        <span class="text-slate-600 truncate max-w-xs block">{{
          item.description || "-"
        }}</span>
      </template>

      <!-- Cell: Members -->
      <template #cell-members="{ item }">
        <button
          @click="openMembers(item)"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <Icon icon="solar:users-group-rounded-bold-duotone" class="text-sm" />
          {{ getMemberCount(item) }} anggota
        </button>
      </template>

      <!-- Cell: Mentors -->
      <template #cell-mentors="{ item }">
        <button
          @click="openMentors(item)"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
        >
          <Icon icon="solar:square-academic-cap-bold-duotone" class="text-sm" />
          {{ getMentorCount(item) }} mentor
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
                  icon="solar:book-2-bold-duotone"
                  class="text-xl text-[#602515]"
                />
              </div>
              <div>
                <h3 class="font-semibold text-slate-800">{{ item.name }}</h3>
                <p class="text-xs text-slate-500 line-clamp-1">
                  {{ item.description || "Tidak ada deskripsi" }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 mb-3">
            <!-- Target Badge -->
            <div
              v-if="item.targetLevelName"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700"
            >
              <Icon icon="solar:target-bold-duotone" class="text-sm" />
              {{ item.targetLevelName }}
            </div>
            <button
              @click="openMembers(item)"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
            >
              <Icon
                icon="solar:users-group-rounded-bold-duotone"
                class="text-sm"
              />
              {{ getMemberCount(item) }} anggota
            </button>
            <button
              @click="openMentors(item)"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700"
            >
              <Icon
                icon="solar:square-academic-cap-bold-duotone"
                class="text-sm"
              />
              {{ getMentorCount(item) }} mentor
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
                  {{ modal.mode === "create" ? "Tambah" : "Edit" }} Halaqah
                </h3>
                <p class="text-xs text-slate-500">Isi data grup halaqah</p>
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

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Nama Grup <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.name"
                class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#602515]"
                placeholder="Masukkan nama grup"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Deskripsi</label
              >
              <textarea
                v-model="form.description"
                rows="3"
                class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#602515] resize-none"
                placeholder="Deskripsi grup (opsional)"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Target Hafalan (Level)
              </label>
              <select
                v-model="form.targetLevelId"
                class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#602515]"
              >
                <option value="">-- Pilih Target --</option>
                <option
                  v-for="target in allTargets"
                  :key="target.id"
                  :value="target.id"
                >
                  {{ target.level }} ({{ target.targetPages }} Hal/Bulan)
                </option>
              </select>
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

    <!-- Side-by-Side Members Modal -->
    <SideBySidePicker
      :show="membersModal.show"
      :title="`Anggota: ${membersModal.group?.name || ''}`"
      header-icon="solar:users-group-rounded-bold-duotone"
      available-title="Santri Tersedia"
      selected-title="Anggota Halaqah"
      item-label="santri"
      :available-items="availableStudents"
      :selected-items="membersModal.members"
      display-field="fullName"
      sub-field="nis"
      meta-field="halaqahLabel"
      :loading-available="loadingStudents"
      :loading-selected="membersModal.loading"
      :error="membersModal.error"
      @close="closeMembersModal"
      @add="addMember"
      @remove="removeMember"
    >
      <template #available-filter>
        <div class="mt-2 flex items-center gap-2 px-1">
          <input
            type="checkbox"
            id="show-assigned-halaqah"
            v-model="showAssignedHalaqah"
            class="w-4 h-4 text-green-600 bg-slate-100 border-slate-300 rounded focus:ring-green-500 focus:ring-2 cursor-pointer"
          />
          <label for="show-assigned-halaqah" class="text-xs text-slate-600 cursor-pointer select-none">
            Tampilkan sudah memiliki kelompok
          </label>
        </div>
      </template>
    </SideBySidePicker>

    <!-- Side-by-Side Mentors Modal -->
    <SideBySidePicker
      :show="mentorsModal.show"
      :title="`Mentor: ${mentorsModal.group?.name || ''}`"
      header-icon="solar:square-academic-cap-bold-duotone"
      available-title="Guru Tersedia"
      selected-title="Mentor Halaqah"
      item-label="guru"
      :available-items="availableMentors"
      :selected-items="mentorsModal.mentors"
      display-field="fullName"
      sub-field="nip"
      meta-field="mentorLabel"
      :loading-available="loadingTeachers"
      :loading-selected="mentorsModal.loading"
      :error="mentorsModal.error"
      @close="closeMentorsModal"
      @add="addMentor"
      @remove="removeMentor"
    />

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      :isOpen="confirm.show"
      title="Hapus Halaqah"
      :message="`Apakah Anda yakin ingin menghapus halaqah '${confirm.item?.name}'? Data yang dihapus tidak dapat dikembalikan.`"
      confirmText="Hapus"
      cancelText="Batal"
      @confirm="deleteItem"
      @cancel="confirmCancel"
    />

    <!-- Confirm Move Member Modal -->
    <ConfirmModal
      :isOpen="confirmMove.show"
      title="Pindahkan Santri?"
      :message="`Santri '${confirmMove.student?.fullName}' sudah terdaftar di halaqah '${confirmMove.existingHalaqah?.name}'. Apakah Anda ingin memindahkan ke halaqah ini?`"
      confirmText="Ya, Pindahkan"
      cancelText="Batal"
      @confirm="confirmMoveMember"
      @cancel="cancelMoveMember"
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
import {
  halaqahApi,
  studentsApi,
  teachersApi,
  tahfidzApi,
} from "@/services/api.js";
import { Icon } from "@iconify/vue";
import DataTable from "@/components/ui/DataTable.vue";
import SideBySidePicker from "@/components/ui/SideBySidePicker.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import StatusModal from "@/components/ui/StatusModal.vue";

// Columns configuration
const columns = [
  {
    field: "name",
    label: "Nama Grup",
    sortable: true,
    width: "min-w-[150px]",
  },
  {
    field: "description",
    label: "Deskripsi",
    width: "min-w-[200px]",
  },
  {
    field: "targetLevelName", // Changed from targetLevel
    label: "Target Level",
    width: "min-w-[120px]",
  },
  {
    field: "members",
    label: "Anggota",
    width: "min-w-[120px]",
  },
  {
    field: "mentors",
    label: "Mentor",
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
const groups = ref([]);
const allStudents = ref([]);
const allTeachers = ref([]);
const allTargets = ref([]); // New state
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
const form = reactive({
  id: null,
  name: "",
  description: "",
  targetLevelId: "",
}); // Add targetLevelId
const confirm = reactive({ show: false, item: null });

const membersModal = reactive({
  show: false,
  group: null,
  members: [],
  loading: false,
  error: "",
});

const mentorsModal = reactive({
  show: false,
  group: null,
  mentors: [],
  loading: false,
  error: "",
});

// State for confirming move between halaqahs
const confirmMove = reactive({
  show: false,
  student: null,
  existingHalaqah: null,
});

const showAssignedHalaqah = ref(false);

// Computed: Available students with halaqah info
const availableStudents = computed(() => {
  const memberIds = membersModal.members.map((s) => s.studentId || s.id);
  
  let students = allStudents.value.filter((s) => !memberIds.includes(s.id));
  
  if (!showAssignedHalaqah.value) {
    students = students.filter((s) => !(s.halaqah?.name || s.group?.name));
  }
  
  return students.map((s) => {
      const groupName = s.halaqah?.name || s.group?.name;
      return {
        ...s,
        halaqahLabel: groupName ? `Halaqah: ${groupName}` : null,
      };
    });
});

// Computed: Available mentors
const availableMentors = computed(() => {
  const mentorIds = mentorsModal.mentors.map((t) => t.teacherId || t.id);
  return allTeachers.value
    .filter((t) => !mentorIds.includes(t.id))
    .map((t) => {
      const groupName = t.halaqah?.name || t.group?.name; // if they mentor a group
      return {
        ...t,
        mentorLabel: groupName ? `Mentor: ${groupName}` : null,
      };
    });
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
const filters = reactive({
  mentorId: "",
  gender: "",
});

function applyFilters() {
  pagination.page = 1;
  fetchData();
}

function resetFilters() {
  filters.mentorId = "";
  filters.gender = "";
  applyFilters();
}

// Data fetching
async function fetchData() {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchQuery.value,
      mentorId: filters.mentorId || undefined,
      gender: filters.gender || undefined,
    };

    const res = await halaqahApi.getAll(params);
    const list = Array.isArray(res?.data) ? res.data : [];

    // Search is handled by backend now, but for safety/fallback if api doesn't support search yet (it does)
    let filtered = list;

    // Enrich with member/mentor counts
    const enriched = await Promise.all(
      filtered.map(async (h) => {
        try {
          const [membersRes, mentorsRes] = await Promise.all([
            halaqahApi.getMembers(h.id),
            halaqahApi.getMentors(h.id),
          ]);
          return {
            ...h,
            members: membersRes?.data || [],
            mentors: mentorsRes?.data || [],
          };
        } catch {
          return { ...h, members: [], mentors: [] };
        }
      }),
    );

    groups.value = enriched;
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

function getMemberCount(h) {
  return h.memberCount ?? h._count?.members ?? h.members?.length ?? 0;
}

function getMentorCount(h) {
  return h.mentorCount ?? h._count?.mentors ?? h.mentors?.length ?? 0;
}

async function fetchStudents() {
  loadingStudents.value = true;
  try {
    const res = await studentsApi.getAll({ limit: 0 });
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
    modal.error = "Nama grup wajib diisi";
    return;
  }

  saving.value = true;
  modal.error = "";

  try {
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || undefined,
      targetLevelId: form.targetLevelId
        ? Number(form.targetLevelId)
        : undefined,
    };

    if (modal.mode === "edit" && form.id) {
      await halaqahApi.update(form.id, payload);
      statusModal.message = "Data halaqah berhasil diperbarui";
    } else {
      await halaqahApi.create(payload);
      statusModal.message = "Halaqah baru berhasil ditambahkan";
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
    await halaqahApi.delete(confirm.item.id);
    await fetchData();
    confirmCancel();

    statusModal.type = "success";
    statusModal.title = "Berhasil!";
    statusModal.message = "Halaqah berhasil dihapus";
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

// Members modal
async function openMembers(group) {
  membersModal.show = true;
  membersModal.group = group;
  membersModal.error = "";
  membersModal.loading = true;
  if (allStudents.value.length === 0) await fetchStudents();
  try {
    const res = await halaqahApi.getMembers(group.id);
    membersModal.members = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    membersModal.error = e.message || "Gagal memuat";
  } finally {
    membersModal.loading = false;
  }
}

async function addMember(student) {
  membersModal.error = "";
  try {
    const res = await halaqahApi.addMember(membersModal.group.id, student.id);

    // Check if requires confirmation to move from another halaqah
    if (res.requiresConfirm && res.existingHalaqah) {
      confirmMove.show = true;
      confirmMove.student = student;
      confirmMove.existingHalaqah = res.existingHalaqah;
      return;
    }

    // Success - reload members
    const membersRes = await halaqahApi.getMembers(membersModal.group.id);
    membersModal.members = Array.isArray(membersRes?.data)
      ? membersRes.data
      : [];
    await fetchStudents(); // Refresh student data to update halaqah labels
    await fetchData();
  } catch (e) {
    membersModal.error = e.message || "Gagal menambahkan";
  }
}

// Confirm moving student from one halaqah to another
async function confirmMoveMember() {
  membersModal.error = "";
  try {
    await halaqahApi.addMember(
      membersModal.group.id,
      confirmMove.student.id,
      true, // force = true
    );

    // Reload members
    const membersRes = await halaqahApi.getMembers(membersModal.group.id);
    membersModal.members = Array.isArray(membersRes?.data)
      ? membersRes.data
      : [];
    await fetchStudents();
    await fetchData();

    // Reset confirm state
    confirmMove.show = false;
    confirmMove.student = null;
    confirmMove.existingHalaqah = null;
  } catch (e) {
    membersModal.error = e.message || "Gagal memindahkan";
    confirmMove.show = false;
  }
}

function cancelMoveMember() {
  confirmMove.show = false;
  confirmMove.student = null;
  confirmMove.existingHalaqah = null;
}

async function removeMember(member) {
  membersModal.error = "";
  try {
    await halaqahApi.removeMember(
      membersModal.group.id,
      member.studentId || member.id,
    );
    const res = await halaqahApi.getMembers(membersModal.group.id);
    membersModal.members = Array.isArray(res?.data) ? res.data : [];
    await fetchStudents(); // Refresh student data to update halaqah labels
    await fetchData();
  } catch (e) {
    membersModal.error = e.message || "Gagal menghapus";
  }
}

function closeMembersModal() {
  membersModal.show = false;
  membersModal.members = [];
}

// Mentors modal
async function openMentors(group) {
  mentorsModal.show = true;
  mentorsModal.group = group;
  mentorsModal.error = "";
  mentorsModal.loading = true;
  if (allTeachers.value.length === 0) await fetchTeachers();
  try {
    const res = await halaqahApi.getMentors(group.id);
    mentorsModal.mentors = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    mentorsModal.error = e.message || "Gagal memuat";
  } finally {
    mentorsModal.loading = false;
  }
}

async function addMentor(teacher) {
  mentorsModal.error = "";
  try {
    await halaqahApi.addMentor(mentorsModal.group.id, teacher.id);
    const res = await halaqahApi.getMentors(mentorsModal.group.id);
    mentorsModal.mentors = Array.isArray(res?.data) ? res.data : [];
    await fetchTeachers(); // Refresh teacher data to update mentor labels
    await fetchData();
  } catch (e) {
    mentorsModal.error = e.message || "Gagal menambahkan";
  }
}

async function removeMentor(mentor) {
  mentorsModal.error = "";
  try {
    await halaqahApi.removeMentor(
      mentorsModal.group.id,
      mentor.teacherId || mentor.id,
    );
    const res = await halaqahApi.getMentors(mentorsModal.group.id);
    mentorsModal.mentors = Array.isArray(res?.data) ? res.data : [];
    await fetchTeachers(); // Refresh teacher data to update mentor labels
    await fetchData();
  } catch (e) {
    mentorsModal.error = e.message || "Gagal menghapus";
  }
}

function closeMentorsModal() {
  mentorsModal.show = false;
  mentorsModal.mentors = [];
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
    targetLevelId: "",
  });
}

function openEdit(item) {
  modal.show = true;
  modal.mode = "edit";
  modal.error = "";
  Object.assign(form, {
    ...item,
    targetLevelId: item.targetLevelId || "",
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

async function fetchTargets() {
  try {
    const res = await tahfidzApi.getTargets();
    allTargets.value = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    console.error("Failed to load targets", e);
  }
}

onMounted(() => {
  fetchData();
  fetchTargets();
  fetchTeachers(); // Was in original
});
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
