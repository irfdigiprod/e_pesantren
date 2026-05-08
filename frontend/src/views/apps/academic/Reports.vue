<template>
  <div>
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4"
    >
      <div>
        <h1 class="text-xl font-semibold text-slate-800">Rapor Akademik</h1>
        <p class="text-sm text-slate-500">
          Lihat rapor santri berdasarkan semester.
        </p>
      </div>
      <div class="flex gap-2">
        <select
          v-model="filters.semester"
          @change="fetchData"
          class="border rounded px-3 py-2 text-sm"
        >
          <option value="">Semua Semester</option>
          <option value="Ganjil">Ganjil</option>
          <option value="Genap">Genap</option>
        </select>
        <input
          v-model="filters.academicYear"
          @input="onSearch"
          placeholder="Tahun Ajaran"
          class="border rounded px-3 py-2 text-sm w-32"
        />
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <table class="min-w-full table-auto">
        <thead class="bg-slate-50 text-slate-600 text-sm">
          <tr>
            <th class="px-4 py-3 text-left">#</th>
            <th class="px-4 py-3 text-left">Santri</th>
            <th class="px-4 py-3 text-left">Kelas</th>
            <th class="px-4 py-3 text-left">Semester</th>
            <th class="px-4 py-3 text-left">Tahun Ajaran</th>
            <th class="px-4 py-3 text-left">Rata-rata</th>
            <th class="px-4 py-3 text-left">Ranking</th>
          </tr>
        </thead>
        <tbody class="text-sm text-slate-700">
          <tr v-for="(r, idx) in reports" :key="r.id" class="border-t">
            <td class="px-4 py-3">{{ idx + 1 }}</td>
            <td class="px-4 py-3 font-medium">
              {{ r.student?.fullName || r.studentId }}
            </td>
            <td class="px-4 py-3">{{ r.class?.name || r.classId || "-" }}</td>
            <td class="px-4 py-3">{{ r.semester }}</td>
            <td class="px-4 py-3">{{ r.academicYear }}</td>
            <td class="px-4 py-3">{{ r.average?.toFixed(2) || "-" }}</td>
            <td class="px-4 py-3">{{ r.rank || "-" }}</td>
          </tr>
          <tr v-if="reports.length === 0">
            <td colspan="7" class="px-4 py-6 text-center">Data kosong</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="loading" class="mt-4 text-sm text-slate-500">Memuat...</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { academicApi } from "@/services/api.js";

const reports = ref([]);
const loading = ref(false);
const filters = reactive({ semester: "", academicYear: "" });
let searchTimer = null;

async function fetchData() {
  loading.value = true;
  try {
    const params = {};
    if (filters.semester) params.semester = filters.semester;
    if (filters.academicYear) params.academicYear = filters.academicYear;
    const res = await academicApi.getReports(params);
    reports.value = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    alert(e.message || "Gagal memuat");
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(fetchData, 450);
}

onMounted(fetchData);
</script>
