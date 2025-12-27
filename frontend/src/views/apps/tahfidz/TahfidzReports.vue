<template>
  <div class="max-w-7xl mx-auto pb-12">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Laporan & Sertifikat</h1>
      <p class="text-slate-500">
        Cetak rapor hafalan dan sertifikat kelulusan santri
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Controls -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 class="font-bold text-slate-800 mb-4">Pengaturan Laporan</h3>

          <div class="space-y-4">
            <div class="relative">
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Pilih Santri</label
              >
              <div class="relative">
                <input
                  type="text"
                  v-model="studentSearch"
                  @focus="showStudentDropdown = true"
                  @input="filterStudents"
                  placeholder="Cari santri..."
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                />
                <button
                  v-if="selectedStudentId"
                  @click="clearStudentSelection"
                  class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-red-500"
                >
                  <Icon icon="solar:close-circle-bold" />
                </button>
              </div>

              <div
                v-if="showStudentDropdown && filteredStudents.length > 0"
                class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                <div
                  v-for="s in filteredStudents"
                  :key="s.id"
                  @click="selectStudent(s)"
                  class="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 flex flex-col"
                >
                  <span class="font-medium">{{ s.fullName }}</span>
                  <span class="text-xs text-slate-500">NIS: {{ s.nis }}</span>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Jenis Dokumen</label
              >
              <select
                v-model="reportType"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
              >
                <option value="rapor">Rapor Semester</option>
                <option value="sertifikat">Sertifikat Kelulusan</option>
              </select>
            </div>

            <div v-if="reportType === 'rapor'">
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Semester / Periode</label
              >
              <select
                v-model="period"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
              >
                <option value="Ganjil 2024/2025">Ganjil 2024/2025</option>
                <option value="Genap 2024/2025">Genap 2024/2025</option>
              </select>
            </div>

            <button
              @click="handlePrint"
              :disabled="!selectedStudentId || loading"
              class="w-full py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1c10] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Icon icon="solar:printer-bold-duotone" />
              Cetak / Download PDF
            </button>
          </div>
        </div>
      </div>

      <!-- Preview Area -->
      <div class="lg:col-span-2">
        <div
          v-if="loading"
          class="h-64 flex items-center justify-center bg-white rounded-xl border border-slate-200"
        >
          <span class="text-slate-500 animate-pulse">Memuat data...</span>
        </div>

        <div
          v-else-if="!selectedStudentId"
          class="h-64 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 text-slate-400"
        >
          <Icon icon="solar:document-text-line-duotone" class="text-4xl mb-2" />
          <p>Pilih santri untuk melihat preview laporan</p>
        </div>

        <div
          v-else
          id="print-area"
          class="bg-white p-8 rounded-xl border border-slate-200 shadow-sm min-h-[800px]"
        >
          <!-- TEMPLATE RAPOR -->
          <div v-if="reportType === 'rapor'" class="text-slate-800">
            <div class="text-center border-b-2 border-slate-800 pb-4 mb-6">
              <h2 class="text-xl font-bold uppercase">
                Rapor Tahfidz Al-Qur'an
              </h2>
              <h3 class="text-lg">Pondok Pesantren Minhajul Haq</h3>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p>
                  <span class="font-semibold w-24 inline-block">Nama</span>:
                  {{ student?.fullName }}
                </p>
                <p>
                  <span class="font-semibold w-24 inline-block">NIS</span>:
                  {{ student?.nis || "-" }}
                </p>
              </div>
              <div class="text-right">
                <p><span class="font-semibold">Periode</span>: {{ period }}</p>
                <p>
                  <span class="font-semibold">Kelas</span>:
                  {{ student?.className || "Reguler" }}
                </p>
              </div>
            </div>

            <div class="mb-6">
              <h4 class="font-bold border-b border-slate-200 pb-2 mb-3">
                A. Capaian Hafalan (Mutaba'ah)
              </h4>
              <div class="bg-slate-50 p-4 rounded-lg">
                <div class="grid grid-cols-2 gap-4">
                  <div
                    class="text-center p-3 bg-white rounded border border-slate-100"
                  >
                    <p class="text-slate-500 text-xs uppercase mb-1">
                      Total Setoran
                    </p>
                    <p class="text-2xl font-bold text-[#602515]">
                      {{ summary.totalDeposits }}
                      <span class="text-sm font-normal text-slate-500"
                        >kali</span
                      >
                    </p>
                  </div>
                  <div
                    class="text-center p-3 bg-white rounded border border-slate-100"
                  >
                    <p class="text-slate-500 text-xs uppercase mb-1">
                      Total Hafalan
                    </p>
                    <p class="text-2xl font-bold text-[#602515]">
                      {{ summary.totalJuz }}
                      <span class="text-sm font-normal text-slate-500"
                        >Juz</span
                      >
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-6">
              <h4 class="font-bold border-b border-slate-200 pb-2 mb-3">
                B. Hasil Ujian
              </h4>
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-slate-50 text-left">
                    <th class="p-2 border">Materi Ujian</th>
                    <th class="p-2 border text-center">Nilai</th>
                    <th class="p-2 border text-center">Predikat</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="exam in summary.exams" :key="exam.id">
                    <td class="p-2 border">
                      {{ exam.type }} ({{ formatDate(exam.date) }})
                    </td>
                    <td class="p-2 border text-center font-bold">
                      {{ exam.finalScore }}
                    </td>
                    <td class="p-2 border text-center">
                      {{ getPredicate(exam.finalScore) }}
                    </td>
                  </tr>
                  <tr v-if="summary.exams.length === 0">
                    <td
                      colspan="3"
                      class="p-4 text-center text-slate-500 italic"
                    >
                      Belum ada data ujian periode ini
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mb-8">
              <h4 class="font-bold border-b border-slate-200 pb-2 mb-3">
                C. Catatan Musyrif
              </h4>
              <div
                class="h-24 border border-slate-200 rounded p-3 text-sm italic text-slate-600"
              >
                Ananda {{ student?.fullName }} menunjukkan perkembangan yang
                sangat baik dalam kelancaran hafalan. Perlu ditingkatkan kembali
                dalam aspek tajwid khususnya ghunnah dan mad. Tetap semangat!
              </div>
            </div>

            <div class="grid grid-cols-2 gap-8 text-center mt-12">
              <div>
                <p class="mb-16">Mengetahui,<br />Orang Tua Wali</p>
                <p
                  class="font-bold border-b border-slate-800 inline-block min-w-[150px]"
                ></p>
              </div>
              <div>
                <p class="mb-16">
                  Purwakarta, {{ currentDate }}<br />Musyrif Tahfidz
                </p>
                <p
                  class="font-bold border-b border-slate-800 inline-block min-w-[150px]"
                >
                  {{ mentorName || "Ustadz" }}
                </p>
              </div>
            </div>
          </div>

          <!-- TEMPLATE SERTIFIKAT -->
          <div
            v-else
            class="text-slate-800 text-center border-8 border-double border-[#602515] p-10 h-full flex flex-col justify-center"
          >
            <div class="mb-8">
              <Icon
                icon="solar:diploma-verified-bold-duotone"
                class="text-6xl text-[#602515] mx-auto mb-4"
              />
              <h1 class="text-4xl font-serif font-bold text-[#602515] mb-2">
                SYAHADAH TAHFIDZ
              </h1>
              <h3 class="text-xl tracking-widest uppercase text-slate-500">
                Sertifikat Kelulusan
              </h3>
            </div>

            <div class="mb-8">
              <p class="text-slate-600 italic">Diberikan kepada:</p>
              <h2 class="text-3xl font-bold mt-2 font-serif">
                {{ student?.fullName }}
              </h2>
              <p class="text-lg mt-2">NIS: {{ student?.nis }}</p>
            </div>

            <div class="mb-8 px-12">
              <p class="text-xl leading-relaxed">
                Telah menyelesaikan ujian hafalan Al-Qur'an sebanyak
                <span class="font-bold">5 Juz</span> dengan predikat
                <span class="font-bold text-[#602515]">MUMTAZ (Istimewa)</span>.
              </p>
            </div>

            <div class="mt-12 flex justify-between px-16">
              <div class="text-center">
                <p class="mb-20">Kepala Pondok</p>
                <p class="font-bold border-b border-black">K.H. Pimpinan</p>
              </div>
              <div class="text-center">
                <p class="mb-20">Purwakarta, {{ currentDate }}<br />Penguji</p>
                <p class="font-bold border-b border-black">Ustadz Penguji</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { studentsApi, tahfidzApi, halaqahApi } from "@/services/api";

const loading = ref(false);
const studentsList = ref([]);
const filteredStudents = ref([]);
const studentSearch = ref("");
const showStudentDropdown = ref(false);

const selectedStudentId = ref("");
const reportType = ref("rapor"); // rapor | sertifikat
const period = ref("Ganjil 2024/2025");

const student = ref(null);
const mentorName = ref("");
const summary = reactive({
  totalDeposits: 0,
  totalJuz: 0,
  exams: [],
});

const currentDate = new Date().toLocaleDateString("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

async function loadInitial() {
  try {
    const res = await studentsApi.getAll({ limit: 1000 });
    if (res.data) {
      studentsList.value = res.data;
      filteredStudents.value = res.data;
    }
  } catch (e) {
    console.error(e);
  }
}

// Search Logic
function filterStudents() {
  if (!studentSearch.value) {
    filteredStudents.value = studentsList.value;
    return;
  }
  const q = studentSearch.value.toLowerCase();
  filteredStudents.value = studentsList.value.filter(
    (s) => s.fullName.toLowerCase().includes(q) || (s.nis && s.nis.includes(q))
  );
  showStudentDropdown.value = true;
}

function selectStudent(student) {
  selectedStudentId.value = student.id;
  studentSearch.value = student.fullName;
  showStudentDropdown.value = false;
  loadStudentData(); // Trigger data load immediately
}

function clearStudentSelection() {
  selectedStudentId.value = "";
  studentSearch.value = "";
  filteredStudents.value = studentsList.value;
  student.value = null; // Clear view
  summary.totalDeposits = 0;
  summary.exams = [];
}

async function loadStudentData() {
  if (!selectedStudentId.value) return;
  loading.value = true;
  try {
    // Fetch Student Detail
    const sRes = await studentsApi.getById(selectedStudentId.value);
    student.value = sRes.data;

    // Fetch Tahfidz Data (Stats/History)
    const [depRes, examRes] = await Promise.all([
      tahfidzApi.getDeposits({ studentId: selectedStudentId.value }),
      tahfidzApi.getExams({ studentId: selectedStudentId.value }),
    ]);

    if (depRes.success) {
      summary.totalDeposits = depRes.data.length;
      // Simple logic for total juz: count unique juz or sum pages. Mocking for now based on deposits
      // Ideally backend aggregation
      const uniqueJuz = new Set(
        depRes.data
          .map((d) => d.location?.match(/Juz (\d+)/)?.[1])
          .filter(Boolean)
      );
      summary.totalJuz = uniqueJuz.size || (depRes.data.length > 0 ? 1 : 0);
    }

    if (examRes.success) {
      summary.exams = examRes.data;
    }

    // Fetch halaqah mentor name
    try {
      const halaqahRes = await halaqahApi.getByStudent(selectedStudentId.value);
      if (halaqahRes.success && halaqahRes.data?.mentorName) {
        mentorName.value = halaqahRes.data.mentorName;
      } else {
        mentorName.value = "";
      }
    } catch (e) {
      console.error("Failed to fetch halaqah mentor:", e);
      mentorName.value = "";
    }
  } catch (e) {
    console.error(e);
    alert("Gagal memuat data santri");
  } finally {
    loading.value = false;
  }
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("id-ID");
}

function getPredicate(score) {
  if (score >= 90) return "Mumtaz";
  if (score >= 80) return "Jayyid Jiddan";
  if (score >= 70) return "Jayyid";
  return "Maqbul";
}

function handlePrint() {
  const printContent = document.getElementById("print-area").innerHTML;
  const originalContent = document.body.innerHTML;

  // Simple print hack
  // Ideally use a dedicated print window or CSS media query
  // BUT modifying body directly in SPA is risky.
  // Better strategy: Create an invisible iframe or use window.print() with CSS print media queries hiding everything else.

  // Applying print class to body
  document.body.classList.add("printing-mode");
  window.print();
  document.body.classList.remove("printing-mode");
}

onMounted(() => {
  loadInitial();
});
</script>

<style>
@media print {
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
    width: 100%;
    margin: 0;
    padding: 0;
    border: none;
    box-shadow: none;
  }
}
</style>
