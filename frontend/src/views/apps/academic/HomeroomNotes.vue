<template>
  <div class="p-2 max-w-7xl mx-auto pb-12">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Catatan Wali Kelas</h1>
      <p class="text-slate-500 text-sm mt-1">
        Input kehadiran dan catatan untuk setiap siswa per semester
      </p>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Class Select -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">
            Kelas
          </label>
          <select
            v-model="selectedClassId"
            @change="loadStudents"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
          >
            <option value="">Pilih Kelas</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>

        <!-- Semester -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">
            Semester
          </label>
          <select
            v-model="selectedSemester"
            @change="loadStudents"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
          >
            <option v-for="s in semesters" :key="s.id" :value="s.id">
              {{ s.name }}{{ s.isActive ? " (Aktif)" : "" }}
            </option>
          </select>
        </div>

        <!-- Academic Year -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">
            Tahun Ajaran
          </label>
          <select
            v-model="selectedYear"
            @change="loadStudents"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
          >
            <option v-for="y in academicYears" :key="y.year" :value="y.year">
              {{ y.year }}{{ y.isActive ? " (Aktif)" : "" }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="h-64 flex items-center justify-center bg-white rounded-xl border border-slate-200"
    >
      <span class="text-slate-500 animate-pulse">Memuat data...</span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!selectedClassId"
      class="h-64 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 text-slate-400"
    >
      <Icon
        icon="solar:users-group-rounded-line-duotone"
        class="text-4xl mb-2"
      />
      <p>Pilih kelas untuk melihat daftar siswa</p>
    </div>

    <!-- Student Table -->
    <div
      v-else
      class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div class="p-4 border-b flex justify-between items-center">
        <h3 class="font-semibold text-slate-800">
          Daftar Siswa ({{ students.length }})
        </h3>
        <button
          @click="saveAll"
          :disabled="saving"
          class="px-4 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1c10] disabled:opacity-50 flex items-center gap-2"
        >
          <Icon v-if="saving" icon="svg-spinners:ring-resize" />
          <Icon v-else icon="solar:diskette-bold" />
          Simpan Semua
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-600">
            <tr>
              <th class="p-3 text-left font-medium">No</th>
              <th class="p-3 text-left font-medium">NIS</th>
              <th class="p-3 text-left font-medium">Nama Siswa</th>
              <th class="p-3 text-center font-medium w-24">Sakit</th>
              <th class="p-3 text-center font-medium w-24">Izin</th>
              <th class="p-3 text-center font-medium w-24">Alpa</th>
              <th class="p-3 text-left font-medium">Catatan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(student, idx) in students"
              :key="student.studentId"
              class="hover:bg-slate-50"
            >
              <td class="p-3 text-slate-600">{{ idx + 1 }}</td>
              <td class="p-3 text-slate-600">{{ student.nis || "-" }}</td>
              <td class="p-3">
                <div class="font-medium text-slate-800">
                  {{ student.fullName }}
                </div>
                <div
                  v-if="student.fullNameAr"
                  class="text-xs text-slate-500"
                  dir="rtl"
                >
                  {{ student.fullNameAr }}
                </div>
              </td>
              <td class="p-3">
                <input
                  v-model.number="student.sickDays"
                  type="number"
                  min="0"
                  class="w-full px-2 py-1 border rounded text-center"
                />
              </td>
              <td class="p-3">
                <input
                  v-model.number="student.permissionDays"
                  type="number"
                  min="0"
                  class="w-full px-2 py-1 border rounded text-center"
                />
              </td>
              <td class="p-3">
                <input
                  v-model.number="student.absentDays"
                  type="number"
                  min="0"
                  class="w-full px-2 py-1 border rounded text-center"
                />
              </td>
              <td class="p-3">
                <input
                  v-model="student.teacherNotes"
                  type="text"
                  placeholder="Catatan..."
                  class="w-full px-2 py-1 border rounded"
                />
              </td>
            </tr>
            <tr v-if="!students.length">
              <td colspan="7" class="p-6 text-center text-slate-500 italic">
                Tidak ada siswa di kelas ini
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Status Modal -->
    <StatusModal
      :isOpen="showStatusModal"
      :title="statusTitle"
      :message="statusMessage"
      :type="statusType"
      @close="showStatusModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import {
  academicApi,
  academicSettingsApi,
  homeroomNotesApi,
} from "@/services/api";
import StatusModal from "@/components/ui/StatusModal.vue";

const loading = ref(false);
const saving = ref(false);

// Filters
const classes = ref([]);
const semesters = ref([]);
const academicYears = ref([]);
const selectedClassId = ref("");
const selectedSemester = ref("1");
const selectedYear = ref("");

// Data
const students = ref([]);

// Modal
const showStatusModal = ref(false);
const statusTitle = ref("");
const statusMessage = ref("");
const statusType = ref("success");

function showStatus(title, message, type = "success") {
  statusTitle.value = title;
  statusMessage.value = message;
  statusType.value = type;
  showStatusModal.value = true;
}

async function loadFilters() {
  try {
    const [classRes, semesterRes, yearRes] = await Promise.all([
      academicApi.getClasses(),
      academicSettingsApi.getSemesters(),
      academicSettingsApi.getAcademicYears(),
    ]);

    classes.value = classRes.data || [];
    semesters.value = semesterRes.data || [];
    academicYears.value = yearRes.data || [];

    // Set defaults
    const activeSemester = semesters.value.find((s) => s.isActive);
    if (activeSemester) {
      selectedSemester.value = activeSemester.id;
    }

    const activeYear = academicYears.value.find((y) => y.isActive);
    if (activeYear) {
      selectedYear.value = activeYear.year;
    }
  } catch (e) {
    console.error("Error loading filters:", e);
  }
}

async function loadStudents() {
  if (
    !selectedClassId.value ||
    !selectedSemester.value ||
    !selectedYear.value
  ) {
    students.value = [];
    return;
  }

  loading.value = true;
  try {
    const res = await homeroomNotesApi.getByClass(
      selectedClassId.value,
      selectedSemester.value,
      selectedYear.value
    );
    students.value = res.data || [];
  } catch (e) {
    console.error("Error loading students:", e);
    showStatus("Gagal", "Gagal memuat data siswa", "error");
  } finally {
    loading.value = false;
  }
}

async function saveAll() {
  if (!students.value.length) return;

  saving.value = true;
  try {
    const notes = students.value.map((s) => ({
      studentId: s.studentId,
      classId: Number(selectedClassId.value),
      academicYear: selectedYear.value,
      semester: Number(selectedSemester.value),
      sickDays: s.sickDays || 0,
      permissionDays: s.permissionDays || 0,
      absentDays: s.absentDays || 0,
      teacherNotes: s.teacherNotes || "",
    }));

    await homeroomNotesApi.bulkSave(notes);
    showStatus("Berhasil", "Semua catatan berhasil disimpan", "success");
  } catch (e) {
    console.error("Error saving notes:", e);
    showStatus("Gagal", e.message || "Gagal menyimpan catatan", "error");
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadFilters();
});
</script>
