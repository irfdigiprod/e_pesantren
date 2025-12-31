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
        <Icon icon="solar:calendar-bold" class="text-[#602515]" />
        Tahun Pelajaran
      </h2>

      <!-- Add New Year -->
      <div class="mb-4">
        <p v-if="yearError" class="text-xs text-red-500 mb-2">
          {{ yearError }}
        </p>
        <div class="flex flex-col sm:flex-row gap-2">
          <input
            v-model="newYear"
            type="text"
            placeholder="2025-2026"
            class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#602515]/30 focus:border-[#602515]"
            :class="yearError ? 'border-red-400' : 'border-slate-300'"
            @keyup.enter="addYear"
            @input="validateYearInput"
          />
          <button
            @click="addYear"
            :disabled="!newYear || loading || !!yearError"
            class="w-full sm:w-auto px-4 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1c10] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Icon icon="solar:add-circle-bold" />
            Tambah
          </button>
        </div>
        <p class="text-xs text-slate-500 mt-1">
          Format: YYYY-YYYY (contoh: 2025-2026)
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
              ? 'bg-[#602515]/5 border-[#602515]/30'
              : 'bg-slate-50 border-slate-200'
          "
        >
          <span class="font-medium text-slate-800">{{ y.year }}</span>
          <div class="flex items-center gap-2">
            <span
              v-if="y.isActive"
              class="px-2 py-0.5 text-xs font-medium bg-[#602515] text-white rounded-full"
            >
              Aktif
            </span>
            <button
              v-if="!y.isActive"
              @click="setActiveYear(y.year)"
              class="px-3 py-1.5 text-sm bg-[#602515]/10 text-[#602515] rounded-lg hover:bg-[#602515]/20"
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
        <Icon icon="solar:calendar-date-bold" class="text-[#602515]" />
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
              ? 'bg-[#602515]/5 border-[#602515] text-[#602515]'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-[#602515]/50'
          "
        >
          <div class="text-lg font-semibold">{{ s.name }}</div>
          <div v-if="s.isActive" class="text-xs mt-1 text-[#602515]">
            <Icon icon="solar:check-circle-bold" class="inline" />
            Semester Aktif
          </div>
        </button>
      </div>
    </div>

    <!-- Grading Rules Section -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
      <div
        class="mb-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
      >
        <h2
          class="text-lg font-semibold text-slate-800 flex items-center gap-2"
        >
          <Icon icon="solar:diploma-verified-bold" class="text-[#602515]" />
          Aturan Penilaian & Predikat
        </h2>

        <!-- Mode Toggle -->
        <div class="flex bg-slate-100 p-1 rounded-lg">
          <button
            @click="gradingRules.mode = 'SPECIFIC'"
            class="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
            :class="
              gradingRules.mode === 'SPECIFIC'
                ? 'bg-white text-[#602515] shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            "
          >
            Per KKM (Spesifik)
          </button>
          <button
            @click="gradingRules.mode = 'GLOBAL'"
            class="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
            :class="
              gradingRules.mode === 'GLOBAL'
                ? 'bg-white text-[#602515] shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            "
          >
            Samakan Semua (Global)
          </button>
        </div>
      </div>

      <!-- Specific Mode: List of KKM Configs -->
      <div v-if="gradingRules.mode === 'SPECIFIC'" class="space-y-6">
        <div
          v-if="gradingRules.specificRules && gradingRules.specificRules.length"
        >
          <div
            v-for="(config, kkmIndex) in gradingRules.specificRules"
            :key="kkmIndex"
            class="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-medium text-slate-800 flex items-center gap-2">
                <span
                  class="bg-[#602515] text-white px-2 py-0.5 rounded text-sm"
                  >KKM {{ config.kkm }}</span
                >
                <span class="text-sm text-slate-500"
                  >(Digunakan untuk mapel dengan KKM {{ config.kkm }})</span
                >
              </h3>
              <button
                @click="removeKkmConfig(kkmIndex)"
                class="text-red-500 hover:text-red-700 text-sm"
              >
                Hapus Aturan
              </button>
            </div>

            <!-- Rules Table (Reusable Block logic would be better but keeping inline for simplicity) -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="text-xs text-slate-500 uppercase bg-slate-100">
                  <tr>
                    <th class="px-3 py-2">Predikat</th>
                    <th class="px-3 py-2">Predikat (Arab)</th>
                    <th class="px-3 py-2">Min</th>
                    <th class="px-3 py-2">Max</th>
                    <th class="px-3 py-2">Keterangan (ID)</th>
                    <th class="px-3 py-2">Keterangan (AR)</th>
                    <th class="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(rule, rIndex) in config.rules"
                    :key="rIndex"
                    class="bg-white border-b hover:bg-slate-50"
                  >
                    <td class="px-3 py-2">
                      <input
                        v-model="rule.predicate"
                        type="text"
                        class="w-16 px-2 py-1 border rounded text-center font-bold"
                      />
                    </td>
                    <td class="px-3 py-2">
                      <input
                        v-model="rule.predicateAr"
                        type="text"
                        dir="rtl"
                        class="w-16 px-2 py-1 border rounded text-center font-akkurat-arabic"
                      />
                    </td>
                    <td class="px-3 py-2">
                      <input
                        v-model.number="rule.min"
                        type="number"
                        class="w-16 px-2 py-1 border rounded text-center"
                      />
                    </td>
                    <td class="px-3 py-2">
                      <input
                        v-model.number="rule.max"
                        type="number"
                        class="w-16 px-2 py-1 border rounded text-center"
                      />
                    </td>
                    <td class="px-3 py-2">
                      <input
                        v-model="rule.descriptionId"
                        type="text"
                        class="w-full px-2 py-1 border rounded"
                        placeholder="Sangat Baik"
                      />
                    </td>
                    <td class="px-3 py-2">
                      <input
                        v-model="rule.descriptionAr"
                        type="text"
                        class="w-full px-2 py-1 border rounded text-right font-akkurat-arabic"
                        placeholder="ممتاز"
                      />
                    </td>
                    <td class="px-3 py-2 text-center">
                      <button
                        @click="removeRuleRow(config.rules, rIndex)"
                        class="text-red-500 hover:text-red-700"
                        title="Hapus baris"
                      >
                        <Icon
                          icon="solar:trash-bin-trash-bold"
                          class="w-4 h-4"
                        />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="mt-2 text-center">
                <button
                  @click="addRuleRow(config.rules)"
                  class="text-[#602515] hover:underline text-sm flex items-center justify-center gap-1 mx-auto"
                >
                  <Icon icon="solar:add-circle-bold" />
                  Tambah Baris Aturan
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-6 text-slate-400 italic">
          Belum ada aturan penilaian spesifik. Tambahkan KKM.
        </div>
      </div>

      <!-- Actions for Specific Mode (Add KKM) -->
      <div
        v-if="gradingRules.mode === 'SPECIFIC'"
        class="mt-4 flex flex-wrap gap-3"
      >
        <div class="flex items-center gap-2">
          <input
            v-model.number="newKkmValue"
            type="number"
            class="w-20 px-3 py-2 border rounded-lg"
            placeholder="KKM"
          />
          <button
            @click="addKkmConfig"
            :disabled="!newKkmValue"
            class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            + Tambah Aturan KKM
          </button>
        </div>
      </div>

      <!-- Global Mode: Single Table -->
      <div v-if="gradingRules.mode === 'GLOBAL'" class="space-y-6">
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h3 class="font-medium text-slate-800 mb-4">
            Aturan Global (Berlaku untuk semua mapel)
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="text-xs text-slate-500 uppercase bg-slate-100">
                <tr>
                  <th class="px-3 py-2">Predikat</th>
                  <th class="px-3 py-2">Predikat (Arab)</th>
                  <th class="px-3 py-2">Min</th>
                  <th class="px-3 py-2">Max</th>
                  <th class="px-3 py-2">Keterangan (ID)</th>
                  <th class="px-3 py-2">Keterangan (AR)</th>
                  <th class="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(rule, rIndex) in gradingRules.globalRules"
                  :key="rIndex"
                  class="bg-white border-b hover:bg-slate-50"
                >
                  <td class="px-3 py-2">
                    <input
                      v-model="rule.predicate"
                      type="text"
                      class="w-16 px-2 py-1 border rounded text-center font-bold"
                    />
                  </td>
                  <td class="px-3 py-2">
                    <input
                      v-model="rule.predicateAr"
                      type="text"
                      dir="rtl"
                      class="w-16 px-2 py-1 border rounded text-center font-akkurat-arabic"
                    />
                  </td>
                  <td class="px-3 py-2">
                    <input
                      v-model.number="rule.min"
                      type="number"
                      class="w-16 px-2 py-1 border rounded text-center"
                    />
                  </td>
                  <td class="px-3 py-2">
                    <input
                      v-model.number="rule.max"
                      type="number"
                      class="w-16 px-2 py-1 border rounded text-center"
                    />
                  </td>
                  <td class="px-3 py-2">
                    <input
                      v-model="rule.descriptionId"
                      type="text"
                      class="w-full px-2 py-1 border rounded"
                      placeholder="Sangat Baik"
                    />
                  </td>
                  <td class="px-3 py-2">
                    <input
                      v-model="rule.descriptionAr"
                      type="text"
                      class="w-full px-2 py-1 border rounded text-right font-akkurat-arabic"
                      placeholder="ممتاز"
                    />
                  </td>
                  <td class="px-3 py-2 text-center">
                    <button
                      @click="removeRuleRow(gradingRules.globalRules, rIndex)"
                      class="text-red-500 hover:text-red-700"
                      title="Hapus baris"
                    >
                      <Icon icon="solar:trash-bin-trash-bold" class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="mt-2 text-center">
              <button
                @click="addRuleRow(gradingRules.globalRules)"
                class="text-[#602515] hover:underline text-sm flex items-center justify-center gap-1 mx-auto"
              >
                <Icon icon="solar:add-circle-bold" />
                Tambah Baris Aturan
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- General Save Button -->
      <div class="flex justify-end mt-4">
        <button
          @click="saveGradingRules"
          :disabled="savingRules"
          class="px-6 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1c10] flex items-center gap-2 disabled:opacity-50"
        >
          <Icon v-if="savingRules" icon="svg-spinners:ring-resize" />
          <Icon v-else icon="solar:diskette-bold" />
          Simpan Perubahan
        </button>
      </div>
    </div>

    <!-- Current Active Display -->
    <div class="mt-6 p-4 bg-[#602515]/5 border border-[#602515]/20 rounded-xl">
      <div class="text-sm text-[#602515] font-medium mb-1">
        Setting Aktif Saat Ini:
      </div>
      <div class="text-lg font-bold text-[#602515]">
        {{ activeYear }} - Semester {{ activeSemesterName }}
      </div>
    </div>

    <!-- Confirm Modal -->
    <ConfirmModal
      :isOpen="showConfirmModal"
      title="Hapus Tahun Pelajaran"
      confirmText="Ya, Hapus"
      cancelText="Batal"
      :loading="deleteLoading"
      @confirm="onConfirmDelete"
      @cancel="showConfirmModal = false"
    >
      Apakah Anda yakin ingin menghapus tahun pelajaran
      <strong>{{ yearToDelete }}</strong
      >?
    </ConfirmModal>

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
import { ref, computed, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { academicSettingsApi } from "@/services/api";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import StatusModal from "@/components/ui/StatusModal.vue";

const loading = ref(false);
const years = ref([]);
const semesters = ref([]);
const newYear = ref("");
const yearError = ref("");
const activeYear = ref("");
const activeSemester = ref("");

// Grading Rules State
// Grading Rules State
const gradingRules = ref({
  mode: "SPECIFIC",
  globalRules: [],
  specificRules: [],
});
const newKkmValue = ref("");
const savingRules = ref(false);

// Modal states
const showConfirmModal = ref(false);
const yearToDelete = ref("");
const deleteLoading = ref(false);

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

const activeSemesterName = computed(() => {
  const s = semesters.value.find((x) => x.isActive);
  return s?.name || "-";
});

async function loadData() {
  loading.value = true;
  try {
    const [yearsRes, semestersRes, activeRes, rulesRes] = await Promise.all([
      academicSettingsApi.getAcademicYears(),
      academicSettingsApi.getSemesters(),
      academicSettingsApi.getActive(),
      academicSettingsApi.getGradingRules(),
    ]);

    years.value = yearsRes.data || [];
    semesters.value = semestersRes.data || [];
    activeYear.value = activeRes.data?.academicYear || "";
    activeSemester.value = activeRes.data?.semester || "";
    gradingRules.value = rulesRes.data || {
      mode: "SPECIFIC",
      globalRules: [],
      specificRules: [],
    };
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
    showStatus("Berhasil", "Tahun pelajaran berhasil ditambahkan", "success");
  } catch (e) {
    showStatus(
      "Gagal",
      e.message || "Gagal menambahkan tahun pelajaran",
      "error"
    );
  } finally {
    loading.value = false;
  }
}

async function deleteYear(year) {
  yearToDelete.value = year;
  showConfirmModal.value = true;
}

async function onConfirmDelete() {
  deleteLoading.value = true;
  try {
    await academicSettingsApi.deleteAcademicYear(yearToDelete.value);
    showConfirmModal.value = false;
    await loadData();
    showStatus("Berhasil", "Tahun pelajaran berhasil dihapus", "success");
  } catch (e) {
    showStatus(
      "Gagal",
      e.message || "Gagal menghapus tahun pelajaran",
      "error"
    );
  } finally {
    deleteLoading.value = false;
  }
}

async function setActiveYear(year) {
  loading.value = true;
  try {
    await academicSettingsApi.setActiveAcademicYear(year);
    await loadData();
    showStatus("Berhasil", "Tahun aktif berhasil diubah", "success");
  } catch (e) {
    showStatus("Gagal", e.message || "Gagal mengubah tahun aktif", "error");
  } finally {
    loading.value = false;
  }
}

async function setActiveSemester(semesterId) {
  loading.value = true;
  try {
    await academicSettingsApi.setActiveSemester(semesterId);
    await loadData();
    showStatus("Berhasil", "Semester aktif berhasil diubah", "success");
  } catch (e) {
    showStatus("Gagal", e.message || "Gagal mengubah semester aktif", "error");
  } finally {
    loading.value = false;
  }
}

async function addKkmConfig() {
  const kkm = Number(newKkmValue.value);
  if (!kkm) return;

  // Check unique
  if (
    gradingRules.value.specificRules &&
    gradingRules.value.specificRules.find((r) => r.kkm === kkm)
  ) {
    showStatus("Gagal", `Aturan untuk KKM ${kkm} sudah ada!`, "error");
    return;
  }

  if (!gradingRules.value.specificRules) gradingRules.value.specificRules = [];

  // Default Template
  gradingRules.value.specificRules.push({
    kkm,
    rules: [
      {
        min: 92,
        max: 100,
        predicate: "A",
        descriptionId: "Sangat Baik",
        descriptionAr: "ممتاز",
      },
      {
        min: 84,
        max: 91,
        predicate: "B",
        descriptionId: "Baik",
        descriptionAr: "جيد جدا",
      },
      {
        min: 75,
        max: 83,
        predicate: "C",
        descriptionId: "Cukup",
        descriptionAr: "جيد",
      },
      {
        min: 0,
        max: 74,
        predicate: "D",
        descriptionId: "Kurang",
        descriptionAr: "مقبول",
      },
      {
        min: 0,
        max: 0,
        predicate: "E",
        descriptionId: "Sangat Kurang",
        descriptionAr: "ضعيف",
      },
    ],
  });

  newKkmValue.value = "";
}

function removeKkmConfig(index) {
  if (confirm("Hapus aturan penilaian ini?")) {
    gradingRules.value.specificRules.splice(index, 1);
  }
}

function addRuleRow(rulesArray) {
  rulesArray.push({
    min: 0,
    max: 0,
    predicate: "",
    predicateAr: "",
    descriptionId: "",
    descriptionAr: "",
  });
}

function removeRuleRow(rulesArray, rIndex) {
  rulesArray.splice(rIndex, 1);
}

async function saveGradingRules() {
  savingRules.value = true;
  try {
    const res = await academicSettingsApi.saveGradingRules(gradingRules.value);
    if (res.success) {
      showStatus("Berhasil", "Aturan penilaian berhasil disimpan", "success");
    } else {
      throw new Error(res.message);
    }
  } catch (e) {
    showStatus("Gagal", e.message || "Gagal menyimpan aturan", "error");
  } finally {
    savingRules.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>
