<template>
  <div class="max-w-7xl mx-auto pb-12">
    <DataTable
      title="Input Nilai Rapor"
      description="Kelola nilai siswa per kelas secara massal."
      icon="solar:pen-new-square-bold-duotone"
      :items="studentGrades"
      :columns="columns"
      :loading="loading"
      :pagination="null"
      :search="search"
      @update:search="search = $event"
    >
      <!-- Header Actions (Filters) -->
      <template #header-actions>
        <div class="flex flex-wrap gap-2 items-center">
          <select
            v-model="filters.classId"
            class="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-[#602515] outline-none"
          >
            <option value="">- Pilih Kelas -</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>

          <select
            v-model="filters.subjectId"
            class="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-[#602515] outline-none"
          >
            <option value="">- Pilih Mapel -</option>
            <option v-for="s in subjects" :key="s.id" :value="s.id">
              {{ s.name }}
            </option>
          </select>

          <!-- Year & Semester (could be moved to Settings global state later) -->
          <select
            v-model="filters.academicYear"
            class="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-[#602515] outline-none"
          >
            <option v-for="y in academicYears" :key="y.year" :value="y.year">
              {{ y.year }}
            </option>
          </select>

          <select
            v-model="filters.semester"
            class="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-[#602515] outline-none"
          >
            <option :value="1">Ganjil</option>
            <option :value="2">Genap</option>
          </select>

          <button
            @click="fetchData"
            :disabled="!isValidFilter || loading"
            class="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
          >
            <Icon icon="solar:refresh-linear" />
            Load
          </button>

          <button
            @click="saveAll"
            :disabled="studentGrades.length === 0 || saving"
            class="px-4 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1c10] transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
          >
            <Icon
              v-if="saving"
              icon="svg-spinners:ring-resize"
              class="w-4 h-4"
            />
            <Icon v-else icon="solar:diskette-bold-duotone" />
            Simpan Semua
          </button>
        </div>
      </template>

      <!-- Custom Cells for Inputs -->
      <template #cell-dailyScore="{ item }">
        <input
          v-model.number="item.dailyScore"
          type="number"
          min="0"
          max="100"
          class="w-16 px-2 py-1 border border-slate-200 rounded text-center text-sm focus:border-[#602515] outline-none"
          placeholder="0"
        />
      </template>

      <template #cell-homeworkScore="{ item }">
        <input
          v-model.number="item.homeworkScore"
          type="number"
          min="0"
          max="100"
          class="w-16 px-2 py-1 border border-slate-200 rounded text-center text-sm focus:border-[#602515] outline-none"
          placeholder="0"
        />
      </template>

      <template #cell-midtermScore="{ item }">
        <input
          v-model.number="item.midtermScore"
          type="number"
          min="0"
          max="100"
          class="w-16 px-2 py-1 border border-slate-200 rounded text-center text-sm focus:border-[#602515] outline-none"
          placeholder="0"
        />
      </template>

      <template #cell-finalScore="{ item }">
        <input
          v-model.number="item.finalScore"
          type="number"
          min="0"
          max="100"
          class="w-16 px-2 py-1 border border-slate-200 rounded text-center text-sm focus:border-[#602515] outline-none"
          placeholder="0"
        />
      </template>

      <template #cell-practiceScore="{ item }">
        <input
          v-model.number="item.practiceScore"
          type="number"
          min="0"
          max="100"
          class="w-16 px-2 py-1 border border-slate-200 rounded text-center text-sm focus:border-[#602515] outline-none"
          placeholder="0"
        />
      </template>

      <!-- Calculated Fields -->
      <template #cell-calculatedFinal="{ item }">
        <div class="font-bold text-slate-700">
          {{ calculateFinal(item) }}
        </div>
      </template>

      <template #cell-predicate="{ item }">
        <span
          class="px-2 py-1 rounded text-xs font-bold"
          :class="getPredicateColor(item)"
        >
          {{ calculatePredicate(item) }}
        </span>
      </template>
    </DataTable>

    <StatusModal
      :isOpen="statusModal.open"
      :type="statusModal.type"
      :title="statusModal.title"
      :message="statusModal.message"
      @close="statusModal.open = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import { academicApi, academicSettingsApi } from "@/services/api";
import DataTable from "@/components/ui/DataTable.vue";
import StatusModal from "@/components/ui/StatusModal.vue";
import { Icon } from "@iconify/vue";

// State
const loading = ref(false);
const saving = ref(false);
const classes = ref([]);
const subjects = ref([]);
const academicYears = ref([]);
const studentGrades = ref([]);
const gradingRules = ref([]);
const search = ref("");

const currentSubject = computed(() => {
  return subjects.value.find((s) => s.id === Number(filters.subjectId));
});

const currentKkm = computed(() => {
  const val = currentSubject.value?.kkm;
  const num = Number(val);
  return !isNaN(num) && num > 0 ? num : 75; // Default 75
});

const activeRules = computed(() => {
  const config = gradingRules.value.find((r) => r.kkm === currentKkm.value);
  return config ? config.rules : [];
});

const activeRuleCount = computed(() => activeRules.value.length);

// Watch for missing rules
watch(
  () => currentSubject.value,
  (newVal) => {
    if (newVal && activeRuleCount.value === 0) {
      statusModal.type = "error";
      statusModal.title = "Aturan KKM Tidak Ditemukan";
      statusModal.message = `Mapel ini memiliki KKM ${currentKkm.value}, namun belum ada aturan predikat untuk KKM tersebut. Silakan buat aturan untuk KKM ${currentKkm.value} di Pengaturan Akademik.`;
      statusModal.open = true;
    }
  }
);

const statusModal = reactive({
  open: false,
  type: "success",
  title: "",
  message: "",
});

const filters = reactive({
  classId: "",
  subjectId: "",
  academicYear: "2024/2025", // Default
  semester: 1, // Default
});

// Columns Definition
const columns = [
  { field: "nis", label: "NIS", width: "w-20" },
  { field: "name", label: "Nama Santri", sortable: true },
  { field: "dailyScore", label: "Harian", align: "center", width: "w-24" },
  { field: "homeworkScore", label: "Tugas", align: "center", width: "w-24" },
  { field: "midtermScore", label: "UTS", align: "center", width: "w-24" },
  { field: "finalScore", label: "UAS", align: "center", width: "w-24" },
  { field: "practiceScore", label: "Praktek", align: "center", width: "w-24" },
  {
    field: "calculatedFinal",
    label: "Nilai Akhir",
    align: "center",
    width: "w-24",
  },
  { field: "predicate", label: "Predikat", align: "center", width: "w-24" },
];

const isValidFilter = computed(() => {
  return (
    filters.classId &&
    filters.subjectId &&
    filters.academicYear &&
    filters.semester
  );
});

// Fetch Initial Data (Classes & Subjects)
// Fetch Initial Data (Classes & Subjects & Settings)
onMounted(async () => {
  try {
    const [clsRes, subRes, yearsRes, activeRes, rulesRes] = await Promise.all([
      academicApi.getClasses(),
      academicApi.getSubjects(),
      academicSettingsApi.getAcademicYears(),
      academicSettingsApi.getActive(),
      academicSettingsApi.getGradingRules(),
    ]);
    classes.value = clsRes.data || [];
    subjects.value = subRes.data || [];
    academicYears.value = yearsRes.data || [];
    gradingRules.value = rulesRes.data || [];

    // Set default filters from active settings
    if (activeRes.success && activeRes.data) {
      filters.academicYear = activeRes.data.academicYear;
      filters.semester = Number(activeRes.data.semester);
    }
  } catch (e) {
    console.error("Failed to load initial data", e);
  }
});

async function fetchData() {
  if (!isValidFilter.value) return;

  loading.value = true;
  try {
    const res = await academicApi.getGradesList(filters);
    // Flatten data for table
    studentGrades.value = (res.data || []).map((item) => {
      const g = item.grade || {};
      return {
        id: item.student.id,
        nis: item.student.nis,
        name: item.student.name,
        dailyScore: g.dailyScore ? Number(g.dailyScore) : "", // Input might be empty string
        homeworkScore: g.homeworkScore ? Number(g.homeworkScore) : "",
        midtermScore: g.midtermScore ? Number(g.midtermScore) : "",
        finalScore: g.finalScore ? Number(g.finalScore) : "",
        practiceScore: g.practiceScore ? Number(g.practiceScore) : "",
      };
    });
  } catch (e) {
    statusModal.type = "error";
    statusModal.title = "Gagal Memuat Data";
    statusModal.message = e.message || "Terjadi kesalahan saat memuat data.";
    statusModal.open = true;
  } finally {
    loading.value = false;
  }
}

async function saveAll() {
  saving.value = true;
  try {
    // Prepare payload
    const payload = studentGrades.value.map((item) => ({
      studentId: item.id,
      subjectId: Number(filters.subjectId),
      academicYear: filters.academicYear,
      semester: Number(filters.semester),
      dailyScore: item.dailyScore === "" ? undefined : Number(item.dailyScore),
      homeworkScore:
        item.homeworkScore === "" ? undefined : Number(item.homeworkScore),
      midtermScore:
        item.midtermScore === "" ? undefined : Number(item.midtermScore),
      finalScore: item.finalScore === "" ? undefined : Number(item.finalScore),
      practiceScore:
        item.practiceScore === "" ? undefined : Number(item.practiceScore),
    }));

    await academicApi.saveGradesBulk(payload);

    statusModal.type = "success";
    statusModal.title = "Berhasil Disimpan";
    statusModal.message = "Data nilai berhasil disimpan ke database.";
    statusModal.open = true;

    fetchData(); // Reload to ensure sync
  } catch (e) {
    statusModal.type = "error";
    statusModal.title = "Gagal Menyimpan";
    statusModal.message = e.message || "Terjadi kesalahan saat menyimpan data.";
    statusModal.open = true;
  } finally {
    loading.value = false;
    saving.value = false;
  }
}

// Calculations
function calculateFinal(item) {
  const scores = [
    item.dailyScore,
    item.homeworkScore,
    item.midtermScore,
    item.finalScore,
    item.practiceScore,
  ]
    .map((s) => (s === "" ? null : Number(s)))
    .filter((s) => s !== null);

  if (scores.length === 0) return "-";
  const sum = scores.reduce((a, b) => a + b, 0);
  return (sum / scores.length).toFixed(1);
}

function calculatePredicate(item) {
  const final = calculateFinal(item);
  if (final === "-") return "-";
  const score = Number(final);

  // Find rules for current KKM
  const kkmConfig = gradingRules.value.find((r) => r.kkm === currentKkm.value);

  if (kkmConfig && kkmConfig.rules) {
    // Dynamic Rules
    const match = kkmConfig.rules.find((r) => score >= r.min && score <= r.max);
    return match ? match.predicate : "E";
  } else {
    // Fallback Static Rules (Standard KKM 75 usually)
    if (score >= 92) return "A";
    if (score >= 84) return "B";
    if (score >= 75) return "C";
    if (score < 75) return "D"; // Or whatever default logic
    return "E";
  }
}

function getPredicateColor(item) {
  const pred = calculatePredicate(item);
  switch (pred) {
    case "A":
      return "bg-green-100 text-green-700";
    case "B":
      return "bg-blue-100 text-blue-700";
    case "C":
      return "bg-yellow-100 text-yellow-700";
    case "D":
      return "bg-orange-100 text-orange-700";
    case "E":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-500";
  }
}
</script>
