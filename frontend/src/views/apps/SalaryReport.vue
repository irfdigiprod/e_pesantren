<template>
  <div class="max-w-6xl mx-auto pb-12">
    <!-- Header -->
    <div
      class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Laporan Gaji Pegawai</h1>
        <p class="text-slate-500 mt-1">
          Rekapitulasi perhitungan gaji pegawai berdasarkan absensi dan komponen
          tunjangan.
        </p>
      </div>
    </div>

    <!-- Filters & Actions Row -->
    <div
      class="mb-6 flex flex-col lg:flex-row items-start lg:items-center gap-3 flex-wrap bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
    >
      <!-- View Toggle -->
      <div class="bg-slate-100 p-1 rounded-lg flex items-center">
        <button
          @click="viewMode = 'table'"
          class="p-1.5 rounded-md transition-all"
          :class="
            viewMode === 'table'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          "
        >
          <Icon icon="lucide:table-2" class="w-5 h-5" />
        </button>
        <button
          @click="viewMode = 'card'"
          class="p-1.5 rounded-md transition-all"
          :class="
            viewMode === 'card'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          "
        >
          <Icon icon="lucide:layout-grid" class="w-5 h-5" />
        </button>
      </div>

      <!-- Date Filters -->
      <div class="flex items-center gap-2">
        <label class="text-sm text-slate-500">Dari:</label>
        <input
          v-model="filter.startDate"
          type="date"
          @change="loadData"
          class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm text-slate-500">Sampai:</label>
        <input
          v-model="filter.endDate"
          type="date"
          @change="loadData"
          class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <!-- Division Filter -->
      <select
        v-model="filter.divisionId"
        class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100"
      >
        <option value="">Semua Divisi</option>
        <option v-for="div in divisions" :key="div.id" :value="div.id">
          {{ div.name }}
        </option>
      </select>

      <!-- Grade Filter -->
      <select
        v-model="filter.gradeId"
        class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100"
      >
        <option value="">Semua Golongan</option>
        <option v-for="g in grades" :key="g.id" :value="g.id">
          {{ g.name }}
        </option>
      </select>

      <!-- Gender Filter -->
      <select
        v-model="filter.gender"
        class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100"
      >
        <option value="">Semua Gender</option>
        <option value="male">Laki-laki</option>
        <option value="female">Perempuan</option>
      </select>

      <!-- Refresh Button -->
      <button
        @click="loadData"
        class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
        title="Refresh"
      >
        <Icon
          icon="lucide:refresh-cw"
          class="w-5 h-5"
          :class="{ 'animate-spin': loading }"
        />
      </button>

      <!-- Spacer -->
      <div class="flex-grow"></div>

      <!-- Export Excel Button -->
      <button
        @click="exportToExcel"
        :disabled="exporting || filteredData.length === 0"
        class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Icon
          v-if="exporting"
          icon="lucide:loader-2"
          class="w-4 h-4 animate-spin"
        />
        <Icon v-else icon="lucide:file-spreadsheet" class="w-4 h-4" />
        Export Excel
      </button>
    </div>

    <!-- Content -->
    <div
      v-if="loading"
      class="p-12 text-center bg-white rounded-xl shadow-sm border border-slate-200"
    >
      <Icon
        icon="lucide:loader-2"
        class="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2"
      />
      <p class="text-slate-500">Menghitung gaji...</p>
    </div>

    <div
      v-else-if="error"
      class="p-12 text-center text-red-500 bg-white rounded-xl shadow-sm border border-slate-200"
    >
      <Icon icon="lucide:alert-circle" class="w-8 h-8 mx-auto mb-2" />
      <p>{{ error }}</p>
    </div>

    <div v-else>
      <!-- TABLE VIEW -->
      <div
        v-if="viewMode === 'table'"
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead
              class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200"
            >
              <tr>
                <th class="px-6 py-3">Nama Pegawai</th>
                <th class="px-6 py-3">Golongan</th>
                <th class="px-6 py-3 text-right">Gaji Pokok</th>
                <th class="px-6 py-3 text-center">Kehadiran</th>
                <th class="px-6 py-3 text-right">Tun. Kehadiran</th>
                <th class="px-6 py-3 text-right">Tun. Jabatan</th>
                <th class="px-6 py-3 text-right">Tun. Jam Ajar</th>
                <th class="px-6 py-3 text-right">Tun. Lainnya</th>
                <th class="px-6 py-3 text-right font-bold text-slate-800">
                  Total Gaji
                </th>
                <th class="px-6 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="row in filteredData"
                :key="row.teacher.id"
                class="hover:bg-slate-50"
              >
                <td class="px-6 py-4">
                  <div class="font-medium text-slate-800">
                    {{ row.teacher.name }}
                  </div>
                  <div class="text-xs text-slate-500">
                    {{ row.teacher.position || "Guru" }} •
                    {{ row.teacher.yearsService }} Thn •
                    {{ row.teacher.teachingHours || 0 }} Jam
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                  >
                    {{ row.teacher.gradeName || "-" }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right font-mono text-slate-600">
                  {{ formatCurrency(row.baseSalary || 0) }}
                </td>
                <td class="px-6 py-4 text-center">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {{ row.attendance.days }} Hari
                  </span>
                </td>
                <td class="px-6 py-4 text-right font-mono text-slate-600">
                  {{ formatCurrency(row.attendance.total) }}
                </td>
                <td class="px-6 py-4 text-right font-mono text-slate-600">
                  {{ formatCurrency(row.allowances.position) }}
                </td>
                <td class="px-6 py-4 text-right font-mono text-slate-600">
                  {{ formatCurrency(row.allowances.teaching || 0) }}
                </td>
                <td class="px-6 py-4 text-right font-mono text-slate-600">
                  {{
                    formatCurrency(
                      row.allowances.health +
                        row.allowances.housing +
                        row.allowances.transport +
                        row.allowances.tenure +
                        row.allowances.customTotal
                    )
                  }}
                </td>
                <td
                  class="px-6 py-4 text-right font-mono font-bold text-emerald-600"
                >
                  {{ formatCurrency(row.totalSalary) }}
                </td>
                <td class="px-6 py-4 text-center">
                  <button
                    @click="openSlip(row)"
                    class="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Icon icon="lucide:printer" class="w-3.5 h-3.5" />
                    Cetak
                  </button>
                </td>
              </tr>
              <tr v-if="filteredData.length === 0">
                <td colspan="8" class="px-6 py-12 text-center text-slate-500">
                  Tidak ada data gaji untuk periode ini.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- CARD VIEW -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="row in filteredData"
          :key="row.teacher.id"
          class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="font-bold text-slate-800">{{ row.teacher.name }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ row.teacher.position || "Guru" }} •
                {{ row.teacher.yearsService }} Tahun
              </p>
            </div>
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {{ row.attendance.days }} Hari
            </span>
          </div>

          <div class="space-y-2 text-sm border-t border-slate-100 pt-3">
            <div class="flex justify-between">
              <span class="text-slate-500">Tunjangan Kehadiran</span>
              <span class="font-mono text-slate-700">{{
                formatCurrency(row.attendance.total)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Tunjangan Jabatan</span>
              <span class="font-mono text-slate-700">{{
                formatCurrency(row.allowances.position)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Tunjangan Lainnya</span>
              <span class="font-mono text-slate-700">
                {{
                  formatCurrency(
                    row.allowances.health +
                      row.allowances.housing +
                      row.allowances.transport +
                      row.allowances.tenure +
                      row.allowances.customTotal
                  )
                }}
              </span>
            </div>
          </div>

          <div
            class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between"
          >
            <div>
              <p class="text-xs text-slate-500">Total Gaji</p>
              <p class="font-bold text-emerald-600 text-lg">
                {{ formatCurrency(row.totalSalary) }}
              </p>
            </div>
            <button
              @click="openSlip(row)"
              class="p-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors"
              title="Cetak Slip"
            >
              <Icon icon="lucide:printer" class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          v-if="filteredData.length === 0"
          class="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200"
        >
          Tidak ada data gaji untuk periode ini.
        </div>
      </div>
    </div>

    <!-- MODAL SLIP -->
    <div
      v-if="selectedRow"
      class="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/70 overflow-y-auto"
    >
      <div
        class="bg-slate-200 rounded-xl max-h-[90vh] overflow-y-auto w-full max-w-4xl relative shadow-2xl"
      >
        <div
          class="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center"
        >
          <h3 class="font-bold text-slate-800">Preview Slip Gaji</h3>
          <div class="flex items-center gap-2">
            <button
              @click="downloadPDF"
              class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
              :disabled="downloading"
            >
              <Icon
                v-if="downloading === 'pdf'"
                icon="lucide:loader-2"
                class="w-4 h-4 animate-spin"
              />
              <Icon v-else icon="lucide:file-text" class="w-4 h-4" />
              PDF
            </button>
            <button
              @click="downloadPNG"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
              :disabled="downloading"
            >
              <Icon
                v-if="downloading === 'png'"
                icon="lucide:loader-2"
                class="w-4 h-4 animate-spin"
              />
              <Icon v-else icon="lucide:image" class="w-4 h-4" />
              PNG
            </button>
            <button
              @click="selectedRow = null"
              class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Icon icon="lucide:x" class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div class="p-8 flex justify-center">
          <SalarySlip
            id="salary-slip-node"
            :data="selectedRow"
            :period="filter"
            :institution="institutionSettings"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import {
  salaryApi,
  settingsApi,
  divisionsApi,
  salaryGradesApi,
} from "@/services/api";
import SalarySlip from "@/components/SalarySlip.vue";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { saveAs } from "file-saver";

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

const now = new Date();

// Default to first and last day of current month
const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

const filter = reactive({
  startDate: firstDayOfMonth.toISOString().split("T")[0],
  endDate: lastDayOfMonth.toISOString().split("T")[0],
  divisionId: "",
  gradeId: "",
  gender: "",
});

const loading = ref(false);
const exporting = ref(false);
const error = ref(null);
const reportData = ref([]);
const divisions = ref([]);
const grades = ref([]);
const selectedRow = ref(null);
const downloading = ref(null); // 'png' | 'pdf' | null
const viewMode = ref("table"); // 'table' | 'card'
const institutionSettings = ref({});

const formatCurrency = (val) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);

// Computed filtered data
const filteredData = computed(() => {
  let result = reportData.value;

  // Filter by Division
  if (filter.divisionId) {
    const divId = parseInt(filter.divisionId);
    result = result.filter((row) => {
      // Check divisionId column
      return row.teacher.divisionId === divId;
    });
  }

  // Filter by Grade
  if (filter.gradeId) {
    const gId = parseInt(filter.gradeId);
    result = result.filter((row) => row.teacher.salaryGradeId === gId);
  }

  // Filter by Gender
  if (filter.gender) {
    result = result.filter((row) => row.teacher.gender === filter.gender);
  }

  return result;
});

async function loadData() {
  loading.value = true;
  error.value = null;
  try {
    // Parse month/year from startDate for API call (backward compatible)
    const startDateObj = new Date(filter.startDate);
    const month = startDateObj.getMonth() + 1;
    const year = startDateObj.getFullYear();

    const [resReport, resSettings, resDivisions, resGrades] = await Promise.all(
      [
        salaryApi.getReport(month, year),
        settingsApi.getAll(),
        divisionsApi.getAll(),
        salaryGradesApi.getAll(),
      ]
    );

    if (resReport.success) {
      reportData.value = resReport.data.rows;
    }
    if (resSettings.success) {
      institutionSettings.value = resSettings.data;
    }
    if (resDivisions.success) {
      divisions.value = resDivisions.data;
    }
    if (resGrades.success) {
      grades.value = resGrades.data;
    }
  } catch (err) {
    console.error(err);
    error.value = "Gagal memuat data laporan gaji.";
  } finally {
    loading.value = false;
  }
}

function openSlip(row) {
  selectedRow.value = row;
}

async function exportToExcel() {
  if (filteredData.value.length === 0) return;

  exporting.value = true;

  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Laporan Gaji");

    // Period text
    const startDate = new Date(filter.startDate);
    const endDate = new Date(filter.endDate);
    const periodText = `Periode: ${startDate.toLocaleDateString(
      "id-ID"
    )} - ${endDate.toLocaleDateString("id-ID")}`;

    // Title Row
    sheet.mergeCells("A1:Q1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "LAPORAN GAJI PEGAWAI";
    titleCell.font = { bold: true, size: 16, color: { argb: "FF1E293B" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).height = 30;

    // Period Row
    sheet.mergeCells("A2:Q2");
    const periodCell = sheet.getCell("A2");
    periodCell.value = periodText;
    periodCell.font = { size: 11, color: { argb: "FF64748B" } };
    periodCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(2).height = 20;

    // Empty Row
    sheet.getRow(3).height = 10;

    // Header Row (Row 4)
    const headers = [
      "No",
      "Nama Pegawai",
      "Jabatan",
      "Golongan",
      "Masa Kerja",
      "Jam Mengajar",
      "Gaji Pokok",
      "Hari Hadir",
      "Tun. Kehadiran",
      "Tun. Jabatan",
      "Tun. Jam Ajar",
      "Tun. Kesehatan",
      "Tun. Perumahan",
      "Tun. Transport",
      "Tun. Masa Kerja",
      "Tun. Lainnya",
      "Total Gaji",
    ];

    const headerRow = sheet.getRow(4);
    headers.forEach((header, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4F46E5" }, // Indigo 600
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "FF94A3B8" } },
        left: { style: "thin", color: { argb: "FF94A3B8" } },
        bottom: { style: "thin", color: { argb: "FF94A3B8" } },
        right: { style: "thin", color: { argb: "FF94A3B8" } },
      };
    });
    headerRow.height = 25;

    // Column Widths
    sheet.columns = [
      { key: "no", width: 5 },
      { key: "name", width: 30 },
      { key: "position", width: 18 },
      { key: "grade", width: 15 },
      { key: "years", width: 12 },
      { key: "teachingHours", width: 12 },
      { key: "baseSalary", width: 18 },
      { key: "days", width: 12 },
      { key: "attendance", width: 18 },
      { key: "posAllow", width: 18 },
      { key: "teachAllow", width: 18 },
      { key: "health", width: 18 },
      { key: "housing", width: 18 },
      { key: "transport", width: 18 },
      { key: "tenure", width: 18 },
      { key: "custom", width: 18 },
      { key: "total", width: 20 },
    ];

    // Data Rows
    filteredData.value.forEach((row, index) => {
      const dataRow = sheet.addRow([
        index + 1,
        row.teacher.name,
        row.teacher.position || "Guru",
        row.teacher.gradeName || "-",
        row.teacher.yearsService,
        row.teacher.teachingHours || 0,
        row.baseSalary || 0,
        row.attendance.days,
        row.attendance.total,
        row.allowances.position,
        row.allowances.teaching || 0,
        row.allowances.health,
        row.allowances.housing,
        row.allowances.transport,
        row.allowances.tenure,
        row.allowances.customTotal,
        row.totalSalary,
      ]);

      // Style data cells
      dataRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };

        // Alternate row colors
        if (index % 2 === 1) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8FAFC" }, // Slate 50
          };
        }

        // Number formatting for currency columns (7-17)
        if (colNumber >= 7 && colNumber <= 17) {
          cell.numFmt = "#,##0";
          cell.alignment = { horizontal: "right" };
        }

        // Center alignment for No, Years, Hours, Days columns
        if (
          colNumber === 1 ||
          colNumber === 5 ||
          colNumber === 6 ||
          colNumber === 8
        ) {
          cell.alignment = { horizontal: "center" };
        }

        // Bold and green for Total Gaji column (last column = 17)
        if (colNumber === 17) {
          cell.font = { bold: true, color: { argb: "FF059669" } }; // Emerald 600
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD1FAE5" }, // Emerald 100
          };
        }
      });
    });

    // Add Summary Row
    const summaryRowIndex = sheet.rowCount + 1;
    const summaryRow = sheet.getRow(summaryRowIndex);

    // Calculate all totals
    const totalBaseSalary = filteredData.value.reduce(
      (sum, r) => sum + (r.baseSalary || 0),
      0
    );
    const totalAttendance = filteredData.value.reduce(
      (sum, r) => sum + r.attendance.total,
      0
    );
    const totalPosition = filteredData.value.reduce(
      (sum, r) => sum + r.allowances.position,
      0
    );
    const totalTeaching = filteredData.value.reduce(
      (sum, r) => sum + (r.allowances.teaching || 0),
      0
    );
    const totalHealth = filteredData.value.reduce(
      (sum, r) => sum + r.allowances.health,
      0
    );
    const totalHousing = filteredData.value.reduce(
      (sum, r) => sum + r.allowances.housing,
      0
    );
    const totalTransport = filteredData.value.reduce(
      (sum, r) => sum + r.allowances.transport,
      0
    );
    const totalTenure = filteredData.value.reduce(
      (sum, r) => sum + r.allowances.tenure,
      0
    );
    const totalCustom = filteredData.value.reduce(
      (sum, r) => sum + r.allowances.customTotal,
      0
    );
    const totalSalary = filteredData.value.reduce(
      (sum, r) => sum + r.totalSalary,
      0
    );

    sheet.mergeCells(`A${summaryRowIndex}:F${summaryRowIndex}`);
    summaryRow.getCell(1).value = "TOTAL";
    summaryRow.getCell(1).font = { bold: true };
    summaryRow.getCell(1).alignment = { horizontal: "center" };
    summaryRow.getCell(7).value = totalBaseSalary;
    // Column 8 = hari hadir (skip)
    summaryRow.getCell(9).value = totalAttendance;
    summaryRow.getCell(10).value = totalPosition;
    summaryRow.getCell(11).value = totalTeaching;
    summaryRow.getCell(12).value = totalHealth;
    summaryRow.getCell(13).value = totalHousing;
    summaryRow.getCell(14).value = totalTransport;
    summaryRow.getCell(15).value = totalTenure;
    summaryRow.getCell(16).value = totalCustom;
    summaryRow.getCell(17).value = totalSalary;

    // Style all cells in summary row (columns 1-17)
    for (let colNumber = 1; colNumber <= 17; colNumber++) {
      const cell = summaryRow.getCell(colNumber);
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E7FF" }, // Indigo 100
      };
      cell.border = {
        top: { style: "medium", color: { argb: "FF4F46E5" } },
        left: { style: "thin", color: { argb: "FF94A3B8" } },
        bottom: { style: "medium", color: { argb: "FF4F46E5" } },
        right: { style: "thin", color: { argb: "FF94A3B8" } },
      };
      if (colNumber >= 7) {
        cell.numFmt = "#,##0";
        cell.alignment = { horizontal: "right" };
      }
      // Special styling for Total Gaji
      if (colNumber === 17) {
        cell.font = { bold: true, color: { argb: "FF059669" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD1FAE5" },
        };
      }
    }

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const filename = `Laporan_Gaji_${startDate.toISOString().split("T")[0]}_${
      endDate.toISOString().split("T")[0]
    }.xlsx`;
    saveAs(blob, filename);
  } catch (err) {
    console.error("Export failed:", err);
    alert("Gagal mengekspor ke Excel.");
  } finally {
    exporting.value = false;
  }
}

async function downloadPNG() {
  downloading.value = "png";
  const element = document.getElementById("salary-slip-node");
  if (!element) return;

  // Store original styles to revert later
  const originalWidth = element.style.width;
  const originalMinWidth = element.style.minWidth;

  try {
    // Force fixed width for better mobile capture
    element.style.width = "800px";
    element.style.minWidth = "800px";

    // Wait for layout update
    await new Promise((resolve) => setTimeout(resolve, 100));

    const canvas = await html2canvas(element, {
      scale: 2, // High resolution
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: 1200,
    });

    const link = document.createElement("a");
    link.download = `Slip_Gaji_${selectedRow.value.teacher.name.replace(
      /\s+/g,
      "_"
    )}_${months[new Date(filter.startDate).getMonth()]}_${new Date(
      filter.startDate
    ).getFullYear()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (err) {
    console.error("Failed to generate image", err);
    alert("Gagal mengunduh slip gaji.");
  } finally {
    // Revert styles
    element.style.width = originalWidth;
    element.style.minWidth = originalMinWidth;
    downloading.value = null;
  }
}

async function downloadPDF() {
  downloading.value = "pdf";
  const element = document.getElementById("salary-slip-node");
  if (!element) return;

  // Store original styles to revert later
  const originalWidth = element.style.width;
  const originalMinWidth = element.style.minWidth;

  try {
    // Force fixed width for A4-like ratio
    element.style.width = "800px";
    element.style.minWidth = "800px";

    // Wait for layout update
    await new Promise((resolve) => setTimeout(resolve, 100));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: 1200,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    // A4 Dimensions
    const pageWidth = pdf.internal.pageSize.getWidth(); // 210
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297

    // Margins
    const margin = 10;
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    // Calculate dimensions to fit
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const widthRatio = availableWidth / imgWidth;
    const heightRatio = availableHeight / imgHeight;

    // Choose the smaller ratio to ensure it fits both dimensions
    const ratio = Math.min(widthRatio, heightRatio);

    const finalWidth = imgWidth * ratio;
    const finalHeight = imgHeight * ratio;

    // Center the image
    const x = (pageWidth - finalWidth) / 2;
    const y = margin; // Top margin

    pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);
    pdf.save(
      `Slip_Gaji_${selectedRow.value.teacher.name.replace(/\s+/g, "_")}_${
        months[new Date(filter.startDate).getMonth()]
      }_${new Date(filter.startDate).getFullYear()}.pdf`
    );
  } catch (err) {
    console.error("Failed to generate PDF", err);
    alert("Gagal mengunduh slip PDF.");
  } finally {
    // Revert styles
    element.style.width = originalWidth;
    element.style.minWidth = originalMinWidth;
    downloading.value = null;
  }
}

onMounted(() => {
  loadData();
});
</script>
