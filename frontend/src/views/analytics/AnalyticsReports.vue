<template>
  <div class="max-w-7xl mx-auto pb-10">
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold mb-1 text-slate-800">
            Analytics & Rekap Data
          </h1>
          <p class="text-slate-500 text-sm">
            Ringkasan data operasional pondok pesantren
          </p>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Filter Type -->
          <div class="w-full md:w-48">
            <select
              v-model="filterType"
              class="w-full border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Hari Ini</option>
              <option value="this_week">Pekan Ini</option>
              <option value="this_month">Bulan Ini</option>
              <option value="semester">Semester</option>
              <option value="yearly">Tahun Ajaran</option>
              <option value="custom">Kustom Tanggal</option>
            </select>
          </div>

          <!-- Conditional Filters based on Type -->
          <template v-if="filterType === 'semester' || filterType === 'yearly'">
            <div class="w-full md:w-40">
              <select
                v-model="selectedAcademicYear"
                class="w-full border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih Tahun Ajaran</option>
                <option v-for="year in filterOptions.academicYears" :key="year" :value="year">
                  {{ year }}
                </option>
              </select>
            </div>
          </template>

          <template v-if="filterType === 'semester'">
            <div class="w-full md:w-32">
              <select
                v-model="selectedSemester"
                class="w-full border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih Semester</option>
                <option v-for="sem in filterOptions.semesters" :key="sem.value" :value="sem.value">
                  {{ sem.label }}
                </option>
              </select>
            </div>
          </template>

          <template v-if="filterType === 'custom'">
            <div class="flex items-center gap-2 w-full md:w-auto">
              <input
                type="date"
                v-model="customStartDate"
                class="border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <span class="text-slate-500">-</span>
              <input
                type="date"
                v-model="customEndDate"
                class="border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </template>

          <button
            @click="fetchData"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            :disabled="loading"
          >
            <span v-if="loading" class="animate-spin text-lg">
              <span class="iconify" data-icon="mdi:loading"></span>
            </span>
            <span v-else class="iconify" data-icon="mdi:filter-outline"></span>
            Terapkan
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="animate-spin text-4xl text-blue-600">
        <span class="iconify" data-icon="mdi:loading"></span>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else-if="recapData" class="space-y-8">
      
      <!-- Top Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <span class="iconify text-2xl" data-icon="mdi:account-group"></span>
          </div>
          <div>
            <p class="text-sm text-slate-500 font-medium">Total Siswa Aktif</p>
            <p class="text-2xl font-bold text-slate-800">{{ recapData.siswa.totalActive }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
            <span class="iconify text-2xl" data-icon="mdi:account-tie"></span>
          </div>
          <div>
            <p class="text-sm text-slate-500 font-medium">Total Pegawai/Guru</p>
            <p class="text-2xl font-bold text-slate-800">{{ recapData.sdm.teachers + recapData.sdm.staff }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-orange-100 text-orange-600 rounded-lg">
            <span class="iconify text-2xl" data-icon="mdi:door-closed"></span>
          </div>
          <div>
            <p class="text-sm text-slate-500 font-medium">Total Kamar</p>
            <p class="text-2xl font-bold text-slate-800">{{ recapData.kamar.totalRooms }} <span class="text-sm text-slate-500 font-normal">({{ recapData.kamar.totalCapacity }} Kapasitas)</span></p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <span class="iconify text-2xl" data-icon="mdi:google-classroom"></span>
          </div>
          <div>
            <p class="text-sm text-slate-500 font-medium">Total Kelas</p>
            <p class="text-2xl font-bold text-slate-800">{{ recapData.kelas.totalClasses }}</p>
          </div>
        </div>
      </div>

      <!-- SECTION: SDM -->
      <div>
        <h2 class="text-xl font-bold text-slate-800 mb-4 pb-2 border-b">Data SDM & Kepegawaian</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 class="text-md font-semibold text-slate-800 mb-4">Komposisi SDM</h3>
            <div class="h-64">
              <DoughnutChart 
                :labels="['Guru', 'Staf', 'Laki-laki', 'Perempuan']"
                :datasets="[{
                  backgroundColor: ['#3b82f6', '#10b981', '#6366f1', '#ec4899'],
                  data: [recapData.sdm.teachers, recapData.sdm.staff, recapData.sdm.male, recapData.sdm.female]
                }]"
              />
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 class="text-md font-semibold text-slate-800 mb-4">Sebaran SDM per Divisi</h3>
            <div class="h-64">
              <BarChart 
                :labels="Object.keys(recapData.sdm.byDivision)"
                :datasets="[{
                  label: 'Jumlah Pegawai',
                  backgroundColor: '#8b5cf6',
                  data: Object.values(recapData.sdm.byDivision)
                }]"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION: Siswa -->
      <div>
        <h2 class="text-xl font-bold text-slate-800 mb-4 pb-2 border-b">Data Kesantrian / Siswa</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 class="text-md font-semibold text-slate-800 mb-4">Siswa Aktif per Rombel & Gender</h3>
            <div class="h-80">
              <BarChart 
                :labels="Object.keys(recapData.siswa.byClassAndGender)"
                :datasets="[
                  {
                    label: 'Laki-laki',
                    backgroundColor: '#3b82f6',
                    data: Object.values(recapData.siswa.byClassAndGender).map(d => d.male)
                  },
                  {
                    label: 'Perempuan',
                    backgroundColor: '#ec4899',
                    data: Object.values(recapData.siswa.byClassAndGender).map(d => d.female)
                  }
                ]"
                :options="{ responsive: true, maintainAspectRatio: false }"
              />
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 class="text-md font-semibold text-slate-800 mb-4">Status Siswa</h3>
            <div class="h-80">
              <BarChart 
                :labels="Object.keys(recapData.siswa.statusBreakdown)"
                :datasets="[{
                  label: 'Jumlah Siswa',
                  backgroundColor: '#10b981',
                  data: Object.values(recapData.siswa.statusBreakdown)
                }]"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION: Kedisiplinan -->
      <div>
        <h2 class="text-xl font-bold text-slate-800 mb-4 pb-2 border-b">Data Kedisiplinan</h2>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 class="text-md font-semibold text-slate-800 mb-4">Berdasarkan Gender</h3>
            <div class="h-64">
              <BarChart 
                :labels="Object.keys(recapData.kedisiplinan.byGender)"
                :datasets="[
                  { label: 'Penghargaan', backgroundColor: '#10b981', data: Object.values(recapData.kedisiplinan.byGender).map(d => d.reward) },
                  { label: 'Pelanggaran', backgroundColor: '#ef4444', data: Object.values(recapData.kedisiplinan.byGender).map(d => d.punishment) }
                ]"
              />
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 class="text-md font-semibold text-slate-800 mb-4">Berdasarkan Kelas</h3>
            <div class="h-64">
              <BarChart 
                :labels="Object.keys(recapData.kedisiplinan.byClass)"
                :datasets="[
                  { label: 'Penghargaan', backgroundColor: '#10b981', data: Object.values(recapData.kedisiplinan.byClass).map(d => d.reward) },
                  { label: 'Pelanggaran', backgroundColor: '#ef4444', data: Object.values(recapData.kedisiplinan.byClass).map(d => d.punishment) }
                ]"
              />
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 class="text-md font-semibold text-slate-800 mb-4">Berdasarkan Kamar</h3>
            <div class="h-64">
              <BarChart 
                :labels="Object.keys(recapData.kedisiplinan.byRoom)"
                :datasets="[
                  { label: 'Penghargaan', backgroundColor: '#10b981', data: Object.values(recapData.kedisiplinan.byRoom).map(d => d.reward) },
                  { label: 'Pelanggaran', backgroundColor: '#ef4444', data: Object.values(recapData.kedisiplinan.byRoom).map(d => d.punishment) }
                ]"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION: Tahfidz -->
      <div>
        <h2 class="text-xl font-bold text-slate-800 mb-4 pb-2 border-b">Data Tahfidz</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 class="text-md font-semibold text-slate-800 mb-4">Frekuensi Setoran (Ziyadah/Murajaah/dll)</h3>
            <div class="h-64">
              <BarChart 
                :labels="Object.keys(recapData.tahfidz.deposits)"
                :datasets="[{
                  label: 'Jumlah Setoran',
                  backgroundColor: '#14b8a6',
                  data: Object.values(recapData.tahfidz.deposits)
                }]"
              />
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 class="text-md font-semibold text-slate-800 mb-4">Capaian Hafalan per Grup Halaqah</h3>
            <div class="h-64">
              <BarChart 
                :labels="Object.keys(recapData.tahfidz.byHalaqah)"
                :datasets="[{
                  label: 'Total Halaman Disetorkan',
                  backgroundColor: '#0ea5e9',
                  data: Object.values(recapData.tahfidz.byHalaqah)
                }]"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION: Perizinan & Klinik -->
      <div>
        <h2 class="text-xl font-bold text-slate-800 mb-4 pb-2 border-b">Data Perizinan Pegawai & Kesehatan</h2>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 class="text-md font-semibold text-slate-800 mb-4">Izin Pegawai per Divisi</h3>
            <div class="h-64">
              <BarChart 
                :labels="Object.keys(recapData.perizinan.byDivisionAndType)"
                :datasets="[
                  { label: 'Sakit', backgroundColor: '#f59e0b', data: Object.values(recapData.perizinan.byDivisionAndType).map(d => d.sakit || 0) },
                  { label: 'Izin', backgroundColor: '#3b82f6', data: Object.values(recapData.perizinan.byDivisionAndType).map(d => d.izin || 0) },
                  { label: 'Cuti', backgroundColor: '#ec4899', data: Object.values(recapData.perizinan.byDivisionAndType).map(d => d.cuti || 0) }
                ]"
              />
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 class="text-md font-semibold text-slate-800 mb-4">Izin Pegawai per Gender</h3>
            <div class="h-64">
              <BarChart 
                :labels="Object.keys(recapData.perizinan.byGenderAndType)"
                :datasets="[
                  { label: 'Sakit', backgroundColor: '#f59e0b', data: Object.values(recapData.perizinan.byGenderAndType).map(d => d.sakit || 0) },
                  { label: 'Izin', backgroundColor: '#3b82f6', data: Object.values(recapData.perizinan.byGenderAndType).map(d => d.izin || 0) },
                  { label: 'Cuti', backgroundColor: '#ec4899', data: Object.values(recapData.perizinan.byGenderAndType).map(d => d.cuti || 0) }
                ]"
              />
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h3 class="text-md font-semibold text-slate-800 mb-4">Kunjungan Klinik</h3>
            <div class="flex-grow">
              <DoughnutChart 
                :labels="Object.keys(recapData.kesehatan.examinationsByType).map(k => mapPatientType(k))"
                :datasets="[{
                  backgroundColor: ['#3b82f6', '#f43f5e', '#8b5cf6'],
                  data: Object.values(recapData.kesehatan.examinationsByType)
                }]"
              />
            </div>
            <div class="mt-4 pt-4 border-t border-slate-100 flex justify-between">
              <span class="text-sm text-slate-600">Total Kunjungan: <strong class="text-slate-800">{{ recapData.kesehatan.totalExaminations }}</strong></span>
              <span class="text-sm text-rose-600 font-medium">Obat Menipis: {{ recapData.kesehatan.lowStockMedicines }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { analyticsApi } from '@/services/api';
import BarChart from '@/components/charts/BarChart.vue';
import DoughnutChart from '@/components/charts/DoughnutChart.vue';

// Filter state
const filterType = ref('this_month');
const selectedAcademicYear = ref('');
const selectedSemester = ref('');
const customStartDate = ref('');
const customEndDate = ref('');
const filterOptions = ref({ academicYears: [], semesters: [] });

// Data state
const loading = ref(false);
const recapData = ref(null);

// Get current date strings
const getToday = () => new Date().toISOString().split('T')[0];

const getStartOfWeek = () => {
  const d = new Date();
  const day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
};

const getStartOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
};

const getEndOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
};

const mapPatientType = (type) => {
  if (type === 'student') return 'Siswa/Santri';
  if (type === 'teacher') return 'Pegawai/Guru';
  if (type === 'external') return 'Pasien Luar';
  return type;
};

const fetchFilters = async () => {
  try {
    const res = await analyticsApi.getFilters();
    if (res.success) {
      filterOptions.value = res.data;
      if (res.data.academicYears.length > 0) {
        selectedAcademicYear.value = res.data.academicYears[0];
      }
    }
  } catch (error) {
    console.error(error);
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {};
    const today = getToday();

    switch (filterType.value) {
      case 'today':
        params.startDate = today;
        params.endDate = today;
        break;
      case 'this_week':
        params.startDate = getStartOfWeek();
        params.endDate = today;
        break;
      case 'this_month':
        params.startDate = getStartOfMonth();
        params.endDate = getEndOfMonth();
        break;
      case 'semester':
        params.academicYear = selectedAcademicYear.value;
        params.semester = selectedSemester.value;
        break;
      case 'yearly':
        params.academicYear = selectedAcademicYear.value;
        break;
      case 'custom':
        params.startDate = customStartDate.value;
        params.endDate = customEndDate.value;
        break;
    }

    const res = await analyticsApi.getRecap(params);
    if (res.success) {
      recapData.value = res.data;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await fetchFilters();
  await fetchData();
});
</script>
