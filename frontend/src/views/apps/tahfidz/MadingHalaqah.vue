<template>
  <div class="p-2 max-w-7xl mx-auto pb-12">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Mading Halaqah</h1>
      <p class="text-slate-500">Laporan capaian hafalan per grup halaqah</p>
    </div>

    <!-- Filters -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Halaqah Select -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >Grup Halaqah</label
          >
          <select
            v-model="filters.halaqahId"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
            @change="loadReport"
          >
            <option value="">Pilih Grup</option>
            <option v-for="h in halaqahList" :key="h.id" :value="h.id">
              {{ h.name }}
            </option>
          </select>
        </div>

        <!-- Start Date -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >Tanggal Mulai</label
          >
          <input
            type="date"
            v-model="filters.startDate"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
            @change="loadReport"
          />
        </div>

        <!-- End Date -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >Tanggal Akhir</label
          >
          <input
            type="date"
            v-model="filters.endDate"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
            @change="loadReport"
          />
        </div>

        <!-- Gender -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >Gender</label
          >
          <select
            v-model="filters.gender"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
            @change="loadReport"
          >
            <option value="">Semua</option>
            <option value="male">Laki-laki</option>
            <option value="female">Perempuan</option>
          </select>
        </div>
      </div>

      <!-- Actions -->
      <div
        class="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-3 print:hidden"
        v-if="report"
      >
        <button
          @click="handlePrint"
          class="flex items-center gap-2 px-4 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1c10] transition-colors"
        >
          <Icon icon="solar:printer-bold-duotone" />
          Cetak
        </button>
        <button
          @click="exportToExcel"
          class="flex items-center gap-2 px-4 py-2 bg-[#107c41] text-white rounded-lg hover:bg-[#0c5e31] transition-colors"
        >
          <Icon icon="solar:file-download-bold" />
          Export Excel
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="h-64 flex items-center justify-center bg-white rounded-xl border border-slate-200"
    >
      <span class="text-slate-500 animate-pulse">Memuat data...</span>
    </div>

    <!-- No Halaqah Selected -->
    <div
      v-else-if="!filters.halaqahId"
      class="h-64 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 text-slate-400"
    >
      <Icon
        icon="solar:users-group-rounded-line-duotone"
        class="text-4xl mb-2"
      />
      <p>Pilih grup halaqah untuk melihat laporan</p>
    </div>

    <!-- Report Content -->
    <div v-else class="w-full">
      <div ref="reportContainer" class="w-full overflow-hidden">
        <div
          id="print-area"
          class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm origin-top-left transition-transform duration-200"
          :style="reportStyle"
        >
          <!-- Report Header -->
          <div class="text-center border-b-2 border-slate-800 pb-4 mb-6">
            <h2 class="text-xl font-bold uppercase">
              Pencapaian Hafalan Santri
            </h2>
            <h3 class="text-lg">Pondok Pesantren Minhajul Haq</h3>
          </div>

          <!-- Report Info -->
          <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p>
                <span class="font-semibold">Halaqah</span>:
                {{ report?.halaqah?.name || "-" }}
              </p>
              <p>
                <span class="font-semibold">Pengampu Halaqah</span>:
                {{ report?.mentor?.fullName || "-" }}
              </p>
            </div>
            <div class="text-right">
              <p>
                <span class="font-semibold">Target Minimal</span>:
                {{ targetPages }} Halaman
              </p>
              <p>
                <span class="font-semibold">Tanggal Rekap</span>:
                {{ formatDateRange() }}
              </p>
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="bg-slate-100">
                  <th class="border p-2 text-center" rowspan="2">No</th>
                  <th class="border p-2 text-left" rowspan="2">Nama Lengkap</th>
                  <th class="border p-2 text-center" colspan="4">Kehadiran</th>
                  <th class="border p-2 text-center" rowspan="2">Target</th>
                  <th class="border p-2 text-center" colspan="1">
                    Hafalan Bulan Ini
                  </th>
                  <th class="border p-2 text-center" rowspan="2">
                    Jumlah Halaman
                  </th>
                  <th class="border p-2 text-center" rowspan="2">Ket</th>
                </tr>
                <tr class="bg-slate-50 text-xs">
                  <th class="border p-1">S</th>
                  <th class="border p-1">I</th>
                  <th class="border p-1">A</th>
                  <th class="border p-1">T</th>
                  <th class="border p-1">Rentang Halaman</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(m, idx) in report?.members"
                  :key="m.studentId"
                  class="hover:bg-slate-50"
                >
                  <td class="border p-2 text-center">{{ idx + 1 }}</td>
                  <td class="border p-2">{{ m.fullName }}</td>
                  <td class="border p-2 text-center">
                    {{ m.attendance?.sakit || 0 }}
                  </td>
                  <td class="border p-2 text-center">
                    {{ m.attendance?.izin || 0 }}
                  </td>
                  <td class="border p-2 text-center">
                    {{ m.attendance?.alpha || 0 }}
                  </td>
                  <td class="border p-2 text-center">
                    {{ m.attendance?.terlambat || 0 }}
                  </td>
                  <td class="border p-2 text-center">{{ targetPages }} Hal</td>
                  <td class="border p-2 text-center">
                    {{ m.hafalanRanges || "-" }}
                  </td>
                  <td class="border p-2 text-center font-bold">
                    {{ m.jumlahHalaman || 0 }}
                  </td>
                  <td class="border p-2 text-center">
                    <span
                      :class="getStatusClass(m.jumlahHalaman)"
                      class="px-2 py-0.5 rounded text-xs font-medium"
                    >
                      {{ getStatus(m.jumlahHalaman) }}
                    </span>
                  </td>
                </tr>
                <tr v-if="!report?.members?.length">
                  <td
                    colspan="10"
                    class="border p-4 text-center text-slate-500 italic"
                  >
                    Tidak ada data anggota
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Legend -->
          <div class="mt-6 grid grid-cols-2 gap-4 text-xs text-slate-600">
            <div>
              <p class="font-semibold mb-1">Keterangan Status:</p>
              <p>
                <span class="px-1 bg-green-100 text-green-700 rounded">ST</span>
                : Sesuai Target
              </p>
              <p>
                <span class="px-1 bg-yellow-100 text-yellow-700 rounded"
                  >DT</span
                >
                : Di Bawah Target
              </p>
              <p>
                <span class="px-1 bg-blue-100 text-blue-700 rounded">MT</span> :
                Melebihi Target
              </p>
            </div>
            <div>
              <p class="font-semibold mb-1">Keterangan Kehadiran:</p>
              <p>
                <b>S</b> : Sakit | <b>I</b> : Izin | <b>A</b> : Alpha |
                <b>T</b> : Terlambat
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="grid grid-cols-2 gap-8 text-center mt-12 text-sm">
            <div></div>
            <div>
              <p class="mb-16">
                Purwakarta, {{ currentDate }}<br />Pengampu Halaqah,
              </p>
              <p
                class="font-bold border-b border-slate-800 inline-block min-w-[150px]"
              >
                {{ report?.mentor?.fullName || "_______________" }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";

import { Icon } from "@iconify/vue";
import { useElementSize } from "@vueuse/core";
import { tahfidzApi, halaqahApi } from "@/services/api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const loading = ref(false);
const halaqahList = ref([]);
const targets = ref([]);
const report = ref(null);

const reportContainer = ref(null);
const { width: containerWidth } = useElementSize(reportContainer);

const scale = computed(() => {
  if (!containerWidth.value) return 1;
  const A4_WIDTH_PX = 794; // 210mm @ 96dpi
  const availableWidth = containerWidth.value;
  return availableWidth < A4_WIDTH_PX ? availableWidth / A4_WIDTH_PX : 1;
});

const reportStyle = computed(() => ({
  width: "210mm",
  minHeight: "297mm",
  transform: `scale(${scale.value})`,
  marginBottom: `-${(1 - scale.value) * 100}%`,
  transformOrigin: "top left",
}));

const filters = reactive({
  halaqahId: "",
  startDate: getDefaultStartDate(),
  endDate: getDefaultEndDate(),
  gender: "",
});

// Default to current month
function getDefaultStartDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-01`;
}

function getDefaultEndDate() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${lastDay}`;
}

const currentDate = new Date().toLocaleDateString("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const targetPages = computed(() => {
  // Use group's assigned target level
  if (report.value?.halaqah?.targetLevel?.targetPages) {
    return report.value.halaqah.targetLevel.targetPages;
  }
  // Use first target level for now - can be enhanced to use student's level
  return targets.value[0]?.targetPages || 6;
});

async function loadHalaqahList() {
  try {
    const res = await halaqahApi.getAll();
    if (res.success) {
      halaqahList.value = res.data || [];
    }
  } catch (e) {
    console.error("Failed to load halaqah list:", e);
  }
}

async function loadTargets() {
  try {
    const res = await tahfidzApi.getTargets();
    if (res.success) {
      targets.value = res.data || [];
    }
  } catch (e) {
    console.error("Failed to load targets:", e);
  }
}

async function loadReport() {
  // Only require halaqahId and dates - gender is optional
  if (!filters.halaqahId || !filters.startDate || !filters.endDate) return;

  loading.value = true;
  try {
    const params = {
      halaqahId: filters.halaqahId,
      startDate: filters.startDate,
      endDate: filters.endDate,
    };
    if (filters.gender) {
      params.gender = filters.gender;
    }
    const res = await tahfidzApi.getHalaqahReport(params);
    if (res.success) {
      report.value = res.data;
    }
  } catch (e) {
    console.error("Failed to load report:", e);
  } finally {
    loading.value = false;
    loading.value = false;
  }
}

async function exportToExcel() {
  if (!report.value?.members.length) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Laporan Hafalan");

  // Columns Widths
  worksheet.columns = [
    { width: 5 }, // No (A)
    { width: 30 }, // Nama (B)
    { width: 5 }, // S (C)
    { width: 5 }, // I (D)
    { width: 5 }, // A (E)
    { width: 5 }, // T (F)
    { width: 10 }, // Target (G)
    { width: 25 }, // Hafalan (H)
    { width: 10 }, // Jumlah (I)
    { width: 15 }, // Ket (J)
  ];

  // --- HEADER (TITLE & METADATA) ---
  let currentRow = 1;

  // Title
  worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = "LAPORAN BULANAN PENCAPAIAN HAFALAN SANTRI";
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
  const subTitleCell = worksheet.getCell(`A${currentRow}`);
  subTitleCell.value = "PONDOK PESANTREN MINHAJUL HAQ PURWAKARTA";
  subTitleCell.font = { bold: true, size: 12 };
  subTitleCell.alignment = { horizontal: "center", vertical: "middle" };
  currentRow += 2; // Gap

  // Metadata
  const addMetadata = (label, value) => {
    const labelCell = worksheet.getCell(`A${currentRow}`);
    labelCell.value = label;
    labelCell.font = { bold: true };
    const valueCell = worksheet.getCell(`C${currentRow}`); // Shift to C (Sejajar S)
    valueCell.value = ": " + value;
    valueCell.alignment = { horizontal: "left" };
    currentRow++;
  };

  addMetadata("Grup Halaqah", report.value?.halaqah?.name || "-");
  addMetadata("Pengampu", report.value?.mentor?.fullName || "-");

  // Format Month Year
  const date = new Date(filters.startDate);
  const monthNames = [
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
  const monthStr = monthNames[date.getMonth()];
  const yearStr = date.getFullYear();
  addMetadata("Bulan", `${monthStr} ${yearStr}`);

  currentRow++; // Gap

  // --- TABLE HEADER ---

  // Row 1 of Table Header
  worksheet.mergeCells(`A${currentRow}:A${currentRow + 1}`);
  worksheet.getCell(`A${currentRow}`).value = "No";

  worksheet.mergeCells(`B${currentRow}:B${currentRow + 1}`);
  worksheet.getCell(`B${currentRow}`).value = "Nama Lengkap";

  worksheet.mergeCells(`C${currentRow}:F${currentRow}`);
  worksheet.getCell(`C${currentRow}`).value = "Kehadiran";

  worksheet.mergeCells(`G${currentRow}:G${currentRow + 1}`);
  worksheet.getCell(`G${currentRow}`).value = "Target";

  worksheet.getCell(`H${currentRow}`).value = "Hafalan Bulan Ini";
  worksheet.getCell(`H${currentRow + 1}`).value = "Rentang Halaman";

  worksheet.mergeCells(`I${currentRow}:I${currentRow + 1}`);
  worksheet.getCell(`I${currentRow}`).value = "Jumlah Halaman";

  worksheet.mergeCells(`J${currentRow}:J${currentRow + 1}`);
  worksheet.getCell(`J${currentRow}`).value = "Ket";

  // Row 2 of Table Header (Subheaders)
  worksheet.getCell(`C${currentRow + 1}`).value = "S";
  worksheet.getCell(`D${currentRow + 1}`).value = "I";
  worksheet.getCell(`E${currentRow + 1}`).value = "A";
  worksheet.getCell(`F${currentRow + 1}`).value = "T";

  // Style Headers
  const headerCells = [
    `A${currentRow}`,
    `B${currentRow}`,
    `C${currentRow}`,
    `G${currentRow}`,
    `H${currentRow}`,
    `H${currentRow + 1}`,
    `I${currentRow}`,
    `J${currentRow}`,
    `C${currentRow + 1}`,
    `D${currentRow + 1}`,
    `E${currentRow + 1}`,
    `F${currentRow + 1}`,
  ];

  headerCells.forEach((key) => {
    const cell = worksheet.getCell(key);
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" }, // slate-100
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  currentRow += 2;

  // --- DATA ---
  report.value.members.forEach((m, idx) => {
    const rowValues = [
      idx + 1,
      m.fullName,
      m.attendance?.sakit || 0,
      m.attendance?.izin || 0,
      m.attendance?.alpha || 0,
      m.attendance?.terlambat || 0,
      (targetPages.value || 0) + " Hal",
      m.hafalanRanges || "-",
      m.jumlahHalaman || 0,
      getStatus(m.jumlahHalaman),
    ];

    const row = worksheet.getRow(currentRow);
    row.values = rowValues;

    // Style Data Row
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      // Alignment
      if (colNumber === 2) {
        // Nombre
        cell.alignment = { vertical: "middle", horizontal: "left" };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }

      // Color Status (Column J / 10)
      if (colNumber === 10) {
        const status = cell.value;
        let argb = null;
        if (status === "MT") argb = "FFDBEAFE"; // Blue
        if (status === "ST") argb = "FFDCFCE7"; // Green
        if (status === "DT") argb = "FFFEF9C3"; // Yellow

        if (argb) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb },
          };
        }
      }
    });

    currentRow++;
  });

  currentRow++; // Gap

  // --- LEGEND ---
  const startRow = currentRow;
  worksheet.getCell(`A${currentRow}`).value = "Keterangan Status:";
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  const legendStartRow = currentRow;
  currentRow++;

  const addLegend = (code, desc, argb) => {
    const cellCode = worksheet.getCell(`A${currentRow}`);
    cellCode.value = code;
    cellCode.alignment = { horizontal: "center" };
    cellCode.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
    if (argb) {
      cellCode.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
    }

    worksheet.getCell(`B${currentRow}`).value = ": " + desc;
    currentRow++;
  };

  addLegend("ST", "Sesuai Target", "FFDCFCE7");
  addLegend("DT", "Di Bawah Target", "FFFEF9C3");
  addLegend("MT", "Melebihi Target", "FFDBEAFE");

  currentRow++;
  worksheet.getCell(`A${currentRow}`).value = "Keterangan Kehadiran:";
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  currentRow++;
  worksheet.getCell(`A${currentRow}`).value =
    "S : Sakit | I : Izin | A : Alpha | T : Terlambat";

  currentRow += 3; // Gap for signature

  // --- SIGNATURE ---
  // Right side (approx col H)
  const signCol = "H";
  let signRow = startRow;

  worksheet.getCell(
    `${signCol}${signRow}`
  ).value = `Purwakarta, ${currentDate}`;
  signRow++;
  worksheet.getCell(`${signCol}${signRow}`).value = "Pengampu Halaqah,";
  signRow += 5; // Space for sign

  const mentorName = report.value?.mentor?.fullName || "____________________";
  worksheet.getCell(`${signCol}${signRow}`).value = mentorName;
  worksheet.getCell(`${signCol}${signRow}`).font = {
    bold: true,
    underline: true,
  };

  // Export
  const buffer = await workbook.xlsx.writeBuffer();
  const dateStr = new Date().toISOString().split("T")[0];
  const fileName = `Laporan_Hafalan_${dateStr}.xlsx`;
  saveAs(new Blob([buffer]), fileName);
}

// Auto-load when halaqahId changes (dates already have defaults)
watch(
  () => filters.halaqahId,
  (newVal) => {
    if (newVal && filters.startDate && filters.endDate) {
      loadReport();
    }
  }
);

function formatDateRange() {
  const start = new Date(filters.startDate).toLocaleDateString("id-ID");
  const end = new Date(filters.endDate).toLocaleDateString("id-ID");
  return `${start} s.d. ${end}`;
}

function getStatus(pages) {
  if (!pages || pages === 0) return "-";
  if (pages >= targetPages.value) {
    return pages > targetPages.value ? "MT" : "ST";
  }
  return "DT";
}

function getStatusClass(pages) {
  const status = getStatus(pages);
  if (status === "MT") return "bg-blue-100 text-blue-700";
  if (status === "ST") return "bg-green-100 text-green-700";
  if (status === "DT") return "bg-yellow-100 text-yellow-700";
  return "bg-slate-100 text-slate-500";
}

function handlePrint() {
  window.print();
}

onMounted(() => {
  loadHalaqahList();
  loadTargets();
});
</script>

<style>
@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }
  body * {
    visibility: hidden;
  }
  #print-area,
  #print-area * {
    visibility: visible;
  }
  #print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 210mm !important;
    min-height: 297mm !important;
    margin: 0 !important;
    padding: 20px !important;
    border: none !important;
    box-shadow: none !important;
    transform: none !important; /* Disable scaling */
    overflow: visible !important;
  }
  .print\:hidden {
    display: none !important;
  }
}
</style>
