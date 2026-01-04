<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Dashboard Klinik</h1>
        <p class="text-slate-500">
          Ringkasan operasional klinik hari ini, {{ todayFormatted }}.
        </p>
      </div>
      <div class="flex gap-2">
        <button
          @click="$router.push('/apps/clinic/examinations')"
          class="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition flex items-center gap-2"
        >
          <Icon icon="solar:stethoscope-bold" />
          Periksa Pasien
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- Patients Today -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-3 mb-2">
          <div
            class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"
          >
            <Icon icon="solar:user-plus-bold-duotone" class="text-xl" />
          </div>
          <span class="text-slate-500 text-sm font-medium"
            >Pasien Hari Ini</span
          >
        </div>
        <div class="text-2xl font-bold text-slate-800">
          {{ stats.todayPatients }}
        </div>
      </div>

      <!-- Active Inpatients -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-3 mb-2">
          <div
            class="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center"
          >
            <Icon icon="solar:bed-bold-duotone" class="text-xl" />
          </div>
          <span class="text-slate-500 text-sm font-medium">Rawat Inap</span>
        </div>
        <div class="text-2xl font-bold text-slate-800">
          {{ stats.activeInpatients }}
        </div>
      </div>

      <!-- Low Stock Medicines -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-3 mb-2">
          <div
            class="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center"
          >
            <Icon icon="solar:pill-bold-duotone" class="text-xl" />
          </div>
          <span class="text-slate-500 text-sm font-medium">Stok Menipis</span>
        </div>
        <div class="text-2xl font-bold text-slate-800">
          {{ stats.lowStockMedicines }}
        </div>
      </div>

      <!-- Total Medicines -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-3 mb-2">
          <div
            class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"
          >
            <Icon icon="solar:medical-kit-bold-duotone" class="text-xl" />
          </div>
          <span class="text-slate-500 text-sm font-medium">Total Obat</span>
        </div>
        <div class="text-2xl font-bold text-slate-800">
          {{ stats.totalMedicines }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Activity (Left 2 cols) -->
      <div class="lg:col-span-2 space-y-6">
        <div
          class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <div
            class="p-4 border-b border-slate-100 flex justify-between items-center"
          >
            <h3 class="font-semibold text-slate-800">Pemeriksaan Terakhir</h3>
            <button
              @click="$router.push('/apps/clinic/examinations')"
              class="text-xs text-blue-600 font-medium hover:underline"
            >
              Lihat Semua
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead
                class="bg-slate-50 text-slate-500 border-b border-slate-100"
              >
                <tr>
                  <th class="text-left py-3 px-4 font-medium">Waktu</th>
                  <th class="text-left py-3 px-4 font-medium">Santri</th>
                  <th class="text-left py-3 px-4 font-medium">Diagnosa</th>
                  <th class="text-left py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="exam in recentExaminations"
                  :key="exam.id"
                  class="hover:bg-slate-50/50"
                >
                  <td class="py-3 px-4 text-slate-500">
                    {{ formatDate(exam.createdAt) }}
                  </td>
                  <td class="py-3 px-4 font-medium text-slate-800">
                    {{ exam.studentName }}
                  </td>
                  <td class="py-3 px-4 text-slate-600 truncate max-w-[150px]">
                    {{ exam.diagnosis || "-" }}
                  </td>
                  <td class="py-3 px-4">
                    <span
                      class="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"
                      >Selesai</span
                    >
                  </td>
                </tr>
                <tr v-if="recentExaminations.length === 0">
                  <td colspan="4" class="py-8 text-center text-slate-400">
                    Belum ada pemeriksaan hari ini
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Low Stock Alert List -->
        <div
          v-if="lowStockItems.length > 0"
          class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <div
            class="p-4 border-b border-slate-100 bg-red-50/30 flex justify-between items-center"
          >
            <h3 class="font-semibold text-red-800 flex items-center gap-2">
              <Icon icon="solar:danger-triangle-bold" />
              Peringatan Stok Obat
            </h3>
            <button
              @click="$router.push('/apps/clinic/medicines')"
              class="text-xs text-red-600 font-medium hover:underline"
            >
              Kelola Stok
            </button>
          </div>
          <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="med in lowStockItems"
              :key="med.id"
              class="flex items-center justify-between p-3 rounded-lg border border-red-100 bg-red-50/10"
            >
              <div>
                <div class="font-medium text-slate-800">{{ med.name }}</div>
                <div class="text-xs text-slate-500">{{ med.category }}</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-red-600">
                  {{ med.stock }} {{ med.unit }}
                </div>
                <div class="text-xs text-slate-400">
                  Min: {{ med.minStock }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Occupied Beds & Quick Stats -->
      <div class="space-y-6">
        <!-- Bed Status -->
        <div
          class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <div class="p-4 border-b border-slate-100">
            <h3 class="font-semibold text-slate-800">Status Rawat Inap</h3>
          </div>
          <div class="p-4">
            <div class="p-4 space-y-6">
              <div
                v-for="room in roomsList"
                :key="room.id"
                class="border-b border-slate-50 last:border-0 pb-4 last:pb-0"
              >
                <div class="flex justify-between items-center mb-2">
                  <h4 class="font-semibold text-sm text-slate-700">
                    {{ room.name }}
                  </h4>
                  <span class="text-xs text-slate-500">
                    {{ room.occupied }} / {{ room.capacity }}
                  </span>
                </div>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="n in room.capacity"
                    :key="n"
                    class="w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all relative group"
                    :class="[
                      (room.occupiedBedNumbers || []).some(
                        (b) => Number(b) === n
                      )
                        ? 'bg-red-100 text-red-700 border border-red-200 cursor-help'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200',
                    ]"
                  >
                    {{ n }}
                    <!-- Simple Tooltip -->
                    <div
                      v-if="
                        (room.occupiedBedNumbers || []).some(
                          (b) => Number(b) === n
                        )
                      "
                      class="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 shadow-lg"
                    >
                      Terisi
                    </div>
                  </div>
                </div>
              </div>

              <button
                @click="$router.push('/apps/clinic/inpatients')"
                class="w-full mt-2 py-2 text-sm text-center border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Lihat Detail Rawat Inap
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { Icon } from "@iconify/vue";
import { clinicApi, studentsApi, request } from "@/services/api";

const loading = ref(true);
const stats = ref({
  todayPatients: 0,
  activeInpatients: 0,
  lowStockMedicines: 0,
  totalMedicines: 0,
});

const recentExaminations = ref([]);
const lowStockItems = ref([]);
const activeInpatientsList = ref([]);
const roomsList = ref([]);

const todayFormatted = computed(() => {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

async function loadData() {
  loading.value = true;
  try {
    // Parallel fetch for efficiency
    const [medsRes, patientsRes, examsRes, roomsRes] = await Promise.all([
      clinicApi.getMedicines(),
      clinicApi.getInpatients({ status: "admitted" }),
      clinicApi.getExaminations(),
      request("/api/clinic/rooms"), // Use request helper or add to clinicApi
    ]);

    const medicines = medsRes.data || [];
    const inpatients = patientsRes.data || [];
    const examinations = examsRes.data || [];

    // Process Medicines
    stats.value.totalMedicines = medicines.length;
    const lowStock = medicines.filter((m) => m.stock <= (m.minStock || 10));
    stats.value.lowStockMedicines = lowStock.length;
    lowStockItems.value = lowStock.slice(0, 4); // Top 4 low stock

    // Process Inpatients
    stats.value.activeInpatients = inpatients.length;
    // Enhance inpatient data with student names if missing (API usually populates student)
    activeInpatientsList.value = inpatients.map((p) => ({
      ...p,
      studentName: p.student?.fullName || `Santri #${p.studentId}`,
    }));

    // Process Examinations (Today Only)
    const today = new Date().toISOString().split("T")[0];
    const todayExams = examinations.filter(
      (e) => e.date === today || (e.createdAt && e.createdAt.startsWith(today))
    );

    stats.value.todayPatients = todayExams.length;

    // Recent exams list (take last 5)
    recentExaminations.value = todayExams
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
      )
      .slice(0, 5)
      .map((e) => ({
        ...e,
        studentName: e.student?.fullName || e.patientName,
      }));

    // Process Rooms
    roomsList.value = Array.isArray(roomsRes?.data) ? roomsRes.data : [];
  } catch (err) {
    console.error("Failed to load dashboard data", err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>
