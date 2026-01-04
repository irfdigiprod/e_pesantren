<template>
  <div class="p-6 space-y-6">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Laporan Klinik</h1>
        <p class="text-slate-500">
          Rekapitulasi kunjungan dan diagnosa penyakit.
        </p>
      </div>

      <!-- Date Filter -->
      <div
        class="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm"
      >
        <input
          type="date"
          v-model="filters.startDate"
          class="text-sm border-none focus:ring-0 text-slate-600"
        />
        <span class="text-slate-400">-</span>
        <input
          type="date"
          v-model="filters.endDate"
          class="text-sm border-none focus:ring-0 text-slate-600"
        />
        <button
          @click="fetchReports"
          class="px-3 py-1.5 bg-[#602515] text-white rounded text-sm hover:bg-[#4a1d10] transition"
        >
          Tampilkan
        </button>
      </div>
    </div>

    <!-- Stats Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div
        class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4"
      >
        <div
          class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-2xl"
        >
          <Icon icon="solar:users-group-rounded-bold-duotone" />
        </div>
        <div>
          <div class="text-sm text-slate-500 font-medium">Total Kunjungan</div>
          <div class="text-2xl font-bold text-slate-800">{{ totalVisits }}</div>
        </div>
      </div>
      <div
        class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4"
      >
        <div
          class="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-2xl"
        >
          <Icon icon="solar:heart-pulse-bold-duotone" />
        </div>
        <div>
          <div class="text-sm text-slate-500 font-medium">
            Diagnosa Terbanyak
          </div>
          <div
            class="text-lg font-bold text-slate-800 truncate max-w-[150px]"
            :title="topDisease"
          >
            {{ topDisease }}
          </div>
        </div>
      </div>
      <div
        class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4"
      >
        <div
          class="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-2xl"
        >
          <Icon icon="solar:user-id-bold-duotone" />
        </div>
        <div>
          <div class="text-sm text-slate-500 font-medium">Mayoritas Pasien</div>
          <div class="text-lg font-bold text-slate-800">
            {{ topPatientType }}
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Top 10 Diseases -->
      <div
        class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
      >
        <div
          class="p-4 border-b border-slate-100 font-bold text-slate-800 flex justify-between items-center"
        >
          <h3>10 Diagnosa Penyakit Terbanyak</h3>
          <Icon icon="solar:virus-bold-duotone" class="text-slate-400" />
        </div>
        <div class="p-4 space-y-4">
          <div
            v-if="reports.diseases.length === 0"
            class="text-center text-slate-400 py-8 text-sm"
          >
            Tidak ada data pada periode ini
          </div>
          <div
            v-for="(item, idx) in reports.diseases"
            :key="idx"
            class="relative group"
          >
            <div class="flex justify-between text-sm mb-1">
              <span class="font-medium text-slate-700"
                >{{ idx + 1 }}. {{ item.name }}</span
              >
              <span class="font-bold text-slate-600">{{ item.count }}</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2">
              <div
                class="bg-blue-500 h-2 rounded-full transition-all duration-500"
                :style="{ width: `${(item.count / maxDiseaseCount) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Visits Trend & Patient Type -->
      <div class="space-y-6">
        <!-- Patient Types -->
        <div
          class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <div class="p-4 border-b border-slate-100 font-bold text-slate-800">
            Distribusi Tipe Pasien
          </div>
          <div class="p-4 grid grid-cols-3 gap-4">
            <div
              v-for="pt in patientDistribution"
              :key="pt.label"
              class="text-center p-3 rounded-lg border border-slate-50 bg-slate-50/50"
            >
              <div class="text-xs text-slate-500 mb-1 font-semibold uppercase">
                {{ pt.label }}
              </div>
              <div class="text-xl font-bold" :class="pt.color">
                {{ pt.count }}
              </div>
              <div class="text-[10px] text-slate-400">{{ pt.percent }}%</div>
            </div>
          </div>
        </div>

        <!-- Daily Visits Table -->
        <div
          class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex-1"
        >
          <div class="p-4 border-b border-slate-100 font-bold text-slate-800">
            Kunjungan Harian (Detail)
          </div>
          <div class="max-h-[300px] overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 text-slate-500 sticky top-0">
                <tr>
                  <th class="text-left py-2 px-4">Tanggal</th>
                  <th class="text-right py-2 px-4">Jumlah Kunjungan</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-for="(v, i) in reports.visits" :key="i">
                  <td class="py-2 px-4 text-slate-600">
                    {{ formatDate(v.date) }}
                  </td>
                  <td class="py-2 px-4 text-slate-800 font-medium text-right">
                    {{ v.count }}
                  </td>
                </tr>
                <tr v-if="reports.visits.length === 0">
                  <td colspan="2" class="text-center py-4 text-slate-400">
                    Tidak ada data
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <StatusModal
    :isOpen="statusModal.open"
    :type="statusModal.status"
    :message="statusModal.message"
    :title="statusModal.title"
    @close="statusModal.open = false"
  />
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { Icon } from "@iconify/vue";
import StatusModal from "@/components/ui/StatusModal.vue";
import { request } from "@/services/api";

const loading = ref(false);
const filters = reactive({
  startDate: new Date(new Date().setDate(new Date().getDate() - 30))
    .toISOString()
    .split("T")[0],
  endDate: new Date().toISOString().split("T")[0],
});

const statusModal = reactive({
  open: false,
  status: "success",
  title: "",
  message: "",
});

const reports = reactive({
  visits: [],
  diseases: [],
  patientTypes: [],
});

const totalVisits = computed(() =>
  reports.visits.reduce((acc, curr) => acc + Number(curr.count), 0)
);
const maxDiseaseCount = computed(() =>
  Math.max(...reports.diseases.map((d) => Number(d.count)), 1)
);
const topDisease = computed(() =>
  reports.diseases.length > 0 ? reports.diseases[0].name : "-"
);
const topPatientType = computed(() => {
  if (!reports.patientTypes.length) return "-";
  const sorted = [...reports.patientTypes].sort(
    (a, b) => Number(b.count) - Number(a.count)
  );
  const map = { student: "Santri", teacher: "Guru", external: "Umum" };
  return map[sorted[0].type] || sorted[0].type;
});

const patientDistribution = computed(() => {
  const total =
    reports.patientTypes.reduce((acc, curr) => acc + Number(curr.count), 0) ||
    1;
  const map = { student: "Santri", teacher: "Guru", external: "Umum" };
  const colors = {
    student: "text-blue-600",
    teacher: "text-amber-600",
    external: "text-slate-600",
  };

  // Ensure all types are represented even if 0
  const types = ["student", "teacher", "external"];
  return types.map((t) => {
    const found = reports.patientTypes.find((p) => p.type === t);
    const count = found ? Number(found.count) : 0;
    return {
      label: map[t],
      count: count,
      percent: Math.round((count / total) * 100),
      color: colors[t],
    };
  });
});

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function fetchReports() {
  loading.value = true;
  try {
    const query = new URLSearchParams(filters).toString();
    const res = await request(`/api/clinic/reports/summary?${query}`);
    if (res.success) {
      reports.visits = res.data.visits || [];
      reports.diseases = res.data.diseases || [];
      reports.patientTypes = res.data.patientTypes || [];
    }
  } catch (e) {
    console.error(e);
    statusModal.status = "error";
    statusModal.title = "Gagal";
    statusModal.message = "Gagal memuat laporan";
    statusModal.open = true;
  } finally {
    loading.value = false;
  }
}

onMounted(fetchReports);
</script>
