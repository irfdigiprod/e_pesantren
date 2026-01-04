<template>
  <div class="max-w-7xl mx-auto pb-12">
    <!-- Controls Panel (hidden on print) -->
    <div
      class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6 print:hidden"
    >
      <h1 class="text-xl font-bold text-slate-800 mb-4">
        Cetak Rapor Akademik
      </h1>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <!-- Student Search -->
        <div class="relative">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >Pilih Santri</label
          >
          <div class="relative">
            <input
              type="text"
              v-model="searchQuery"
              @focus="showDropdown = true"
              @input="filterStudents"
              :placeholder="
                isLoadingStudents ? 'Memuat data...' : 'Cari santri...'
              "
              :disabled="isLoadingStudents"
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none disabled:bg-slate-50 disabled:text-slate-400"
            />
            <div
              v-if="isLoadingStudents"
              class="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <Icon icon="svg-spinners:ring-resize" class="text-slate-400" />
            </div>
          </div>
          <div
            v-if="showDropdown && filteredStudents.length > 0"
            class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            <!-- Limit rendering to top 20 for performance -->
            <div
              v-for="s in filteredStudents.slice(0, 20)"
              :key="s.id"
              @click="selectStudent(s)"
              class="flex align-center flex-col px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm"
            >
              <span class="font-medium">{{ s.fullName }}</span>
              <span class="text-xs text-slate-400"
                >{{ s.nis }} • {{ s.class?.name || "-" }}</span
              >
            </div>
            <div
              v-if="filteredStudents.length > 20"
              class="px-4 py-2 text-xs text-center text-slate-400 italic bg-slate-50 border-t"
            >
              Ditampilkan 20 dari {{ filteredStudents.length }} santri. Ketik
              untuk mencari.
            </div>
          </div>
        </div>

        <!-- Semester -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >Semester</label
          >
          <select
            v-model="semester"
            @change="loadData"
            class="w-full px-3 py-2 border rounded-lg"
          >
            <option v-for="s in semesters" :key="s.id" :value="s.id">
              {{ s.name }}{{ s.isActive ? " (Aktif)" : "" }}
            </option>
          </select>
        </div>

        <!-- Academic Year -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >Tahun Ajaran</label
          >
          <select
            v-model="academicYear"
            @change="loadData"
            class="w-full px-3 py-2 border rounded-lg"
          >
            <option v-for="y in academicYears" :key="y.year" :value="y.year">
              {{ y.year }}{{ y.isActive ? " (Aktif)" : "" }}
            </option>
          </select>
        </div>

        <!-- Attendance Source Toggle -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >Sumber Kehadiran</label
          >
          <select
            v-model="attendanceSource"
            class="w-full px-3 py-2 border rounded-lg"
          >
            <option value="manual">Manual (Catatan Wali Kelas)</option>
            <option value="auto">Otomatis (Sistem Absensi)</option>
          </select>
        </div>
      </div>

      <!-- Print Button -->
      <div class="flex gap-3">
        <button
          @click="handlePrint"
          :disabled="!student"
          class="px-6 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1c10] disabled:opacity-50 flex items-center gap-2"
        >
          <Icon icon="solar:printer-bold" />
          Cetak Rapor
        </button>
        <button
          @click="handleDownloadPdf"
          :disabled="!student || pdfLoading"
          class="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Icon
            :icon="
              pdfLoading
                ? 'svg-spinners:ring-resize'
                : 'solar:file-download-bold'
            "
          />
          {{ pdfLoading ? "Generating..." : "Download PDF" }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="h-64 flex items-center justify-center bg-white rounded-xl border"
    >
      <span class="text-slate-500 animate-pulse">Memuat data...</span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!student"
      class="h-64 flex flex-col items-center justify-center bg-white rounded-xl border text-slate-400"
    >
      <Icon icon="solar:document-text-line-duotone" class="text-4xl mb-2" />
      <p>Pilih santri untuk melihat rapor</p>
    </div>

    <!-- Report Preview -->
    <div v-else class="w-full">
      <div ref="reportContainer" class="w-full overflow-hidden">
        <!-- A4 Wrapper for print/PDF -->
        <div id="report-area" class="print-a4">
          <!-- Scalable content container -->
          <div
            id="report-page"
            class="bg-white p-6 text-slate-800"
            :style="reportStyle"
          >
            <!-- Header Image -->
            <div class="mb-4">
              <img
                v-if="headerImageUrl"
                :src="headerImageUrl"
                alt="Kop Surat"
                class="w-full h-auto"
              />
              <div
                v-else
                class="w-full h-24 flex items-center justify-center bg-slate-50 border border-dashed rounded text-slate-400 italic"
              >
                Upload gambar kop di Pengaturan Akademik
              </div>
            </div>

            <!-- Title -->
            <div class="text-center mb-6">
              <h2 class="text-lg font-bold font-arabic">
                كشف درجات الاختبار النهائي
              </h2>
              <!-- <h3 class="text-base font-bold">LAPORAN HASIL BELAJAR SANTRI</h3> -->
              <p class="text-sm font-arabic">
                {{
                  semester === "1"
                    ? "الفصل الدراسي الأول"
                    : "الفصل الدراسي الثاني"
                }}
              </p>
              <!-- <p class="text-sm">
              Tahun Ajaran / العام الدراسي: {{ academicYear }}
            </p> -->
            </div>

            <!-- UNIFIED SINGLE TABLE - 12 Column Grid (matching reference exactly) -->
            <table
              class="w-full border-collapse text-xs mb-1"
              style="table-layout: fixed"
            >
              <!-- Define 13 Column Widths (6 Left - 1 Separator - 6 Right) -->
              <colgroup>
                <!-- Left 6 Columns -->
                <col style="width: 4%" />
                <!-- 1: NO -->
                <col style="width: 15%" />
                <!-- 2: Mata Pelajaran (Reduced to accommodate separator) -->
                <col style="width: 7.5%" />
                <!-- 3: KKM -->
                <col style="width: 7.5%" />
                <!-- 4: Nilai -->
                <col style="width: 7.5%" />
                <!-- 5: Simbol -->
                <col style="width: 7.5%" />
                <!-- 6: Rata-rata -->

                <!-- Middle Separator -->
                <col style="width: 2%" />
                <!-- 7: SEPARATOR -->

                <!-- Right 6 Columns -->
                <col style="width: 7.5%" />
                <!-- 8: المعدل الفصلي -->
                <col style="width: 7.5%" />
                <!-- 9: الرمز -->
                <col style="width: 7.5%" />
                <!-- 10: النتيجة -->
                <col style="width: 7.5%" />
                <!-- 11: أدنى الدرجة -->
                <col style="width: 15%" />
                <!-- 12: المواد الدراسية -->
                <col style="width: 4%" />
                <!-- 13: الرقم -->
              </colgroup>

              <!-- Student Info Row 1: Val(5) | Lab(1) | SEP(1) | Val(4) | Lab(2) = 13 -->
              <tr>
                <td class="border px-2 py-1 font-arabic" colspan="4" dir="rtl">
                  {{ toArabicNumeral(student.classGrade || "-") }}
                </td>
                <td
                  class="border px-2 py-1 bg-slate-50 font-medium font-arabic"
                  colspan="2"
                  dir="rtl"
                >
                  الصف
                </td>
                <td class=""></td>
                <!-- Separator -->
                <td
                  dir="rtl"
                  class="border px-2 py-1 font-arabic text-right"
                  colspan="4"
                >
                  {{ student.fullNameAr || student.fullName }}
                </td>
                <td
                  class="border px-2 py-1 bg-slate-50 font-medium text-right font-arabic"
                  colspan="2"
                  dir="rtl"
                >
                  اسم الطالب
                </td>
              </tr>

              <!-- Student Info Row 2 -->
              <tr>
                <td class="border px-2 py-1 font-arabic" colspan="4" dir="rtl">
                  {{ toArabicNumeral(academicYear) }}
                </td>
                <td
                  class="border px-2 py-1 bg-slate-50 font-medium font-arabic"
                  colspan="2"
                  dir="rtl"
                >
                  للعام الدراسي
                </td>
                <td class=""></td>
                <!-- Separator -->
                <td
                  dir="rtl"
                  class="border px-2 py-1 font-arabic text-right"
                  colspan="4"
                >
                  {{ toArabicNumeral(student.nis || "-") }}
                </td>
                <td
                  class="border px-2 py-1 bg-slate-50 font-medium text-right font-arabic"
                  colspan="2"
                  dir="rtl"
                >
                  رقم الطلب
                </td>
              </tr>

              <!-- Student Info Row 3 -->
              <tr>
                <td class="border px-2 py-1 font-arabic" colspan="4" dir="rtl">
                  {{ student.majorAr || "الدراسة الإسلامية" }}
                </td>
                <td
                  class="border px-2 py-1 bg-slate-50 font-medium font-arabic"
                  colspan="2"
                  dir="rtl"
                >
                  قسم
                </td>
                <td class=""></td>
                <!-- Separator -->
                <td
                  dir="rtl"
                  class="border px-2 py-1 font-arabic text-right"
                  colspan="4"
                >
                  {{ toArabicNumeral(student.nisn || "-") }}
                </td>
                <td
                  class="border px-2 py-1 bg-slate-50 font-medium text-right font-arabic"
                  colspan="2"
                  dir="rtl"
                >
                  رقم القيد الوطني
                </td>
              </tr>

              <!-- Empty Separator Row -->
              <tr>
                <td colspan="13" class="py-2"></td>
              </tr>

              <!-- Grades Table Header (13 Columns) -->
              <tr class="bg-slate-100" style="font-size: 9px">
                <!-- Left 6 -->
                <th class="border px-1 py-1 text-center">NO</th>
                <th class="border px-1 py-1 text-left">Mata Pelajaran</th>
                <th class="border px-1 py-1 text-center">KKM</th>
                <th class="border px-1 py-1 text-center">Nilai</th>
                <th class="border px-1 py-1 text-center">Simbol</th>
                <th class="border px-1 py-1 text-center">Rata-rata</th>

                <!-- Separator -->
                <th class="bg-white"></th>

                <!-- Right 6 -->
                <th class="border px-1 py-1 text-center font-arabic" dir="rtl">
                  المعدل الفصلي
                </th>
                <th class="border px-1 py-1 text-center font-arabic" dir="rtl">
                  الرمز
                </th>
                <th class="border px-1 py-1 text-center font-arabic" dir="rtl">
                  النتيجة
                </th>
                <th class="border px-1 py-1 text-center font-arabic" dir="rtl">
                  أدنى الدرجة
                </th>
                <th class="border px-1 py-1 text-right font-arabic" dir="rtl">
                  المواد الدراسية
                </th>
                <th class="border px-1 py-1 text-center font-arabic" dir="rtl">
                  الرقم
                </th>
              </tr>

              <!-- Grades Data Rows (13 Columns) -->
              <tr v-for="(grade, idx) in grades" :key="grade.subjectId || idx">
                <!-- Left 6 -->
                <td class="border px-1 py-1 text-center">{{ idx + 1 }}</td>
                <td class="border px-1 py-1">{{ grade.subjectName }}</td>
                <td class="border px-1 py-1 text-center">
                  {{ grade.kkm || 70 }}
                </td>
                <td class="border px-1 py-1 text-center">
                  {{ grade.averageScore || "-" }}
                </td>
                <td class="border px-1 py-1 text-center">
                  {{ grade.letterGrade || "-" }}
                </td>
                <td class="border px-1 py-1 text-center">
                  {{ grade.averageScore || "-" }}
                </td>

                <!-- Separator -->
                <td class=""></td>

                <!-- Right 6 -->
                <td
                  class="border px-1 py-1 text-center font-semibold font-arabic"
                  dir="rtl"
                >
                  {{ toArabicNumeral(grade.averageScore || "-") }}
                </td>
                <td class="border px-1 py-1 text-center font-arabic" dir="rtl">
                  {{ grade.letterGradeAr || grade.letterGrade || "-" }}
                </td>
                <td
                  class="border px-1 py-1 text-center font-semibold font-arabic"
                  dir="rtl"
                >
                  {{ toArabicNumeral(grade.averageScore || "-") }}
                </td>
                <td class="border px-1 py-1 text-center font-arabic" dir="rtl">
                  {{ toArabicNumeral(grade.kkm || 70) }}
                </td>
                <td class="border px-1 py-1 text-right font-arabic" dir="rtl">
                  {{ grade.subjectNameAr || "-" }}
                </td>
                <td class="border px-1 py-1 text-center font-arabic" dir="rtl">
                  {{ toArabicNumeral(idx + 1) }}
                </td>
              </tr>
              <tr v-if="!grades.length">
                <td
                  colspan="13"
                  class="border px-4 py-3 text-center text-slate-400 italic"
                >
                  Belum ada mata pelajaran untuk kelas ini
                </td>
              </tr>

              <!-- Empty Separator Row -->
              <tr>
                <td colspan="13" class="py-2"></td>
              </tr>

              <!-- Summary Section -->
              <tr>
                <td
                  class="border px-2 py-1 font-bold text-center bg-slate-50"
                  colspan="6"
                >
                  Jumlah Nilai
                </td>
                <td class=""></td>
                <!-- Sep -->
                <td
                  class="border px-2 py-1 font-bold text-center bg-slate-50 font-arabic"
                  colspan="6"
                  dir="rtl"
                >
                  مجموع النتائج
                </td>
              </tr>
              <tr>
                <td class="border px-2 py-1" colspan="3">Rata-rata</td>
                <td class="border px-2 py-1 text-center font-bold" colspan="3">
                  {{ averageScore }}
                </td>
                <td class=""></td>
                <!-- Sep -->
                <td
                  class="border px-2 py-1 text-center font-bold font-arabic"
                  colspan="3"
                >
                  {{ toArabicNumeral(averageScore) }}
                </td>
                <td
                  class="border px-2 py-1 text-right font-arabic"
                  colspan="3"
                  dir="rtl"
                >
                  معدل النتائج
                </td>
              </tr>
              <tr>
                <td class="border px-2 py-1" colspan="3">Predikat</td>
                <td class="border px-2 py-1 text-center font-bold" colspan="3">
                  {{ overallPredicate }}
                </td>
                <td class=""></td>
                <!-- Sep -->
                <td
                  class="border px-2 py-1 text-center font-bold font-arabic"
                  colspan="3"
                >
                  {{ overallPredicateAr }}
                </td>
                <td
                  class="border px-2 py-1 text-right font-arabic"
                  colspan="3"
                  dir="rtl"
                >
                  التقدير
                </td>
              </tr>
              <tr>
                <td class="border px-2 py-1" colspan="3">Ranking</td>
                <td class="border px-2 py-1 text-center font-bold" colspan="3">
                  {{ ranking || "-" }}
                </td>
                <td class=""></td>
                <!-- Sep -->
                <td
                  class="border px-2 py-1 text-center font-bold font-arabic"
                  colspan="3"
                >
                  {{ ranking ? toArabicNumeral(ranking) : "-" }}
                </td>
                <td
                  class="border px-2 py-1 text-right font-arabic"
                  colspan="3"
                  dir="rtl"
                >
                  الترتيب
                </td>
              </tr>

              <!-- Empty Separator Row -->
              <tr>
                <td colspan="13" class="py-2"></td>
              </tr>

              <!-- Tahfidz + Ketidakhadiran -->
              <tr>
                <td
                  class="border px-2 py-1 font-bold text-center bg-slate-50"
                  colspan="6"
                >
                  Penilaian Tahfizh
                </td>
                <td class=""></td>
                <!-- Sep -->
                <td
                  class="border px-2 py-1 font-bold text-center bg-slate-50"
                  colspan="6"
                  rowspan="2"
                >
                  Ketidakhadiran
                </td>
              </tr>
              <tr>
                <td class="border px-2 py-1" colspan="3">Target Hafalan</td>
                <td class="border px-2 py-1 text-center" colspan="3">
                  {{ tahfidz.target || "-" }}
                </td>
                <td class=""></td>
                <!-- Sep -->
              </tr>
              <tr>
                <td class="border px-2 py-1" colspan="3">
                  Jumlah Juz yang Dihafalkan
                </td>
                <td class="border px-2 py-1 text-center" colspan="3">
                  {{ tahfidz.achieved || "-" }}
                </td>
                <td class=""></td>
                <!-- Sep -->
                <td class="border px-2 py-1" colspan="2">Sakit</td>
                <td class="border px-2 py-1 text-center" colspan="2">
                  {{ attendance.sickDays || 0 }}
                </td>
                <td class="border px-2 py-1" colspan="2">Hari</td>
              </tr>
              <tr>
                <td class="border px-2 py-1" colspan="3">Nilai</td>
                <td class="border px-2 py-1 text-center font-bold" colspan="3">
                  {{ tahfidz.score || "-" }}
                </td>
                <td class=""></td>
                <!-- Sep -->
                <td class="border px-2 py-1" colspan="2">Izin</td>
                <td class="border px-2 py-1 text-center" colspan="2">
                  {{ attendance.permissionDays || 0 }}
                </td>
                <td class="border px-2 py-1" colspan="2">Hari</td>
              </tr>
              <tr>
                <td class="border px-2 py-1" colspan="3">Keterangan</td>
                <td class="border px-2 py-1 text-center" colspan="3">
                  {{ tahfidz.status || "-" }}
                </td>
                <td class=""></td>
                <!-- <td class="border" colspan="6"></td> -->
                <td class="border px-2 py-1" colspan="2">Alpa</td>
                <td class="border px-2 py-1 text-center" colspan="2">
                  {{ attendance.absentDays || 0 }}
                </td>
                <td class="border px-2 py-1" colspan="2">Hari</td>
              </tr>

              <!-- Empty Separator Row -->
              <tr>
                <td colspan="13" class="py-2"></td>
              </tr>

              <!-- Catatan Row: Lab(2) + Value(11) = 13 -->
              <tr>
                <td class="border px-2 py-1 font-bold bg-slate-50" colspan="2">
                  Catatan :
                </td>
                <td class="border px-2 py-1" colspan="11">
                  {{
                    teacherNotes ||
                    "Nilai ananda sudah baik. Pertahankan prestasi dan jangan mudah puas!"
                  }}
                </td>
              </tr>
            </table>

            <!-- Signatures (Keep outside main table for flexibility) -->
            <div class="grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <p class="mb-1 mt-6">Mengetahui,</p>
                <p class="mb-12">Orang Tua / Wali</p>
                <p class="pt-1 mx-4">........................</p>
              </div>
              <div>
                <p class="mb-1 mt-6">Mengetahui,</p>
                <p class="mb-12">Kepala Madrasah</p>
                <p class="pt-1 mx-4 font-bold">
                  {{ principalName || "........................" }}
                </p>
              </div>
              <div>
                <div class="flex gap-1 items-center">
                  <div>
                    <p class="mb-1">{{ cityName }},</p>
                  </div>
                  <div class="flex-1">
                    <p class="mb-1 ml-1 text-left font-arabic">
                      {{ hijriDate }}
                    </p>
                    <div class="w-full border-b border-black mb-1"></div>
                    <p class="mb-1 ml-1 text-left">{{ currentDate }}</p>
                  </div>
                </div>

                <p class="mb-11">Wali Kelas</p>
                <p class="pt-1 mx-4 font-bold">
                  {{ homeroomTeacher || "........................" }}
                </p>
              </div>
            </div>
            <!-- NOTE: End of Report Content -->
          </div>
          <!-- End of report-page -->
        </div>
        <!-- End of report-area (print-a4) -->
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
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { Icon } from "@iconify/vue";
import { useElementSize } from "@vueuse/core";
import {
  studentsApi,
  academicApi,
  academicSettingsApi,
  homeroomNotesApi,
  tahfidzApi,
} from "@/services/api";
import { usePdfExport } from "@/composables/usePdfExport";
import StatusModal from "@/components/ui/StatusModal.vue";

const route = useRoute();
const loading = ref(false);

// Scaling Logic
const reportContainer = ref(null);
const { width: containerWidth } = useElementSize(reportContainer);
const scale = computed(() => {
  if (!containerWidth.value) return 1;
  const A4_WIDTH_PX = 794; // 210mm @ 96dpi approx
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

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// State
const student = ref(null);
const searchQuery = ref("");
const showDropdown = ref(false);
const allStudents = ref([]);
const filteredStudents = ref([]);

// Filters
const semesters = ref([]);
const academicYears = ref([]);
const semester = ref("1");
const academicYear = ref("");
const attendanceSource = ref("manual");

// Data
const grades = ref([]);
const attendance = ref({ sickDays: 0, permissionDays: 0, absentDays: 0 });
const tahfidz = ref({ target: "", achieved: "", score: "" });
const teacherNotes = ref("");
const ranking = ref(null);
const predicates = ref([]);

// Header Settings
const headerSettings = ref({});
const headerImageUrl = computed(() => {
  const logo = headerSettings.value?.institutionLogo;
  if (!logo) return null;
  if (logo.startsWith("http")) return logo;
  return `${API_BASE}/api/${logo}`;
});
const principalName = computed(() => headerSettings.value?.principalName || "");
const cityName = computed(() => headerSettings.value?.cityName || "Purwakarta");
const homeroomTeacher = ref("");

// Computed
const currentDateRaw = ref(new Date());

const currentDate = computed(() => {
  return currentDateRaw.value.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

const hijriDate = computed(() => {
  return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-civil", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(currentDateRaw.value);
});

const totalScore = computed(() => {
  const graded = grades.value.filter((g) => g.averageScore !== null);
  if (!graded.length) return 0;
  return graded
    .reduce((sum, g) => sum + (Number(g.averageScore) || 0), 0)
    .toFixed(1);
});

const averageScore = computed(() => {
  const graded = grades.value.filter((g) => g.averageScore !== null);
  if (!graded.length) return 0;
  const total = graded.reduce(
    (sum, g) => sum + (Number(g.averageScore) || 0),
    0
  );
  return (total / graded.length).toFixed(1);
});

const overallPredicate = computed(() => {
  const avg = Number(averageScore.value);

  // Try dynamic predicates first
  if (predicates.value.length > 0) {
    const match = predicates.value.find(
      (p) => avg >= Number(p.minScore) && avg <= Number(p.maxScore)
    );
    if (match) return match.description;
  }

  // Fallback defaults
  if (avg >= 92) return "Sangat Istimewa";
  if (avg >= 84) return "Baik";
  if (avg >= 75) return "Cukup";
  return "Kurang";
});

const overallPredicateAr = computed(() => {
  const avg = Number(averageScore.value);

  // Try dynamic predicates first
  if (predicates.value.length > 0) {
    const match = predicates.value.find(
      (p) => avg >= Number(p.minScore) && avg <= Number(p.maxScore)
    );
    if (match) return match.descriptionAr || match.description;
  }

  // Fallback defaults
  if (avg >= 92) return "ممتاز";
  if (avg >= 84) return "جيد جدا";
  if (avg >= 75) return "جيد";
  return "ضعيف";
});

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

// Helpers
function toArabicNumeral(num) {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(num)
    .split("")
    .map((d) => arabicNumerals[parseInt(d)] || d)
    .join("");
}

async function loadFilters() {
  try {
    const [semRes, yearRes, headerRes, predRes] = await Promise.all([
      academicSettingsApi.getSemesters(),
      academicSettingsApi.getAcademicYears(),
      academicSettingsApi.getReportHeader(),
      academicSettingsApi.getPredicates(),
    ]);

    semesters.value = semRes.data || [];
    academicYears.value = yearRes.data || [];
    headerSettings.value = headerRes.data || {};
    predicates.value = predRes.data || [];

    const activeSem = semesters.value.find((s) => s.isActive);
    if (activeSem) semester.value = activeSem.id;

    const activeYear = academicYears.value.find((y) => y.isActive);
    if (activeYear) academicYear.value = activeYear.year;
  } catch (e) {
    console.error("Error loading filters:", e);
  }
}

const isLoadingStudents = ref(false);

async function loadStudents() {
  isLoadingStudents.value = true;
  try {
    const res = await studentsApi.getAll({ limit: 1000 });
    if (res.data) {
      allStudents.value = res.data;
      filteredStudents.value = res.data;
    }
  } catch (e) {
    console.error("Failed to load students:", e);
  } finally {
    isLoadingStudents.value = false;
  }
}

function filterStudents() {
  const query = searchQuery.value.toLowerCase();
  if (!query) {
    filteredStudents.value = allStudents.value.slice(0, 10);
    return;
  }
  filteredStudents.value = allStudents.value
    .filter(
      (s) =>
        s.fullName?.toLowerCase().includes(query) ||
        s.nis?.toLowerCase().includes(query)
    )
    .slice(0, 10);
}

function selectStudent(s) {
  student.value = {
    id: s.id,
    fullName: s.fullName,
    fullNameAr: s.fullNameAr,
    nis: s.nis,
    nisn: s.nisn,
    classId: s.classId || s.class_id, // Try both formats
    className: s.class?.name || "",
    classGrade: s.class?.grade || s.class?.name?.replace(/\D/g, "") || "",
    major: s.major || "Pendidikan Islam",
  };
  searchQuery.value = s.fullName;
  showDropdown.value = false;
  loadData();
}

async function loadData() {
  if (!student.value || !semester.value || !academicYear.value) return;

  loading.value = true;
  try {
    // Load grades
    const gradesRes = await academicApi.getGrades({
      studentId: student.value.id,
      semester: semester.value,
      academicYear: academicYear.value,
    });
    grades.value = (gradesRes.data || []).map((g) => ({
      ...g,
      subjectName: g.subject?.name || g.subjectName || "Unknown",
      subjectNameAr: g.subject?.nameAr || g.subjectNameAr || "",
      kkm: g.subject?.kkm || 70,
    }));

    // Load attendance based on source
    if (attendanceSource.value === "manual") {
      const noteRes = await homeroomNotesApi.getByStudent(
        student.value.id,
        semester.value,
        academicYear.value
      );
      const note = noteRes.data || {};
      attendance.value = {
        sickDays: note.sickDays || 0,
        permissionDays: note.permissionDays || 0,
        absentDays: note.absentDays || 0,
      };
      teacherNotes.value = note.teacherNotes || "";
    } else {
      // TODO: Load from automatic attendance system
      attendance.value = { sickDays: 0, permissionDays: 0, absentDays: 0 };
      teacherNotes.value = "";
    }

    // Load Tahfidz data
    try {
      const tahfidzRes = await tahfidzApi.getReportCard(student.value.id, {
        semester: semester.value === "1" ? "GANJIL" : "GENAP",
        academicYear: academicYear.value,
      });
      if (tahfidzRes.success && tahfidzRes.data) {
        tahfidz.value = {
          target:
            tahfidzRes.data.target?.targetJuz > 0
              ? Number(tahfidzRes.data.target.targetJuz) % 1 === 0
                ? Number(tahfidzRes.data.target.targetJuz).toFixed(0) + " Juz"
                : Number(tahfidzRes.data.target.targetJuz).toFixed(1) + " Juz"
              : tahfidzRes.data.target?.targetPages || "-",
          achieved: tahfidzRes.data.totalJuzUKJ
            ? (Number(tahfidzRes.data.totalJuzUKJ) % 1 === 0
                ? Number(tahfidzRes.data.totalJuzUKJ).toFixed(0)
                : Number(tahfidzRes.data.totalJuzUKJ).toFixed(1)) + " Juz"
            : "-",
          score: tahfidzRes.data.finalScore || "-",
          status:
            tahfidzRes.data.target?.targetJuz > 0
              ? tahfidzRes.data.totalJuzUKJ >= tahfidzRes.data.target.targetJuz
                ? tahfidzRes.data.totalJuzUKJ > tahfidzRes.data.target.targetJuz
                  ? "Melebihi Target"
                  : "Sesuai Target"
                : "Di Bawah Target"
              : tahfidzRes.data.keterangan || "-",
        };
      }
    } catch (e) {
      console.log("No Tahfidz data available");
      tahfidz.value = { target: "-", achieved: "-", score: "-" };
    }

    // Get homeroom teacher name
    if (student.value.classId) {
      try {
        const classRes = await academicApi.getClass(student.value.classId);
        homeroomTeacher.value = classRes.data?.homeroomTeacher?.fullName || "";
      } catch (e) {
        homeroomTeacher.value = "";
      }
    }

    // Get Report Date (Titi Mangsa)
    try {
      const datesRes = await academicSettingsApi.getReportDates();
      if (datesRes.success && datesRes.data) {
        const found = datesRes.data.find(
          (d) =>
            d.academicYear === academicYear.value &&
            d.semester === Number(semester.value)
        );
        if (found) {
          currentDateRaw.value = new Date(found.reportDate);
        } else {
          // Default to today if not set
          currentDateRaw.value = new Date();
        }
      }
    } catch (e) {
      console.error("Error loading report date", e);
    }
  } catch (e) {
    console.error("Error loading data:", e);
    showStatus("Gagal", "Gagal memuat data rapor", "error");
  } finally {
    loading.value = false;
  }
}

function handlePrint() {
  // Calculate scale before printing
  fitReportToA4();
  window.print();
}

/**
 * Calculate scale and position to fit report content within A4 page
 * Uses transform-origin: top left with calculated offsets for VISUAL centering
 *
 * Key insight: transform:scale() only changes VISUAL size, not layout box.
 * So we must use absolute positioning and calculate offsets based on the
 * VISUAL size (contentW * scale) rather than the layout box size (contentW).
 */
function fitReportToA4() {
  const page = document.getElementById("report-page");
  if (!page) return { scale: 1, offsetX: 0, offsetY: 0 };

  // Constants - A4 at 96 DPI
  const MM_TO_PX = 3.7795275591;
  const A4_W = 210 * MM_TO_PX; // ~794px
  const A4_H = 297 * MM_TO_PX; // ~1123px
  const PADDING_MM = 10;
  const paddingPx = PADDING_MM * MM_TO_PX; // 10mm = ~38px (single side)

  // Printable area (A4 minus padding on all sides)
  const printableW = A4_W - paddingPx * 2; // ~718px
  const printableH = A4_H - paddingPx * 2; // ~1047px

  // Reset any transforms to get true content dimensions
  page.style.transform = "none";
  page.style.position = "static";

  // Force reflow
  void page.offsetHeight;

  // Measure actual content size
  const rect = page.getBoundingClientRect();
  const contentW = rect.width;
  const contentH = rect.height;

  // Calculate scale to fit content within printable area
  const scaleW = printableW / contentW;
  const scaleH = printableH / contentH;
  const scale = Math.min(scaleW, scaleH, 1);

  // Calculate VISUAL size after scaling
  const visualW = contentW * scale;
  const visualH = contentH * scale;

  // Calculate offset to CENTER the visual within the A4 page
  // Center position = padding + (printable area - visual size) / 2
  const offsetX = paddingPx + (printableW - visualW) / 2;
  const offsetY = paddingPx + (printableH - visualH) / 2;

  console.log(
    `[fitReportToA4] Content: ${contentW.toFixed(0)}x${contentH.toFixed(0)}px`
  );
  console.log(
    `[fitReportToA4] Printable: ${printableW.toFixed(0)}x${printableH.toFixed(
      0
    )}px`
  );
  console.log(`[fitReportToA4] Scale: ${scale.toFixed(5)}`);
  console.log(
    `[fitReportToA4] Visual: ${visualW.toFixed(0)}x${visualH.toFixed(0)}px`
  );
  console.log(
    `[fitReportToA4] Offset: X=${offsetX.toFixed(1)}px, Y=${offsetY.toFixed(
      1
    )}px`
  );

  // Apply transforms using absolute positioning
  page.style.position = "absolute";
  page.style.left = `${offsetX}px`;
  page.style.top = `${offsetY}px`;
  page.style.transform = `scale(${scale})`;
  page.style.transformOrigin = "top left";

  return { scale, offsetX, offsetY };
}

// PDF Generation using reusable composable
const { exportToPdf, pdfLoading } = usePdfExport();

async function handleDownloadPdf() {
  if (!student.value) return;

  // Verify element exists
  const element = document.getElementById("report-page");
  if (!element) {
    alert("Halaman rapor belum siap. Mohon tunggu sebentar.");
    return;
  }

  try {
    await exportToPdf({
      selector: "#report-page",
      filename: `Rapor_Akademik_${student.value.fullName}_${semester.value}_${academicYear.value}.pdf`,
      paddingMm: 10,
      includeArabicFont: false,
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    alert("Gagal generate PDF: " + error.message);
  }
}

onMounted(async () => {
  await loadFilters();
  await loadStudents();

  // Check if we have query params (for PDF generation via Puppeteer)
  const urlParams = new URLSearchParams(window.location.search);
  const studentId = urlParams.get("studentId");
  const semesterParam = urlParams.get("semester");
  const academicYearParam = urlParams.get("academicYear");
  const attendanceSourceParam = urlParams.get("attendanceSource");

  if (studentId) {
    // Set filters from URL params
    if (semesterParam) semester.value = semesterParam;
    if (academicYearParam) academicYear.value = academicYearParam;
    if (attendanceSourceParam) attendanceSource.value = attendanceSourceParam;

    // Find and select the student
    const foundStudent = allStudents.value.find(
      (s) => String(s.id) === String(studentId)
    );
    if (foundStudent) {
      selectStudent(foundStudent);
    }
  }
});
</script>

<style>
/* ===== Print/PDF Styling ===== */
@page {
  size: A4 portrait;
  margin: 0;
}

/* Screen preview styling */
.print-a4 {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
}

/* Report page uses inline styles set by fitReportToA4() */

@media print {
  /* Hide everything except report */
  body * {
    visibility: hidden;
  }

  #report-area,
  #report-area * {
    visibility: visible;
  }

  /* Reset body */
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }

  /* A4 container - relative positioning, NO flexbox */
  .print-a4 {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 210mm !important;
    height: 297mm !important;
    padding: 0 !important;
    overflow: hidden !important;
    background: white !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    margin: 0 !important;
  }

  /* Report page inherits inline styles from JavaScript */
  #report-page {
    background: white !important;
    box-shadow: none !important;
    border: none !important;
  }
}

/* Arabic Font Class */
.font-arabic {
  font-family: "Cairo", sans-serif;
}
</style>
