<template>
  <div class="p-2 max-w-4xl mx-auto pb-12">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Pengaturan Akademik</h1>
      <p class="text-slate-500 text-sm mt-1">
        Kelola tahun pelajaran dan semester aktif
      </p>
    </div>

    <!-- Academic Year Section -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
      <h2
        class="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"
      >
        <Icon icon="solar:calendar-bold" class="text-blue-600" />
        Tahun Pelajaran
      </h2>

      <!-- Add New Year -->
      <div class="mb-4">
        <div class="flex flex-col sm:flex-row gap-2">
          <input
            v-model="newYear"
            type="text"
            placeholder="2025-2026"
            class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :class="yearError ? 'border-red-400' : 'border-slate-300'"
            @keyup.enter="addYear"
            @input="validateYearInput"
          />
          <button
            @click="addYear"
            :disabled="!newYear || loading || !!yearError"
            class="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Icon icon="solar:add-circle-bold" />
            Tambah
          </button>
        </div>
        <p class="text-xs text-slate-500 mt-1">
          Format: YYYY-YYYY (contoh: 2025-2026)
        </p>
        <p v-if="yearError" class="text-xs text-red-500 mt-1">
          {{ yearError }}
        </p>
      </div>

      <!-- Year List -->
      <div v-if="years.length" class="space-y-2">
        <div
          v-for="y in years"
          :key="y.year"
          class="flex items-center justify-between p-3 rounded-lg border transition-colors"
          :class="
            y.isActive
              ? 'bg-green-50 border-green-300'
              : 'bg-slate-50 border-slate-200'
          "
        >
          <div class="flex items-center gap-3">
            <span class="font-medium text-slate-800">{{ y.year }}</span>
            <span
              v-if="y.isActive"
              class="px-2 py-0.5 text-xs font-medium bg-green-500 text-white rounded-full"
            >
              Aktif
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="!y.isActive"
              @click="setActiveYear(y.year)"
              class="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              Set Aktif
            </button>
            <button
              @click="deleteYear(y.year)"
              class="p-1.5 text-red-500 hover:bg-red-100 rounded-lg"
              title="Hapus"
            >
              <Icon icon="solar:trash-bin-trash-bold" />
            </button>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-8 text-slate-400">
        Belum ada tahun pelajaran. Tambahkan tahun pertama.
      </div>
    </div>

    <!-- Semester Section -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h2
        class="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"
      >
        <Icon icon="solar:calendar-date-bold" class="text-purple-600" />
        Semester Aktif
      </h2>

      <div class="grid grid-cols-2 gap-4">
        <button
          v-for="s in semesters"
          :key="s.id"
          @click="setActiveSemester(s.id)"
          class="p-4 rounded-xl border-2 transition-colors text-center"
          :class="
            s.isActive
              ? 'bg-purple-50 border-purple-500 text-purple-700'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-purple-300'
          "
        >
          <div class="text-lg font-semibold">{{ s.name }}</div>
          <div v-if="s.isActive" class="text-xs mt-1 text-purple-500">
            <Icon icon="solar:check-circle-bold" class="inline" />
            Semester Aktif
          </div>
        </button>
      </div>
    </div>

    <!-- Current Active Display -->
    <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <div class="text-sm text-blue-600 font-medium mb-1">
        Setting Aktif Saat Ini:
      </div>
      <div class="text-lg font-bold text-blue-800">
        {{ activeYear }} - Semester {{ activeSemesterName }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { academicSettingsApi } from "@/services/api";

const loading = ref(false);
const years = ref([]);
const semesters = ref([]);
const newYear = ref("");
const yearError = ref("");
const activeYear = ref("");
const activeSemester = ref("");

const activeSemesterName = computed(() => {
  const s = semesters.value.find((x) => x.isActive);
  return s?.name || "-";
});

async function loadData() {
  loading.value = true;
  try {
    const [yearsRes, semestersRes, activeRes] = await Promise.all([
      academicSettingsApi.getAcademicYears(),
      academicSettingsApi.getSemesters(),
      academicSettingsApi.getActive(),
    ]);

    years.value = yearsRes.data || [];
    semesters.value = semestersRes.data || [];
    activeYear.value = activeRes.data?.academicYear || "";
    activeSemester.value = activeRes.data?.semester || "";
  } catch (e) {
    console.error("Failed to load academic settings:", e);
  } finally {
    loading.value = false;
  }
}

function validateYearInput() {
  yearError.value = "";
  const input = newYear.value.trim();

  if (!input) return;

  // Check basic format YYYY-YYYY
  if (!/^\d{4}-\d{4}$/.test(input)) {
    yearError.value = "Format harus: YYYY-YYYY (contoh: 2025-2026)";
    return;
  }

  const [year1, year2] = input.split("-").map(Number);

  // Check year2 = year1 + 1
  if (year2 !== year1 + 1) {
    yearError.value = `Tahun kedua harus ${year1 + 1}, bukan ${year2}`;
    return;
  }

  // Check reasonable year range (1990 - 2100)
  if (year1 < 1990 || year1 > 2100) {
    yearError.value = "Tahun harus antara 1990 - 2100";
    return;
  }
}

async function addYear() {
  if (!newYear.value || loading.value) return;

  // Validate before submitting
  validateYearInput();
  if (yearError.value) return;

  loading.value = true;
  try {
    await academicSettingsApi.addAcademicYear(newYear.value);
    newYear.value = "";
    await loadData();
  } catch (e) {
    alert(e.message || "Gagal menambahkan tahun pelajaran");
  } finally {
    loading.value = false;
  }
}

async function deleteYear(year) {
  if (!confirm(`Hapus tahun pelajaran ${year}?`)) return;

  loading.value = true;
  try {
    await academicSettingsApi.deleteAcademicYear(year);
    await loadData();
  } catch (e) {
    alert(e.message || "Gagal menghapus tahun pelajaran");
  } finally {
    loading.value = false;
  }
}

async function setActiveYear(year) {
  loading.value = true;
  try {
    await academicSettingsApi.setActiveAcademicYear(year);
    await loadData();
  } catch (e) {
    alert(e.message || "Gagal mengubah tahun aktif");
  } finally {
    loading.value = false;
  }
}

async function setActiveSemester(semesterId) {
  loading.value = true;
  try {
    await academicSettingsApi.setActiveSemester(semesterId);
    await loadData();
  } catch (e) {
    alert(e.message || "Gagal mengubah semester aktif");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>
