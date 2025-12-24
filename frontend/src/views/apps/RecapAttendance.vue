<template>
  <div class="space-y-6 overflow-hidden max-w-full">
    <!-- Header & Filters -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
    >
      <div>
        <h1 class="text-xl font-bold text-slate-800">Rekap Absensi Guru</h1>
        <p class="text-sm text-slate-500 mt-1">
          Laporan rekapitulasi kehadiran.
        </p>
      </div>

      <div
        class="flex flex-col md:flex-row items-end md:items-center gap-3 w-full md:w-auto"
      >
        <!-- Filter Mode Toggle -->
        <div class="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            @click="filter.useCustomRange = false"
            class="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
            :class="
              !filter.useCustomRange
                ? 'bg-white shadow text-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            "
          >
            Periode Gaji
          </button>
          <button
            @click="filter.useCustomRange = true"
            class="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
            :class="
              filter.useCustomRange
                ? 'bg-white shadow text-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            "
          >
            Tanggal Custom
          </button>
        </div>

        <!-- Month/Year Selectors (Default Mode) -->
        <div v-if="!filter.useCustomRange" class="flex gap-2">
          <select
            v-model="filter.month"
            class="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="(m, i) in months" :key="i" :value="i + 1">
              {{ m }}
            </option>
          </select>

          <select
            v-model="filter.year"
            class="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>

        <!-- Custom Range Inputs -->
        <div v-else class="flex gap-2">
          <input
            type="date"
            v-model="filter.startDate"
            class="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span class="text-slate-400 self-center">-</span>
          <input
            type="date"
            v-model="filter.endDate"
            class="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <!-- Division Filter -->
        <select
          v-model="filter.divisionId"
          class="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[120px]"
        >
          <option value="">Semua Divisi</option>
          <option v-for="d in divisions" :key="d.id" :value="d.id">
            {{ d.name }}
          </option>
        </select>

        <!-- Actions -->
        <div class="flex gap-2">
          <!-- View Toggle -->
          <div
            class="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200"
          >
            <button
              @click="viewMode = 'table'"
              class="p-2 rounded-md transition-all flex items-center justify-center"
              :class="
                viewMode === 'table'
                  ? 'bg-white shadow text-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              "
              title="Tampilan Tabel"
            >
              <Icon icon="solar:list-bold-duotone" class="w-5 h-5" />
            </button>
            <button
              @click="viewMode = 'card'"
              class="p-2 rounded-md transition-all flex items-center justify-center"
              :class="
                viewMode === 'card'
                  ? 'bg-white shadow text-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              "
              title="Tampilan Kartu"
            >
              <Icon icon="solar:gallery-wide-bold-duotone" class="w-5 h-5" />
            </button>
          </div>

          <button
            @click="fetchRecap"
            class="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            title="Terapkan Filter"
          >
            <Icon
              icon="lucide:refresh-cw"
              class="w-5 h-5"
              :class="{ 'animate-spin': loading }"
            />
          </button>

          <button
            @click="exportToExcel"
            :disabled="loading || recapData.teachers.length === 0"
            class="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon icon="lucide:file-spreadsheet" class="w-5 h-5" />
            <span class="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Table View -->
    <div
      v-if="viewMode === 'table'"
      class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <!-- Legends -->
      <div
        class="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-6 text-xs"
      >
        <div class="flex items-center gap-2">
          <span
            class="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-200"
          ></span>
          <span class="text-slate-600">Hadir</span>
        </div>
        <div class="flex items-center gap-2">
          <span
            class="w-3 h-3 rounded-full bg-blue-100 border border-blue-200"
          ></span>
          <span class="text-slate-600">Izin</span>
        </div>
        <div class="flex items-center gap-2">
          <span
            class="w-3 h-3 rounded-full bg-amber-100 border border-amber-200"
          ></span>
          <span class="text-slate-600">Klaim (K)</span>
        </div>
        <div class="flex items-center gap-2">
          <span
            class="w-3 h-3 rounded-full bg-rose-50 border border-rose-100"
          ></span>
          <span class="text-slate-600">Libur Pekanan</span>
        </div>
      </div>

      <!-- Skeleton Loading -->
      <TableSkeleton
        v-if="loading"
        viewMode="table"
        :rows="8"
        :columnCount="10"
        class="p-4"
      />

      <!-- Table Wrapper -->
      <div v-else class="overflow-x-auto relative">
        <table class="w-full text-xs text-left whitespace-nowrap">
          <thead
            class="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10"
          >
            <tr>
              <!-- Fixed Columns -->
              <th
                class="px-4 py-3 font-semibold sticky left-0 bg-slate-50 z-20 border-r border-slate-100 w-12"
              >
                No
              </th>
              <th
                class="px-4 py-3 font-semibold sticky left-12 bg-slate-50 z-20 border-r border-slate-100 w-48"
              >
                Nama Guru
              </th>
              <th
                class="px-4 py-3 font-semibold border-r border-slate-100 w-32"
              >
                NIP
              </th>
              <th
                class="px-4 py-3 font-semibold border-r border-slate-100 w-32"
              >
                Divisi
              </th>

              <!-- Date Columns -->
              <th
                v-for="date in dateRange"
                :key="date.iso"
                class="px-2 py-3 font-semibold text-center border-r border-slate-200 min-w-[50px]"
                :class="{ 'bg-rose-50 text-rose-600': isHoliday(date.obj) }"
              >
                <div class="flex flex-col items-center">
                  <span>{{ date.day }}</span>
                  <span class="text-[10px] font-normal uppercase">{{
                    date.dayName
                  }}</span>
                </div>
              </th>

              <!-- Summary Columns -->
              <th
                class="px-4 py-3 font-semibold text-center border-l border-slate-200 bg-slate-50"
              >
                Hari Aktif
              </th>
              <th class="px-4 py-3 font-semibold text-center">Jml Hadir</th>
              <th class="px-4 py-3 font-semibold text-center">Jml Jam</th>
              <th class="px-4 py-3 font-semibold text-center text-rose-600">
                Izin Potong
              </th>
              <th class="px-4 py-3 font-semibold text-center text-emerald-600">
                Izin Tanpa Potong
              </th>
              <th
                class="px-4 py-3 font-semibold text-center bg-indigo-50 text-indigo-700"
              >
                Hari Dibayar
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(teacher, idx) in recapData.teachers"
              :key="teacher.id"
              class="hover:bg-slate-50/50 transition-colors"
            >
              <!-- Fixed Info -->
              <td
                class="px-4 py-3 text-slate-500 sticky left-0 bg-white z-20 border-r border-slate-100"
              >
                {{ idx + 1 }}
              </td>
              <td
                class="px-4 py-3 font-medium text-slate-800 sticky left-12 bg-white z-20 border-r border-slate-100"
              >
                {{ teacher.name }}
              </td>
              <td class="px-4 py-3 text-slate-500 border-r border-slate-100">
                {{ teacher.nip || "-" }}
              </td>
              <td class="px-4 py-3 text-slate-500 border-r border-slate-100">
                {{ teacher.division || "-" }}
              </td>

              <!-- Date Cells -->
              <td
                v-for="date in dateRange"
                :key="date.iso"
                class="px-1 py-2 text-center border-r border-slate-100 relative"
                :class="{ 'bg-rose-50/50': isHoliday(date.obj) }"
              >
                <template v-if="teacher.daily[date.iso]">
                  <!-- Present (Claim) -->
                  <div
                    v-if="
                      teacher.daily[date.iso].status === 'present' &&
                      teacher.daily[date.iso].isClaim
                    "
                    "
                    class="flex flex-col items-center justify-center gap-0.5"
                  >
                    <span
                      class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold text-[10px] cursor-pointer hover:bg-amber-200 hover:scale-105 transition-all"
                      title="Klaim Kehadiran (Klik untuk hapus)"
                      @click.stop="handleKClick(teacher.daily[date.iso])"
                      >K</span
                    >
                    <span
                      class="text-[10px] text-slate-500"
                      v-if="teacher.daily[date.iso].totalMinutes > 0"
                    >
                      {{
                        (teacher.daily[date.iso].totalMinutes / 60).toFixed(1)
                      }}h
                    </span>
                  </div>
                  <!-- Present (Normal) -->
                  <div
                    v-else-if="teacher.daily[date.iso].status === 'present'"
                    class="flex flex-col items-center justify-center gap-0.5"
                  >
                    <span
                      class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]"
                      >H</span
                    >
                    <span
                      class="text-[10px] text-slate-500"
                      v-if="teacher.daily[date.iso].totalMinutes > 0"
                    >
                      {{
                        (teacher.daily[date.iso].totalMinutes / 60).toFixed(1)
                      }}h
                    </span>
                  </div>
                  <!-- Permitted (Potong) -->
                  <div
                    v-else-if="
                      ['permitted', 'permit_deduct', 'sick_deduct'].includes(
                        teacher.daily[date.iso].status
                      )
                    "
                  >
                    <span
                      class="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]"
                      title="Izin Potong Gaji"
                      >IP</span
                    >
                  </div>
                  <!-- Permitted (Tidak Potong) / Termasuk kehadiran -->
                  <div
                    v-else-if="
                      ['permit_no_deduct', 'sick_no_deduct'].includes(
                        teacher.daily[date.iso].status
                      )
                    "
                  >
                    <span
                      class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]"
                      title="Izin Tanpa Potong"
                      >IT</span
                    >
                  </div>
                  <!-- Sick (legacy) -->
                  <div v-else-if="teacher.daily[date.iso].status === 'sick'">
                    <span
                      class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold text-[10px]"
                      >S</span
                    >
                  </div>
                  <!-- Other -->
                  <div v-else>
                    <span class="text-slate-300">-</span>
                  </div>
                </template>
                <span v-else class="text-slate-200">-</span>
              </td>

              <!-- Summaries -->
              <td
                class="px-4 py-3 text-center border-l font-medium text-slate-700 bg-slate-50/30"
              >
                {{ teacher.stats.activeDays }}
              </td>
              <td class="px-4 py-3 text-center font-bold text-emerald-600">
                {{ teacher.stats.presence }}
              </td>
              <td class="px-4 py-3 text-center font-medium text-slate-600">
                {{ teacher.stats.hours }}
              </td>
              <td class="px-4 py-3 text-center font-medium text-rose-600">
                {{ teacher.stats.permitDeduct || 0 }}
              </td>
              <td class="px-4 py-3 text-center font-medium text-emerald-600">
                {{ teacher.stats.permitNoDeduct || 0 }}
              </td>
              <td
                class="px-4 py-3 text-center font-bold text-indigo-700 bg-indigo-50/30"
              >
                {{
                  teacher.stats.presence + (teacher.stats.permitNoDeduct || 0)
                }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- No Data -->
        <div
          v-if="!loading && recapData.teachers.length === 0"
          class="p-12 text-center text-slate-400"
        >
          <Icon
            icon="lucide:clipboard-x"
            class="w-12 h-12 mx-auto mb-3 opacity-50"
          />
          <p>Tidak ada data absensi untuk periode ini.</p>
        </div>
      </div>
    </div>

    <!-- Card View -->
    <div v-else-if="viewMode === 'card'" class="space-y-3">


      <!-- Skeleton Loading -->
      <TableSkeleton v-if="loading" viewMode="card" :rows="6" class="p-2" />

      <template v-else>
        <div
          v-if="recapData.teachers.length === 0"
          class="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400"
        >
          <Icon
            icon="lucide:clipboard-x"
            class="w-12 h-12 mx-auto mb-3 opacity-50"
          />
          <p>Tidak ada data absensi untuk periode ini.</p>
        </div>
        <div
          v-for="(teacher, idx) in recapData.teachers"
          :key="teacher.id"
          class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between gap-3 mb-3">
            <div>
              <div class="font-medium text-slate-800">{{ teacher.name }}</div>
              <div class="text-xs text-slate-400">
                {{ teacher.nip || "-" }} · {{ teacher.division || "-" }}
              </div>
            </div>
            <span class="text-xs text-slate-400">#{{ idx + 1 }}</span>
          </div>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-slate-50 rounded-lg p-2">
              <div class="text-lg font-bold text-slate-700">
                {{ teacher.stats.activeDays }}
              </div>
              <div class="text-xs text-slate-500">Hari Aktif</div>
            </div>
            <div class="bg-emerald-50 rounded-lg p-2">
              <div class="text-lg font-bold text-emerald-600">
                {{ teacher.stats.presence }}
              </div>
              <div class="text-xs text-emerald-600">Hadir</div>
            </div>
            <div class="bg-indigo-50 rounded-lg p-2">
              <div class="text-lg font-bold text-indigo-700">
                {{
                  teacher.stats.presence + (teacher.stats.permitNoDeduct || 0)
                }}
              </div>
              <div class="text-xs text-indigo-600">Hari Dibayar</div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3 text-center mt-2">
            <div class="bg-slate-50 rounded-lg p-2">
              <div class="text-sm font-semibold text-slate-600">
                {{ teacher.stats.hours }}h
              </div>
              <div class="text-xs text-slate-500">Total Jam</div>
            </div>
            <div class="bg-rose-50 rounded-lg p-2">
              <div class="text-sm font-semibold text-rose-600">
                {{ teacher.stats.permitDeduct || 0 }}
              </div>
              <div class="text-xs text-rose-500">Izin Potong</div>
            </div>
            <div class="bg-emerald-50 rounded-lg p-2">
              <div class="text-sm font-semibold text-emerald-600">
                {{ teacher.stats.permitNoDeduct || 0 }}
              </div>
              <div class="text-xs text-emerald-500">Izin Tidak Potong</div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading && recapData.teachers.length === 0"
      class="h-64 flex items-center justify-center"
    >
      <div class="flex flex-col items-center gap-3 text-slate-400">
        <Icon icon="lucide:loader-2" class="w-8 h-8 animate-spin" />
        <span class="text-sm">Memuat data rekap...</span>
      </div>
    </div>
    <!-- Modals -->
    <ConfirmModal
      :isOpen="confirmModal.isOpen"
      :title="confirmModal.title"
      :message="confirmModal.message"
      confirmText="Hapus"
      cancelText="Batal"
      confirmType="danger"
      @confirm="confirmDeleteClaim"
      @cancel="confirmModal.isOpen = false"
    />

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
import { ref, onMounted, reactive, computed } from "vue";
import { Icon } from "@iconify/vue";
import { attendanceApi, settingsApi, divisionsApi } from "@/services/api";
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { saveAs } from "file-saver";
import TableSkeleton from "@/components/ui/TableSkeleton.vue";
import StatusModal from "@/components/ui/StatusModal.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";

// Responsive default: card for mobile (<768px), table for desktop
const isDesktop = window.matchMedia("(min-width: 768px)").matches;
const viewMode = ref(isDesktop ? "table" : "card");

// Constants
const months = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const years = computed(() => {
  const current = new Date().getFullYear();
  return [current - 1, current, current + 1];
});

// State
const filter = reactive({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  startDate: "",
  endDate: "",
  divisionId: "",
  useCustomRange: false,
});
const loading = ref(false);
const recapData = reactive({
  period: { start: "", end: "" },
  teachers: [],
});
const holidays = ref([0]); // Default Sunday
const divisions = ref([]);

// Modals
const confirmModal = reactive({
  isOpen: false,
  title: "",
  message: "",
  item: null,
});
const statusModal = reactive({
  isOpen: false,
  type: "success",
  title: "",
  message: "",
});

// Computed Date Range for Headers
const dateRange = computed(() => {
  if (!recapData.period.start || !recapData.period.end) return [];

  const dates = [];
  let curr = new Date(recapData.period.start);
  const end = new Date(recapData.period.end);
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  while (curr <= end) {
    dates.push({
      iso: curr.toISOString().split("T")[0],
      day: curr.getDate(),
      dayName: dayNames[curr.getDay()],
      obj: new Date(curr),
    });
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
});

function isHoliday(dateObj) {
  return holidays.value.includes(dateObj.getDay());
}

// Fetch Data
async function fetchRecap() {
  loading.value = true;
  try {
    // 1. Fetch Holidays Setting
    try {
      const sRes = await settingsApi.getAll(["attendance_holidays"]);
      if (sRes.data.attendance_holidays) {
        holidays.value = JSON.parse(sRes.data.attendance_holidays);
      }
    } catch (e) {
      /* ignore */
    }

    // 2. Fetch Recap
    const params = {};
    if (filter.useCustomRange && filter.startDate && filter.endDate) {
      params.startDate = filter.startDate;
      params.endDate = filter.endDate;
    } else {
      params.month = filter.month;
      params.year = filter.year;
    }

    if (filter.divisionId) {
      params.divisionId = filter.divisionId;
    }

    const res = await attendanceApi.getRecap(params);

    if (res.success) {
      recapData.period = res.data.period;
      recapData.teachers = res.data.teachers;
    }
  } catch (e) {
    console.error("Failed recap", e);
  } finally {
    loading.value = false;
  }
}

async function fetchDivisions() {
  try {
    const res = await divisionsApi.getAll();
    if (res.success) {
      divisions.value = res.data;
    }
  } catch (e) {
    console.error("Failed to fetch divisions", e);
  }
}

async function exportToExcel() {
  if (!recapData.teachers.length) return;

  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Rekap Absensi");

    // Columns
    const columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Nama Guru", key: "name", width: 30 },
      { header: "NIP", key: "nip", width: 15 },
      { header: "Divisi", key: "division", width: 15 },
    ];

    // Add Date Columns
    dateRange.value.forEach((d) => {
      columns.push({
        header: `${d.day}`,
        key: d.iso,
        width: 5,
        style: { alignment: { horizontal: "center" } },
      });
    });

    // Add Summary Columns
    columns.push({ header: "Hadir", key: "presence", width: 8 });
    columns.push({ header: "Jam", key: "hours", width: 8 });
    columns.push({ header: "Izin Potong", key: "permitDeduct", width: 12 });
    columns.push({
      header: "Izin Tanpa Potong",
      key: "permitNoDeduct",
      width: 16,
    });
    columns.push({ header: "Hari Dibayar", key: "paidDays", width: 12 });

    sheet.columns = columns;

    // Header Style
    const headerRow = sheet.getRow(1);
    for (let i = 1; i <= columns.length; i++) {
      const cell = headerRow.getCell(i);
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4F46E5" }, // Indigo 600
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }

    // Data Rows
    recapData.teachers.forEach((t, index) => {
      const rowData = {
        no: index + 1,
        name: t.name,
        nip: t.nip || "-",
        division: t.division || "-",
        presence: t.stats.presence,
        hours: t.stats.hours,
        permitDeduct: t.stats.permitDeduct || 0,
        permitNoDeduct: t.stats.permitNoDeduct || 0,
        paidDays: t.stats.presence + (t.stats.permitNoDeduct || 0),
      };

      // Date Data
      dateRange.value.forEach((d) => {
        const dayData = t.daily[d.iso];
        if (dayData) {
          if (dayData.status === "present" && dayData.isClaim)
            rowData[d.iso] = "K";
          else if (dayData.status === "present") rowData[d.iso] = "H";
          else if (
            ["permitted", "permit_deduct", "sick_deduct"].includes(
              dayData.status
            )
          )
            rowData[d.iso] = "IP";
          else if (
            ["permit_no_deduct", "sick_no_deduct"].includes(dayData.status)
          )
            rowData[d.iso] = "IT";
          else if (dayData.status === "sick") rowData[d.iso] = "S";
          else rowData[d.iso] = "";
        } else {
          rowData[d.iso] = "";
        }
      });

      const row = sheet.addRow(rowData);

      // Styling for Data Cells
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        // Colorize specific cells (Date columns start at index 5)
        if (colNumber > 4 && colNumber <= 4 + dateRange.value.length) {
          const val = cell.value;
          if (val === "H") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFD1FAE5" },
            }; // Emerald 100
            cell.font = { color: { argb: "FF047857" }, bold: true }; // Emerald 700
          } else if (val === "I") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFDBEAFE" },
            }; // Blue 100
            cell.font = { color: { argb: "FF1D4ED8" }, bold: true }; // Blue 700
          } else if (val === "S") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFEF3C7" },
            }; // Amber 100
            cell.font = { color: { argb: "FFB45309" }, bold: true }; // Amber 700
          }

          // Check for Holiday (using column header index against dateRange)
          const dateIdx = colNumber - 5;
          if (dateIdx >= 0 && dateIdx < dateRange.value.length) {
            const dObj = dateRange.value[dateIdx].obj;
            if (isHoliday(dObj)) {
              // Apply holiday style if cell is empty (or override?)
              // Usually holiday background is for the whole column.
              // ExcelJS doesn't support column styling easily mixed with cell styling.
              // Let's just color red text for holiday header? Or background for empty cells.
              if (!val) {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFFFF1F2" },
                }; // Rose 50
              }
            }
          }
        }
      });
    });

    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "rekap-absensi.xlsx");
  } catch (error) {
    console.error("Export Error:", error);
    alert("Gagal export excel: " + error.message);
  }
}

// === Delete Claim Logic ===
function handleKClick(dayData) {
  // Only allow if it's a claim and has an ID
  if (dayData.isClaim && dayData.attendanceId) {
    confirmModal.item = dayData;
    confirmModal.title = "Hapus Klaim Kehadiran?";
    confirmModal.message =
      "Apakah Anda yakin ingin menghapus data klaim ini? Tindakan ini tidak dapat dibatalkan.";
    confirmModal.isOpen = true;
  }
}

async function confirmDeleteClaim() {
  if (!confirmModal.item) return;
  confirmModal.isOpen = false;
  loading.value = true;
  try {
    await attendanceApi.deleteTeacherAttendance(confirmModal.item.attendanceId);
    
    // Refresh data
    await fetchRecap();

    // Show success
    statusModal.type = "success";
    statusModal.title = "Berhasil";
    statusModal.message = "Data klaim kehadiran berhasil dihapus.";
    statusModal.isOpen = true;
  } catch (error) {
    console.error("Delete claim error:", error);
    statusModal.type = "error";
    statusModal.title = "Gagal";
    statusModal.message = error.message || "Gagal menghapus data.";
    statusModal.isOpen = true;
  } finally {
    loading.value = false;
    confirmModal.item = null;
  }
}

onMounted(() => {
  fetchDivisions();
  fetchRecap();
});
</script>

<style scoped>
/* Custom scrollbar for table */
.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
}
.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}
.overflow-x-auto::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 4px;
}
</style>
