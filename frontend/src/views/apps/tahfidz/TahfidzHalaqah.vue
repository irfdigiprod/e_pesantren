<template>
  <div class="max-w-7xl mx-auto pb-12">
    <!-- Header -->
    <div
      class="mb-6 flex flex-col md:flex-row justify-between items-center gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Input Setoran Halaqah</h1>
        <p class="text-slate-500">
          Pilih tanggal untuk input setoran massal anggota halaqah
        </p>
      </div>

      <!-- Halaqah Selector (if multiple) - Simplified to just taking first active for now or mock -->
      <!-- Halaqah Selector -->
      <div class="w-full md:w-64">
        <div v-if="myHalaqahs.length > 0" class="relative">
          <button
            @click="showHalaqahDropdown = !showHalaqahDropdown"
            class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between hover:border-primary/50 transition-colors text-left"
          >
            <div class="overflow-hidden">
              <div class="font-bold text-slate-800 truncate">
                {{ selectedHalaqah?.name || "Pilih Halaqah" }}
              </div>
              <div class="text-xs text-slate-500 truncate">
                {{ selectedHalaqah?.mentorName || "..." }}
              </div>
            </div>
            <Icon
              icon="solar:alt-arrow-down-linear"
              class="text-slate-400 transition-transform duration-200"
              :class="{ 'rotate-180': showHalaqahDropdown }"
            />
          </button>

          <!-- Dropdown Menu -->
          <Transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <div
              v-if="showHalaqahDropdown"
              class="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 z-50 max-h-80 overflow-y-auto"
            >
              <div class="p-1">
                <button
                  v-for="h in myHalaqahs"
                  :key="h.id"
                  @click="selectHalaqah(h)"
                  class="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors flex flex-col gap-0.5 group"
                  :class="{ 'bg-[#602515]/5': selectedHalaqahId === h.id }"
                >
                  <span
                    class="font-medium text-slate-700 group-hover:text-[#602515] transition-colors"
                    :class="{ 'text-[#602515]': selectedHalaqahId === h.id }"
                  >
                    {{ h.name }}
                  </span>
                  <span class="text-xs text-slate-400">
                    {{ h.mentorName || "Tanpa Pembimbing" }}
                  </span>
                </button>
              </div>
            </div>
          </Transition>

          <!-- Quick Backdrop -->
          <div
            v-if="showHalaqahDropdown"
            class="fixed inset-0 z-40 bg-transparent"
            @click="showHalaqahDropdown = false"
          ></div>
        </div>
        <div v-else class="text-sm text-slate-400 italic">
          <span v-if="loadingHalaqah">Memuat grup...</span>
          <span v-else-if="errorMessage" class="text-rose-500 font-medium">
            Error: {{ errorMessage }}
            <button
              @click="loadInitial"
              class="underline ml-2 hover:text-rose-700"
            >
              Coba lagi
            </button>
          </span>
          <span v-else>Tidak ada grup halaqah.</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-[minmax(300px,1fr)_2fr] gap-6">
      <!-- Calendar Sidebar -->
      <div>
        <div
          class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6"
          @touchstart="onTouchStart"
          @touchend="onTouchEnd"
          @wheel="onWheel"
        >
          <!-- Month/Year Header -->
          <div class="flex items-center justify-between mb-6">
            <button
              @click="changeMonth(-1)"
              class="p-2 hover:bg-slate-100 rounded-full"
            >
              <Icon icon="solar:alt-arrow-left-linear" />
            </button>
            <h2 class="font-bold text-lg text-slate-800">
              {{ currentMonthName }} {{ currentYear }}
            </h2>
            <button
              @click="changeMonth(1)"
              class="p-2 hover:bg-slate-100 rounded-full"
            >
              <Icon icon="solar:alt-arrow-right-linear" />
            </button>
          </div>

          <!-- Days Grid -->
          <div class="grid grid-cols-7 gap-1 text-center mb-2">
            <div
              v-for="d in ['S', 'S', 'R', 'K', 'J', 'S', 'M']"
              :key="d"
              class="text-xs font-bold text-slate-400 py-2"
            >
              {{ d }}
            </div>
          </div>
          <Transition :name="transitionName" mode="out-in">
            <div
              :key="currentMonth + '-' + currentYear"
              class="grid grid-cols-7 gap-1 text-center"
            >
              <!-- Empty slots -->
              <div v-for="i in firstDayOfWeek" :key="'empty' + i"></div>
              <!-- Days -->
              <button
                v-for="day in daysInMonth"
                :key="day"
                @click="selectDate(day)"
                class="relative w-9 h-9 mx-auto flex items-center justify-center rounded-full text-sm transition-all"
                :class="[]"
              >
                <!-- Progress Circle Background -->
                <div
                  v-if="getDayProgress(day).hasData"
                  class="absolute inset-0 rounded-full"
                  :style="{
                    background: `conic-gradient(
                    #10b981 0deg ${getDayProgress(day).greenDeg}deg,
                    #facc15 ${getDayProgress(day).greenDeg}deg ${
                      getDayProgress(day).yellowDeg
                    }deg, 
                    #f43f5e ${getDayProgress(day).yellowDeg}deg ${
                      getDayProgress(day).redDeg
                    }deg,
                    #e2e8f0 ${getDayProgress(day).redDeg}deg 360deg
                  )`,
                  }"
                ></div>

                <!-- Inner White Circle for Text -->
                <div
                  class="z-10 w-7 h-7 bg-white rounded-full flex items-center justify-center"
                  :class="[
                    isSelected(day)
                      ? '!bg-[#602515] !text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100',
                    isToday(day) ? '!font-extrabold' : '',
                    isToday(day) && !isSelected(day) ? '!text-slate-900' : '',
                  ]"
                >
                  {{ day }}
                </div>
              </button>
            </div>
          </Transition>

          <!-- Legend -->
          <div
            class="mt-4 pt-4 border-t flex flex-wrap gap-3 justify-center text-xs text-slate-500"
          >
            <div class="flex items-center gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
              <span>Belum</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <span>Selesai</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
              <span>Izin</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
              <span>Alpha</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Student List -->
      <div class="space-y-4">
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 class="font-bold text-slate-800 text-lg mb-6 border-b pb-4">
            Peserta - {{ formatDateFull(selectedDate) }}
          </h3>

          <div v-if="loading" class="py-12 text-center text-slate-500 italic">
            <Icon icon="svg-spinners:ring-resize" class="inline mr-2" />
            Memuat data...
          </div>

          <div
            v-else-if="students.length === 0"
            class="py-12 text-center text-slate-500"
          >
            Belum ada anggota di halaqah ini.
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="item in students"
              :key="item.student.id"
              class="flex items-center justify-between p-4 rounded-xl border transition-colors cursor-pointer hover:border-[#602515]/30 hover:bg-[#602515]/5"
              :class="getStatusColor(item.status)"
              @click="openInputModal(item)"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0"
                >
                  <img
                    v-if="item.student.avatar"
                    :src="item.student.avatar"
                    class="w-full h-full object-cover"
                  />
                  <Icon
                    v-else
                    icon="solar:user-circle-bold"
                    class="w-full h-full text-slate-300"
                  />
                </div>
                <div>
                  <h4 class="font-bold text-slate-800">
                    {{ item.student.name }}
                  </h4>
                  <p
                    v-if="item.status === 'done'"
                    class="text-sm text-emerald-600 font-medium"
                  >
                    {{ item.deposit.surahName }}:
                    {{ item.deposit.ayatStart }}-{{ item.deposit.ayatEnd }}
                  </p>
                  <p
                    v-else-if="item.status === 'izin'"
                    class="text-sm text-yellow-600 font-medium"
                  >
                    {{ item.deposit.notes || "Izin" }}
                  </p>
                  <p v-else class="text-xs text-slate-400">
                    Klik untuk input setoran
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="flex items-center gap-2">
                  <div
                    class="w-3 h-3 rounded-full"
                    :class="getStatusDot(item.status)"
                  ></div>
                  <span
                    class="text-sm font-medium"
                    :class="getStatusText(item.status)"
                    >{{ getStatusLabel(item.status) }}</span
                  >
                </div>
                <Icon
                  icon="solar:alt-arrow-right-linear"
                  class="text-slate-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reusing Input Component logic inside a local Modal or Component -->
    <!-- For simplicity, duplicating modal logic or ideally modify TahfidzDashboard to export the modal component -->
    <!-- I will build a simple modal here to fulfill the requirement directly -->

    <Transition name="fade">
      <div
        v-if="showModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <div
          class="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200"
        >
          <div
            class="px-6 py-4 border-b flex justify-between items-center bg-slate-50"
          >
            <h3 class="font-bold text-slate-800">
              {{ selectedStudent?.deposit ? "Edit Setoran" : "Input Setoran" }}:
              {{ selectedStudent?.student.name }}
            </h3>
            <button
              @click="closeModal"
              class="text-slate-400 hover:text-slate-600"
            >
              <Icon icon="solar:close-circle-bold" class="text-xl" />
            </button>
          </div>

          <div class="p-6">
            <form @submit.prevent="submitDeposit" class="space-y-4">
              <!-- Date (Readonly for Context) -->
              <div
                class="bg-amber-50 text-amber-800 px-4 py-2 rounded-lg text-sm mb-4 border border-amber-200"
              >
                Menginput untuk tanggal
                <strong>{{ formatDateFull(selectedDate) }}</strong>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1"
                    >Jenis</label
                  >
                  <select
                    v-model="form.type"
                    class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 ring-primary/20"
                  >
                    <option value="ziyadah">Ziyadah</option>
                    <option value="murajaah">Muraja'ah</option>
                    <option value="izin">Izin</option>
                    <option value="alpha">Alpha / Tanpa Keterangan</option>
                  </select>
                </div>
                <div v-if="form.type !== 'izin' && form.type !== 'alpha'">
                  <label class="block text-sm font-medium text-slate-700 mb-1"
                    >Juz</label
                  >
                  <input
                    type="number"
                    v-model="form.juz"
                    class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 ring-primary/20"
                  />
                </div>
              </div>

              <div v-if="form.type !== 'izin' && form.type !== 'alpha'">
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Surah</label
                >
                <select
                  v-model="form.surahName"
                  class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 ring-primary/20"
                >
                  <!-- Ideally list of surahs -->
                  <option value="Al-Fatihah">Al-Fatihah</option>
                  <option value="Al-Baqarah">Al-Baqarah</option>
                  <option value="Ali Imran">Ali 'Imran</option>
                  <option value="An-Nisa">An-Nisa'</option>
                  <!-- Simplified list... in real app use full list data -->
                  <option value="Juz 30">Juz 30</option>
                  <option value="Lainnya">Lainnya...</option>
                </select>
              </div>
              <div
                class="grid grid-cols-2 gap-4"
                v-if="form.type !== 'izin' && form.type !== 'alpha'"
              >
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1"
                    >Ayat Awal</label
                  >
                  <input
                    type="number"
                    v-model="form.ayatStart"
                    class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 ring-primary/20"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1"
                    >Ayat Akhir</label
                  >
                  <input
                    type="number"
                    v-model="form.ayatEnd"
                    class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 ring-primary/20"
                  />
                </div>
              </div>

              <div v-if="form.type !== 'izin' && form.type !== 'alpha'">
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Kelancaran</label
                >
                <select
                  v-model="form.fluency"
                  class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 ring-primary/20"
                >
                  <option value="lancar">Lancar (Mumtaz)</option>
                  <option value="kurang_lancar">Kurang Lancar (Jayyid)</option>
                  <option value="mengulang">Mengulang (Rasib)</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Catatan</label
                >
                <textarea
                  v-model="form.notes"
                  rows="2"
                  class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 ring-primary/20"
                ></textarea>
              </div>

              <div class="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  @click="closeModal"
                  class="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="px-4 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1c10] disabled:opacity-50"
                >
                  {{
                    saving
                      ? "Menyimpan..."
                      : selectedStudent?.deposit
                      ? "Update Setoran"
                      : "Simpan Setoran"
                  }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { Icon } from "@iconify/vue";
import { tahfidzApi, halaqahApi, authApi } from "@/services/api";

const loading = ref(false);
const saving = ref(false);
const myHalaqahs = ref([]);
const selectedHalaqahId = ref(null);
const students = ref([]);

// Calendar State
const now = new Date();
const currentMonth = ref(now.getMonth());
const currentYear = ref(now.getFullYear());
const selectedDate = ref(now.toISOString().split("T")[0]); // YYYY-MM-DD

// Modal State
const showModal = ref(false);
const selectedStudent = ref(null);
const form = reactive({
  type: "ziyadah",
  juz: 1,
  surahName: "Al-Baqarah",
  ayatStart: 1,
  ayatEnd: 5,
  fluency: "lancar",
  notes: "",
});

// --- Calendar Logic ---
const currentMonthName = computed(() => {
  return new Date(currentYear.value, currentMonth.value).toLocaleString(
    "id-ID",
    { month: "long" }
  );
});

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
});

// Dropdown State
const showHalaqahDropdown = ref(false);
const selectedHalaqah = computed(() => {
  return myHalaqahs.value.find((h) => h.id === selectedHalaqahId.value);
});

function selectHalaqah(halaqah) {
  selectedHalaqahId.value = halaqah.id;
  showHalaqahDropdown.value = false;
  loadDateData();
}

const firstDayOfWeek = computed(() => {
  const day = new Date(currentYear.value, currentMonth.value, 1).getDay();
  // Adjust for Monday start: Sun(0) -> 6, Mon(1) -> 0
  return day === 0 ? 6 : day - 1;
});

// Transition State
const slideDirection = ref("slide-left");
const transitionName = computed(() => slideDirection.value);

function changeMonth(delta) {
  slideDirection.value = delta > 0 ? "slide-left" : "slide-right";

  let newMonth = currentMonth.value + delta;
  if (newMonth > 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else if (newMonth < 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value = newMonth;
  }
}

function selectDate(day) {
  const d = new Date(currentYear.value, currentMonth.value, day);
  // manual timezone correction or just construction string
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(day).padStart(2, "0");
  selectedDate.value = `${y}-${m}-${da}`;

  // Load data for this date
  loadDateData();
}

function isToday(day) {
  const today = new Date();
  return (
    day === today.getDate() &&
    currentMonth.value === today.getMonth() &&
    currentYear.value === today.getFullYear()
  );
}

function isSelected(day) {
  // Parsing selectedDate string
  const parts = selectedDate.value.split("-");
  return (
    parseInt(parts[2]) === day &&
    parseInt(parts[1]) - 1 === currentMonth.value &&
    parseInt(parts[0]) === currentYear.value
  );
}

// --- Status Logic ---
function getStatusColor(status) {
  if (status === "done") return "border-emerald-200 bg-emerald-50";
  if (status === "izin") return "border-yellow-200 bg-yellow-50";
  if (status === "alpha") return "border-rose-200 bg-rose-50";
  return "border-slate-100 mobile:bg-white";
}

function getStatusDot(status) {
  if (status === "done") return "bg-emerald-500";
  if (status === "izin") return "bg-yellow-400";
  if (status === "alpha") return "bg-rose-500";
  if (status === "sick") return "bg-amber-400"; // Example
  return "bg-slate-300"; // Belum
}

function getStatusText(status) {
  if (status === "done") return "text-emerald-700";
  if (status === "izin") return "text-yellow-700";
  if (status === "alpha") return "text-rose-700";
  return "text-slate-500";
}

function getStatusLabel(status) {
  const map = {
    done: "Selesai",
    none: "Belum",
    sick: "Sakit",
    izin: "Izin",
    alpha: "Alpha",
    permission: "Izin",
  };
  return map[status] || "Belum";
}

function formatDateFull(dateStr) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getDayProgress(day) {
  const y = currentYear.value;
  const m = String(currentMonth.value + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  const dateKey = `${y}-${m}-${d}`;

  const countObj = monthlyStats.value.data[dateKey] || {
    done: 0,
    permission: 0,
    alpha: 0,
  };
  const countDone = countObj.done || 0;
  const countPerm = countObj.permission || 0;
  const countAlpha = countObj.alpha || 0;

  const total = monthlyStats.value.totalStudents || 1;

  const pGreen = (countDone / total) * 100;
  const pYellow = (countPerm / total) * 100;
  const pRed = (countAlpha / total) * 100;

  return {
    hasData: countDone + countPerm + countAlpha > 0,
    greenDeg: pGreen * 3.6,
    yellowDeg: (pGreen + pYellow) * 3.6,
    redDeg: (pGreen + pYellow + pRed) * 3.6,
  };
}

// --- Data Loading ---
const loadingHalaqah = ref(false);
const errorMessage = ref("");
const monthlyStats = ref({ data: {}, totalStudents: 0 }); // { date: count }

async function loadMonthlyStats() {
  if (!selectedHalaqahId.value) return;
  try {
    const res = await tahfidzApi.getHalaqahMonthlySummary(
      selectedHalaqahId.value,
      currentMonth.value + 1,
      currentYear.value
    );
    if (res.success) {
      monthlyStats.value = res;
    }
  } catch (e) {
    console.error("Load Monthly Stats Error:", e);
  }
}

async function loadDateData() {
  if (!selectedHalaqahId.value) return;
  loading.value = true;
  try {
    const res = await tahfidzApi.getHalaqahDailySummary(
      selectedHalaqahId.value,
      selectedDate.value
    );
    if (res.success) {
      students.value = res.data;
    }
    // Also refresh monthly stats if we just saved data, but simpler to just call it when month changes
    // calling it here ensures if we add data today, the circle updates
    loadMonthlyStats();
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}
async function loadInitial() {
  loadingHalaqah.value = true;
  errorMessage.value = "";
  try {
    // 1. Get My Halaqahs
    // Ideally: halaqahApi.getMyGroups()
    // const user = await authApi.getCurrentUser(); // Not used currently for filtering

    const res = await halaqahApi.getAll();

    if (res.success) {
      myHalaqahs.value = res.data;

      if (myHalaqahs.value.length > 0) {
        // Keeps selection if valid, else selects first
        if (
          !selectedHalaqahId.value ||
          !myHalaqahs.value.find((h) => h.id === selectedHalaqahId.value)
        ) {
          selectedHalaqahId.value = myHalaqahs.value[0].id;
        }
        loadDateData();
        loadMonthlyStats();
      }
    } else {
      console.error("[TahfidzHalaqah] Failed to load halaqahs:", res.message);
      errorMessage.value = res.message || "Gagal memuat grup.";
    }
  } catch (e) {
    console.error("[TahfidzHalaqah] Exception in loadInitial:", e);
    errorMessage.value = e.message || "Kesalahan jaringan/sistem.";
  } finally {
    loadingHalaqah.value = false;
  }
}

// --- Modal & Actions ---
function openInputModal(item) {
  selectedStudent.value = item;

  // Reset form
  form.type = "ziyadah";
  form.juz = 1;
  form.surahName = "Al-Baqarah";
  form.ayatStart = 1;
  form.ayatEnd = 1;
  form.fluency = "lancar";
  form.notes = "";

  // Pre-fill if student has recent data or if edit mode (not implemented yet for edit)
  if (item.deposit) {
    // Edit mode
    form.type = item.deposit.type;
    form.surahName = item.deposit.surah || "Al-Baqarah";
    form.ayatStart = item.deposit.ayatStart;
    form.ayatEnd = item.deposit.ayatEnd;
    form.fluency = item.deposit.fluency;
    form.notes = item.deposit.notes;
  }

  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  selectedStudent.value = null;
}

async function submitDeposit() {
  if (!selectedStudent.value) return;

  saving.value = true;
  try {
    // Determine Teacher ID (Current User)
    const userRes = await authApi.getCurrentUser();
    // Fallback or explicit ID

    // Mock ID if not found (should be handled by backend auth middleware actually, but schema requires ID)
    // We'll hardcode 1 or use auth data
    const teacherId = userRes.data?.id || 1;

    const payload = {
      studentId: selectedStudent.value.student.id,
      teacherId: teacherId,
      depositDate: selectedDate.value,
      ...form,
      surahNumber: 1, // TODO: Map surah name to number
    };

    if (selectedStudent.value.deposit && selectedStudent.value.deposit.id) {
      // Edit Mode
      await tahfidzApi.updateDeposit(selectedStudent.value.deposit.id, payload);
    } else {
      // Create Mode
      await tahfidzApi.createDeposit(payload);
    }

    await loadDateData(); // Refresh list indicators
    closeModal();
  } catch (e) {
    alert("Gagal: " + e.message);
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadInitial();
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide Left (Next Month) */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.25s ease-out;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Slide Right (Prev Month) */
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
