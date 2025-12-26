<template>
  <div class="max-w-7xl mx-auto pb-12">
    <!-- Header -->
    <div
      class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Ujian Tahfidz</h1>
        <p class="text-slate-500">
          Kelola jadwal dan penilaian ujian tahfidz santri
        </p>
      </div>
      <button
        @click="openModal"
        class="bg-[#602515] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-[#4a1c10] transition-colors"
      >
        <Icon icon="solar:diploma-add-bold-duotone" />
        Input Nilai Ujian
      </button>
    </div>

    <!-- Exam History Table -->
    <DataTable
      title="Riwayat Ujian"
      description="Daftar hasil ujian tahfidz yang telah dilaksanakan"
      icon="solar:diploma-verified-bold-duotone"
      :columns="columns"
      :items="exams"
      :loading="loading"
      :viewMode="viewMode"
      @update:viewMode="viewMode = $event"
    >
      <template #cell-finalScore="{ item }">
        <span class="font-bold" :class="getScoreColor(item.finalScore)">
          {{ item.finalScore }}
        </span>
      </template>

      <template #cell-verdict="{ item }">
        <span
          class="px-2 py-1 rounded-full text-xs font-medium uppercase"
          :class="{
            'bg-green-100 text-green-700': item.verdict === 'pass',
            'bg-red-100 text-red-700': item.verdict === 'fail',
            'bg-orange-100 text-orange-700': item.verdict === 'conditional',
          }"
        >
          {{ formatVerdict(item.verdict) }}
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
          class="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          <div
            class="px-6 py-4 border-b flex justify-between items-center bg-slate-50"
          >
            <h3 class="font-bold text-slate-800">Input Nilai Ujian</h3>
            <button
              @click="closeModal"
              class="text-slate-400 hover:text-slate-600"
            >
              <Icon icon="solar:close-circle-bold" class="text-xl" />
            </button>
          </div>

          <div class="p-6">
            <form @submit.prevent="submitExam" class="space-y-6">
              <!-- Info Dasar -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="relative">
                  <label class="block text-sm font-medium text-slate-700 mb-1"
                    >Nama Santri</label
                  >
                  <div class="relative">
                    <input
                      type="text"
                      v-model="studentSearch"
                      @focus="showStudentDropdown = true"
                      @input="filterStudents"
                      placeholder="Cari santri..."
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
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
                      class="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 flex flex-col"
                    >
                      <span class="font-medium">{{ s.fullName }}</span>
                      <span class="text-xs text-slate-500"
                        >NIS: {{ s.nis || "-" }}</span
                      >
                    </div>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1"
                    >Tanggal Ujian</label
                  >
                  <input
                    type="date"
                    v-model="form.examDate"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1"
                    >Jenis Ujian</label
                  >
                  <input
                    type="text"
                    v-model="form.examType"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                    placeholder="Contoh: Ujian Juz 30, Semester 1"
                    required
                  />
                </div>
                <div class="relative">
                  <label class="block text-sm font-medium text-slate-700 mb-1"
                    >Penguji</label
                  >
                  <div class="relative">
                    <input
                      type="text"
                      v-model="examinerSearch"
                      @focus="showExaminerDropdown = true"
                      @input="filterExaminers"
                      placeholder="Cari penguji..."
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                    />
                    <button
                      v-if="form.examinerId"
                      @click="clearExaminerSelection"
                      type="button"
                      class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-red-500"
                    >
                      <Icon icon="solar:close-circle-bold" />
                    </button>
                  </div>
                  <div
                    v-if="showExaminerDropdown && filteredExaminers.length > 0"
                    class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    <div
                      v-for="t in filteredExaminers"
                      :key="t.id"
                      @click="selectExaminer(t)"
                      class="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 flex flex-col"
                    >
                      <span class="font-medium">{{ t.fullName }}</span>
                      <span class="text-xs text-slate-500"
                        >NIP: {{ t.nip || "-" }}</span
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- Penilaian -->
              <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4
                  class="font-semibold text-slate-700 mb-3 flex items-center gap-2"
                >
                  <Icon icon="solar:clipboard-check-line-duotone" /> Komponen
                  Penilaian (0-100)
                </h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-slate-500 mb-1"
                      >Kelancaran</label
                    >
                    <input
                      type="number"
                      v-model="form.scoreFluency"
                      min="0"
                      max="100"
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none text-center"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-500 mb-1"
                      >Tajwid</label
                    >
                    <input
                      type="number"
                      v-model="form.scoreTajwid"
                      min="0"
                      max="100"
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none text-center"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-500 mb-1"
                      >Makhraj</label
                    >
                    <input
                      type="number"
                      v-model="form.scoreMakhraj"
                      min="0"
                      max="100"
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none text-center"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-500 mb-1"
                      >Adab</label
                    >
                    <input
                      type="number"
                      v-model="form.scoreAdab"
                      min="0"
                      max="100"
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none text-center"
                    />
                  </div>
                </div>

                <!-- Kalkulator Nilai Akhir Otomatis -->
                <div
                  class="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center"
                >
                  <span class="text-sm font-semibold text-slate-600"
                    >Nilai Akhir (Rata-rata):</span
                  >
                  <span
                    class="text-2xl font-bold"
                    :class="getScoreColor(calculatedFinalScore)"
                    >{{ calculatedFinalScore }}</span
                  >
                </div>
              </div>

              <!-- Keputusan -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1"
                    >Keputusan</label
                  >
                  <select
                    v-model="form.verdict"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                  >
                    <option value="pass">LULUS</option>
                    <option value="conditional">LULUS BERSYARAT</option>
                    <option value="fail">TIDAK LULUS</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1"
                    >Catatan</label
                  >
                  <textarea
                    v-model="form.notes"
                    rows="1"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                  ></textarea>
                </div>
              </div>

              <div class="pt-4 flex justify-end gap-2 border-t mt-4">
                <button
                  type="button"
                  @click="closeModal"
                  class="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="px-4 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1c10] disabled:opacity-50"
                >
                  {{ saving ? "Menyimpan..." : "Simpan Nilai" }}
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
import { ref, reactive, computed, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import DataTable from "@/components/ui/DataTable.vue";
import { tahfidzApi, studentsApi, teachersApi, authApi } from "@/services/api";

const loading = ref(false);
const saving = ref(false);
const showModal = ref(false);
const viewMode = ref("table");

const exams = ref([]);
const studentsList = ref([]);
const teachersList = ref([]);
const filteredStudents = ref([]);
const studentSearch = ref("");
const showStudentDropdown = ref(false);

const filteredExaminers = ref([]);
const examinerSearch = ref("");
const showExaminerDropdown = ref(false);

const columns = [
  { field: "date", label: "TANGGAL", sortable: true },
  { field: "type", label: "UJIAN" },
  { field: "studentName", label: "SANTRI", sortable: true },
  { field: "finalScore", label: "NILAI" },
  { field: "verdict", label: "HASIL" },
  { field: "examinerName", label: "PENGUJI" },
];

const form = reactive({
  studentId: "",
  examinerId: "",
  examDate: new Date().toISOString().split("T")[0],
  examType: "",
  scoreFluency: 0,
  scoreTajwid: 0,
  scoreMakhraj: 0,
  scoreAdab: 0,
  verdict: "pass",
  notes: "",
});

// Auto calculate final score (average)
const calculatedFinalScore = computed(() => {
  const total =
    Number(form.scoreFluency) +
    Number(form.scoreTajwid) +
    Number(form.scoreMakhraj) +
    Number(form.scoreAdab);
  return Math.round(total / 4);
});

function getScoreColor(score) {
  if (score >= 90) return "text-emerald-600";
  if (score >= 75) return "text-blue-600";
  if (score >= 60) return "text-orange-600";
  return "text-red-600";
}

function formatVerdict(val) {
  const map = {
    pass: "LULUS",
    fail: "TIDAK LULUS",
    conditional: "LULUS BERSYARAT",
  };
  return map[val] || val;
}

async function loadData() {
  loading.value = true;
  try {
    const res = await tahfidzApi.getExams();
    if (res.success) {
      exams.value = res.data.map((d) => ({
        ...d,
        date: new Date(d.date).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      }));
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
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

// Examiner Search Logic
function filterExaminers() {
  if (!examinerSearch.value) {
    filteredExaminers.value = teachersList.value;
    return;
  }
  const q = examinerSearch.value.toLowerCase();
  filteredExaminers.value = teachersList.value.filter(
    (t) => t.fullName.toLowerCase().includes(q) || (t.nip && t.nip.includes(q))
  );
  showExaminerDropdown.value = true;
}

function selectExaminer(teacher) {
  form.examinerId = teacher.id;
  examinerSearch.value = teacher.fullName;
  showExaminerDropdown.value = false;
}

function clearExaminerSelection() {
  form.examinerId = "";
  examinerSearch.value = "";
  filteredExaminers.value = teachersList.value;
}

async function openModal() {
  try {
    // Load dependencies if needed
    if (studentsList.value.length === 0) {
      const sRes = await studentsApi.getAll({ limit: 1000 });
      if (sRes.data) {
        studentsList.value = sRes.data;
        filteredStudents.value = sRes.data;
      }
    } else {
      filteredStudents.value = studentsList.value;
    }
    if (teachersList.value.length === 0) {
      const tRes = await teachersApi.getAll({ limit: 1000 });
      if (tRes.data) {
        teachersList.value = tRes.data;
        filteredExaminers.value = tRes.data;
      }
    } else {
      filteredExaminers.value = teachersList.value;
    }

    // Default examiner to current user if teacher
    const userRes = await authApi.getCurrentUser();
    // Simple logic: if user name matches a teacher, preselect (improvements possible)
    // For now just default to first or let user pick
  } catch (e) {
    console.error(e);
  }

  form.studentId = "";
  form.examType = "";
  form.scoreFluency = 80;
  form.scoreTajwid = 80;
  form.scoreMakhraj = 80;
  form.scoreAdab = 90;
  form.verdict = "pass";
  form.notes = "";
  form.notes = "";
  studentSearch.value = ""; // Reset search input
  examinerSearch.value = ""; // Reset examiner search

  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function submitExam() {
  if (!form.studentId) {
    alert("Mohon pilih santri terlebih dahulu");
    return;
  }
  if (!form.examinerId) {
    alert("Mohon pilih penguji terlebih dahulu");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...form,
      studentId: Number(form.studentId),
      examinerId: Number(form.examinerId),
      finalScore: calculatedFinalScore.value,
    };

    await tahfidzApi.createExam(payload);
    showModal.value = false;
    loadData();
  } catch (e) {
    alert("Gagal menyimpan: " + e.message);
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>
