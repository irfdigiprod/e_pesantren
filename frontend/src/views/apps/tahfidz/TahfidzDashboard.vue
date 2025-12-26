<template>
  <div class="max-w-7xl mx-auto pb-12">
    <!-- Header -->
    <div
      class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Mutaba'ah Tahfidz</h1>
        <p class="text-slate-500">
          Pantau perkembangan hafalan santri secara realtime
        </p>
      </div>
      <button
        @click="openInputModal"
        class="bg-[#602515] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-[#4a1c10] transition-colors"
      >
        <Icon icon="solar:add-circle-bold-duotone" />
        Input Setoran
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div
        class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4"
      >
        <div
          class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"
        >
          <Icon icon="solar:book-bookmark-bold-duotone" class="text-2xl" />
        </div>
        <div>
          <p class="text-sm text-slate-500">Santri Menghafal</p>
          <h3 class="text-2xl font-bold text-slate-800">
            {{ stats.activeStudents }}
          </h3>
        </div>
      </div>
      <div
        class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4"
      >
        <div
          class="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center"
        >
          <Icon icon="solar:check-read-bold-duotone" class="text-2xl" />
        </div>
        <div>
          <p class="text-sm text-slate-500">Total Setoran</p>
          <h3 class="text-2xl font-bold text-slate-800">
            {{ stats.totalDeposits }}
          </h3>
        </div>
      </div>
      <!-- Add more stats if needed -->
    </div>

    <!-- Main Content: List of Deposits / Progress -->
    <DataTable
      title="Riwayat Setoran Terbaru"
      description="Daftar setoran hafalan santri"
      icon="solar:history-bold-duotone"
      :columns="columns"
      :items="deposits"
      :loading="loading"
      :viewMode="viewMode"
      @update:viewMode="viewMode = $event"
    >
      <template #cell-fluency="{ item }">
        <span
          class="px-2 py-1 rounded-full text-xs font-medium"
          :class="{
            'bg-green-100 text-green-700': item.fluency === 'lancar',
            'bg-yellow-100 text-yellow-700': item.fluency === 'kurang_lancar',
            'bg-red-100 text-red-700': item.fluency === 'mengulang',
          }"
        >
          {{ formatFluency(item.fluency) }}
        </span>
      </template>

      <template #cell-type="{ item }">
        <span
          class="px-2 py-1 rounded-full text-xs font-medium"
          :class="{
            'bg-blue-50 text-blue-700 border border-blue-100':
              item.type === 'ziyadah',
            'bg-slate-50 text-slate-700 border border-slate-200':
              item.type === 'murajaah',
          }"
        >
          {{ item.type === "ziyadah" ? "Ziyadah" : "Muraja'ah" }}
        </span>
      </template>

      <template #cell-location="{ item }">
        <span class="text-slate-700 font-medium whitespace-nowrap">
          <span v-if="item.surah">{{ item.surah }}</span>
          <span v-else>Juz {{ item.juz }}</span>
          <span v-if="item.ayatStart" class="text-slate-500 text-xs ml-1">
            (Ayat {{ item.ayatStart }}-{{ item.ayatEnd }})
          </span>
        </span>
      </template>
    </DataTable>

    <!-- Input Modal -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <div
          class="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden"
        >
          <div
            class="px-6 py-4 border-b flex justify-between items-center bg-slate-50"
          >
            <h3 class="font-bold text-slate-800">Input Setoran Hafalan</h3>
            <button
              @click="showModal = false"
              class="text-slate-400 hover:text-slate-600"
            >
              <Icon icon="solar:close-circle-bold" class="text-xl" />
            </button>
          </div>

          <div class="p-6">
            <form @submit.prevent="submitDeposit" class="space-y-4">
              <!-- Student Selection via Search (Simplified using select for now, ideally async select) -->
              <div class="relative">
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Nama Santri</label
                >
                <div class="relative">
                  <span
                    class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500"
                  >
                    <Icon icon="solar:user-rounded-line-duotone" />
                  </span>
                  <input
                    type="text"
                    v-model="studentSearch"
                    @focus="showStudentDropdown = true"
                    @input="filterStudents"
                    placeholder="Ketikan nama santri..."
                    class="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                  />
                  <button
                    v-if="form.studentId"
                    @click="clearStudentSelection"
                    type="button"
                    class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-red-500"
                  >
                    <Icon icon="solar:close-circle-bold" />
                  </button>
                </div>

                <div
                  v-if="showStudentDropdown && filteredStudents.length > 0"
                  class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  <div
                    v-for="s in filteredStudents"
                    :key="s.id"
                    @click="selectStudent(s)"
                    class="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 border-b last:border-0 border-slate-50 flex flex-col"
                  >
                    <span class="font-medium">{{ s.fullName }}</span>
                    <span class="text-xs text-slate-500"
                      >NIS: {{ s.nis || "-" }} • Kelas:
                      {{ s.className || "-" }}</span
                    >
                  </div>
                </div>
                <div
                  v-if="showStudentDropdown && filteredStudents.length === 0"
                  class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-4 text-center text-sm text-slate-500"
                >
                  Tidak ada santri ditemukan
                </div>
              </div>

              <!-- Type -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1"
                    >Jenis</label
                  >
                  <select
                    v-model="form.type"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                  >
                    <option value="ziyadah">Ziyadah (Baru)</option>
                    <option value="murajaah">Muraja'ah (Ulang)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1"
                    >Kualitas</label
                  >
                  <select
                    v-model="form.fluency"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                  >
                    <option value="lancar">Lancar</option>
                    <option value="kurang_lancar">Kurang Lancar</option>
                    <option value="mengulang">Mengulang</option>
                  </select>
                </div>
              </div>

              <!-- Location -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1"
                    >Juz</label
                  >
                  <input
                    type="number"
                    v-model="form.juz"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                    placeholder="1-30"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1"
                    >Nama Surah</label
                  >
                  <input
                    type="text"
                    v-model="form.surahName"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                    placeholder="Contoh: Al-Baqarah"
                  />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1"
                    >Ayat Awal</label
                  >
                  <input
                    type="number"
                    v-model="form.ayatStart"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1"
                    >Ayat Akhir</label
                  >
                  <input
                    type="number"
                    v-model="form.ayatEnd"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Catatan</label
                >
                <textarea
                  v-model="form.notes"
                  rows="2"
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                  placeholder="Catatan ustadz..."
                ></textarea>
              </div>

              <div class="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  @click="showModal = false"
                  class="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="px-4 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1c10] disabled:opacity-50"
                >
                  {{ saving ? "Menyimpan..." : "Simpan" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import DataTable from "@/components/ui/DataTable.vue";
import { tahfidzApi, studentsApi, authApi } from "@/services/api";

const loading = ref(false);
const saving = ref(false);
const showModal = ref(false);
const viewMode = ref("table");

const stats = reactive({
  totalDeposits: 0,
  activeStudents: 0,
});

const deposits = ref([]);
const studentsList = ref([]);
const filteredStudents = ref([]);
const studentSearch = ref("");
const showStudentDropdown = ref(false);
const currentUser = ref(null);

const columns = [
  { field: "date", label: "TANGGAL", sortable: true },
  { field: "studentName", label: "NAMA SANTRI", sortable: true },
  { field: "type", label: "JENIS" },
  { field: "location", label: "HAFALAN" },
  { field: "fluency", label: "KUALITAS" },
  { field: "teacherName", label: "MUSYRIF" },
];

const form = reactive({
  studentId: "",
  type: "ziyadah",
  fluency: "lancar",
  juz: "",
  surahName: "",
  ayatStart: "",
  ayatEnd: "",
  notes: "",
});

function formatFluency(val) {
  const map = {
    lancar: "Lancar",
    kurang_lancar: "Kurang Lancar",
    mengulang: "Mengulang",
  };
  return map[val] || val;
}

async function loadData() {
  loading.value = true;
  try {
    const [statsRes, depositsRes] = await Promise.all([
      tahfidzApi.getStats(),
      tahfidzApi.getDeposits(),
    ]);

    if (statsRes.success) {
      Object.assign(stats, statsRes.data);
    }
    if (depositsRes.success) {
      deposits.value = depositsRes.data.map((d) => ({
        ...d,
        date: new Date(d.date).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function openInputModal() {
  // Load students if empty
  if (studentsList.value.length === 0) {
    try {
      const res = await studentsApi.getAll({ limit: 1000 }); // simplified
      if (res.data) {
        studentsList.value = res.data;
        filteredStudents.value = res.data;
      }
    } catch (e) {
      console.error(e);
    }
  } else {
    filteredStudents.value = studentsList.value;
  }

  // Get current user (teacher) id
  if (!currentUser.value) {
    const userRes = await authApi.getCurrentUser();
    // Assuming user has teacherId or is linked to teacher
    // For now we might need to rely on backend handling or user selection from list if admin
    // Let's assume the user IS the teacher for simplicity or fetch mapping
    // This part depends on auth implementation depth.
    // Fallback: If admin, they might need to select teacher.
    // If teacher, auto-select.
    // Logic placeholder:
    currentUser.value = userRes.data;
  }

  // Reset form
  Object.assign(form, {
    studentId: "",
    type: "ziyadah",
    fluency: "lancar",
    juz: "",
    surahName: "",
    ayatStart: "",
    ayatEnd: "",
    notes: "",
  });
  studentSearch.value = ""; // Reset search input

  showModal.value = true;
}

async function submitDeposit() {
  if (!form.studentId) {
    alert("Mohon pilih santri terlebih dahulu");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...form,
      studentId: Number(form.studentId),
      teacherId: currentUser.value?.teacher?.id || 1, // Fallback to ID 1 if not linked/admin
      juz: form.juz ? Number(form.juz) : undefined,
      surahNumber: undefined, // lookup needed if strict
      ayatStart: form.ayatStart ? Number(form.ayatStart) : undefined,
      ayatEnd: form.ayatEnd ? Number(form.ayatEnd) : undefined,
    };

    await tahfidzApi.createDeposit(payload);
    showModal.value = false;
    loadData(); // Refresh
  } catch (e) {
    alert("Gagal menyimpan: " + e.message);
  } finally {
    saving.value = false;
  }
}

// Student Search Logic
function filterStudents() {
  if (!studentSearch.value) {
    filteredStudents.value = studentsList.value;
    return;
  }
  const q = studentSearch.value.toLowerCase();
  filteredStudents.value = studentsList.value.filter(
    (s) => s.fullName.toLowerCase().includes(q) || (s.nis && s.nis.includes(q))
  );
  showStudentDropdown.value = true;
}

function selectStudent(student) {
  form.studentId = student.id;
  studentSearch.value = student.fullName;
  showStudentDropdown.value = false;
}

function clearStudentSelection() {
  form.studentId = "";
  studentSearch.value = "";
  filteredStudents.value = studentsList.value;
}

onMounted(() => {
  loadData();
});
</script>
