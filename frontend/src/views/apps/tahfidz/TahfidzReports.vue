<template>
  <div class="p-2 max-w-7xl mx-auto pb-12">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Laporan & Sertifikat</h1>
      <p class="text-slate-500">
        Cetak rapor hafalan dan sertifikat kelulusan santri
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Controls (Left Panel) -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 class="font-bold text-slate-800 mb-4">Pengaturan Laporan</h3>

          <div class="space-y-4">
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
                  placeholder="Cari santri..."
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                />
                <button
                  v-if="student"
                  @click="clearSelection"
                  class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-red-500"
                >
                  <Icon icon="solar:close-circle-bold" />
                </button>
              </div>

              <div
                v-if="showDropdown && filteredStudents.length > 0"
                class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                <div
                  v-for="s in filteredStudents"
                  :key="s.id"
                  @click="selectStudent(s)"
                  class="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 flex flex-col"
                >
                  <span class="font-medium">{{ s.fullName }}</span>
                  <span class="text-xs text-slate-400"
                    >{{ s.nis || "-" }} •
                    {{ s.class?.name || "Belum ada kelas" }}</span
                  >
                </div>
              </div>
            </div>

            <!-- Academic Year -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Tahun Ajaran</label
              >
              <select
                v-model="academicYear"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
              >
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
              </select>
            </div>

            <!-- Semester -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Semester</label
              >
              <select
                v-model="semester"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
              >
                <option value="GANJIL">Ganjil</option>
                <option value="GENAP">Genap</option>
              </select>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="mt-6 space-y-2">
            <button
              @click="exportToExcel"
              :disabled="!student"
              class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Icon icon="solar:document-text-bold" />
              Export Excel
            </button>
            <button
              @click="exportToPDF"
              :disabled="!student"
              class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Icon icon="solar:file-download-bold" />
              Export PDF
            </button>
            <button
              @click="handlePrint"
              :disabled="!student"
              class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white bg-[#602515] hover:bg-[#4a1c10] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Icon icon="solar:printer-bold" />
              Cetak
            </button>
          </div>
        </div>
      </div>

      <!-- Report Preview (Right Panel) -->
      <div class="lg:col-span-3">
        <!-- Loading State -->
        <div
          v-if="loading"
          class="h-64 flex items-center justify-center bg-white rounded-xl border border-slate-200"
        >
          <span class="text-slate-500 animate-pulse">Memuat data...</span>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!student"
          class="h-64 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 text-slate-400"
        >
          <Icon icon="solar:document-text-line-duotone" class="text-4xl mb-2" />
          <p>Pilih santri untuk melihat preview laporan</p>
        </div>

        <!-- Report Area -->
        <div v-else class="w-full">
          <div ref="reportContainer" class="w-full overflow-hidden">
            <div
              id="report-area"
              class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-slate-800 origin-top-left transition-transform duration-200"
              :style="reportStyle"
            >
              <!-- HEADER IMAGE -->
              <div class="mb-4">
                <img
                  v-if="headerImageUrl"
                  :src="headerImageUrl"
                  alt="Header Rapor Tahfidz"
                  class="w-full h-auto"
                />
                <div
                  v-else
                  class="w-full h-32 flex items-center justify-center bg-slate-50 border border-slate-200 border-dashed rounded-lg text-slate-400 font-medium italic"
                >
                  Upload Gambar Kop di pengaturan tahfidz
                </div>
              </div>

              <!-- TITLE -->
              <div class="text-center mb-6">
                <h3 class="text-lg font-bold uppercase">
                  RAPOR TAHFIZH SEMESTER {{ semester }}
                </h3>
                <p class="font-medium">Tahun Ajaran {{ academicYear }}</p>
              </div>

              <!-- STUDENT INFO -->
              <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
                <table class="border-collapse">
                  <tr>
                    <td
                      class="border border-slate-300 px-3 py-1 bg-slate-50 font-medium w-24"
                    >
                      Nama
                    </td>
                    <td class="border border-slate-300 px-3 py-1 font-bold">
                      {{ student.fullName }}
                    </td>
                  </tr>
                  <tr>
                    <td
                      class="border border-slate-300 px-3 py-1 bg-slate-50 font-medium"
                    >
                      Halaqoh
                    </td>
                    <td class="border border-slate-300 px-3 py-1">
                      {{ student.halaqah || "-" }}
                    </td>
                  </tr>
                </table>
                <table class="border-collapse">
                  <tr>
                    <td
                      class="border border-slate-300 px-3 py-1 bg-slate-50 font-medium w-24"
                    >
                      NISN
                    </td>
                    <td class="border border-slate-300 px-3 py-1">
                      {{ student.nis || "-" }}
                    </td>
                  </tr>
                  <tr>
                    <td
                      class="border border-slate-300 px-3 py-1 bg-slate-50 font-medium"
                    >
                      Kelas
                    </td>
                    <td class="border border-slate-300 px-3 py-1">
                      {{ student.className || "-" }}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- UPK SECTION -->
              <div class="mb-6">
                <h4 class="text-center font-bold mb-3">Ujian Pekanan (UPK)</h4>
                <div class="grid grid-cols-2 gap-4 text-xs">
                  <!-- Left Table -->
                  <table class="w-full border-collapse">
                    <thead>
                      <tr class="bg-slate-50">
                        <th
                          class="border border-slate-300 px-2 py-1 text-center w-8"
                        >
                          No
                        </th>
                        <th
                          class="border border-slate-300 px-2 py-1 text-center"
                        >
                          Kode
                        </th>
                        <th
                          class="border border-slate-300 px-2 py-1 text-center"
                        >
                          Halaman
                        </th>
                        <th
                          class="border border-slate-300 px-2 py-1 text-center"
                        >
                          Nilai
                        </th>
                        <th
                          class="border border-slate-300 px-2 py-1 text-center"
                        >
                          Predikat
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(exam, idx) in upkExamsLeft"
                        :key="'upk-left-' + idx"
                      >
                        <td
                          class="border border-slate-300 px-2 py-1 text-center"
                        >
                          {{ idx + 1 }}
                        </td>
                        <td
                          class="border border-slate-300 px-2 py-1 text-center"
                        >
                          {{ getExamCode(exam) }}
                        </td>
                        <td
                          class="border border-slate-300 px-2 py-1 text-center"
                        >
                          {{ getPageRange(exam) }}
                        </td>
                        <td
                          class="border border-slate-300 px-2 py-1 text-center"
                        >
                          {{ exam?.finalScore || "-" }}
                        </td>
                        <td
                          class="border border-slate-300 px-2 py-1 text-center"
                        >
                          {{ getPredicate(exam?.finalScore) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <!-- Right Table -->
                  <table class="w-full border-collapse">
                    <thead>
                      <tr class="bg-slate-50">
                        <th
                          class="border border-slate-300 px-2 py-1 text-center w-8"
                        >
                          No
                        </th>
                        <th
                          class="border border-slate-300 px-2 py-1 text-center"
                        >
                          Kode
                        </th>
                        <th
                          class="border border-slate-300 px-2 py-1 text-center"
                        >
                          Halaman
                        </th>
                        <th
                          class="border border-slate-300 px-2 py-1 text-center"
                        >
                          Nilai
                        </th>
                        <th
                          class="border border-slate-300 px-2 py-1 text-center"
                        >
                          Predikat
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(exam, idx) in upkExamsRight"
                        :key="'upk-right-' + idx"
                      >
                        <td
                          class="border border-slate-300 px-2 py-1 text-center"
                        >
                          {{ idx + 1 + upkExamsLeft.length }}
                        </td>
                        <td
                          class="border border-slate-300 px-2 py-1 text-center"
                        >
                          {{ getExamCode(exam) }}
                        </td>
                        <td
                          class="border border-slate-300 px-2 py-1 text-center"
                        >
                          {{ getPageRange(exam) }}
                        </td>
                        <td
                          class="border border-slate-300 px-2 py-1 text-center"
                        >
                          {{ exam?.finalScore || "-" }}
                        </td>
                        <td
                          class="border border-slate-300 px-2 py-1 text-center"
                        >
                          {{ getPredicate(exam?.finalScore) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <!-- UPK Summary -->
                <div class="grid grid-cols-2 gap-4 mt-2 text-sm">
                  <table class="border-collapse">
                    <tr>
                      <td
                        class="border border-slate-300 px-3 py-1 bg-slate-50 font-medium"
                      >
                        Nilai
                      </td>
                      <td
                        class="border border-slate-300 px-3 py-1 text-center font-bold"
                      >
                        {{ avgUPK }}
                      </td>
                    </tr>
                  </table>
                  <table class="border-collapse">
                    <tr>
                      <td
                        class="border border-slate-300 px-3 py-1 bg-slate-50 font-medium"
                      >
                        Predikat
                      </td>
                      <td
                        class="border border-slate-300 px-3 py-1 text-center font-bold"
                      >
                        {{ getPredicate(avgUPK) }}
                      </td>
                    </tr>
                  </table>
                </div>
              </div>

              <!-- UKJ SECTION -->
              <div class="mb-6">
                <h4 class="text-center font-bold mb-3">
                  Ujian Kenaikan Juz (UKJ)
                </h4>
                <!-- Single UKJ Table with 22 columns for perfect alignment -->
                <table
                  class="w-full border-collapse text-xs"
                  style="table-layout: fixed"
                >
                  <colgroup>
                    <col style="width: 50px" />
                    <!-- Label column -->
                    <col v-for="i in 21" :key="'col-' + i" />
                    <!-- 21 juz columns -->
                  </colgroup>
                  <!-- Row 1: Juz 1-21 -->
                  <tr>
                    <td
                      class="border border-slate-300 px-1 py-1 bg-slate-50 font-medium text-center"
                    >
                      Juz
                    </td>
                    <td
                      v-for="j in 21"
                      :key="'juz1-' + j"
                      class="border border-slate-300 px-1 py-1 text-center"
                    >
                      {{ j }}
                    </td>
                  </tr>
                  <!-- Row 2: Nilai 1-21 -->
                  <tr>
                    <td
                      class="border border-slate-300 px-1 py-1 bg-slate-50 font-medium text-center"
                    >
                      Nilai
                    </td>
                    <td
                      v-for="j in 21"
                      :key="'nilai1-' + j"
                      class="border border-slate-300 px-1 py-1 text-center"
                    >
                      {{ getUkjScore(j) }}
                    </td>
                  </tr>
                  <!-- Row 3: Predikat 1-21 -->
                  <tr>
                    <td
                      class="border border-slate-300 px-1 py-1 bg-slate-50 font-medium text-center"
                    >
                      Predikat
                    </td>
                    <td
                      v-for="j in 21"
                      :key="'pred1-' + j"
                      class="border border-slate-300 px-1 py-1 text-center"
                    >
                      {{ getUkjPredicate(j) }}
                    </td>
                  </tr>
                  <!-- Spacer row for visual separation -->
                  <tr>
                    <td colspan="22" class="border-0 h-3"></td>
                  </tr>
                  <!-- Row 4: Juz 22-30 (cols 1-9) + empty col 10 + Rincian Juz (cols 11-21) -->
                  <tr>
                    <td
                      class="border border-slate-300 px-1 py-1 bg-slate-50 font-medium text-center"
                    >
                      Juz
                    </td>
                    <td
                      v-for="j in 9"
                      :key="'juz2-' + j"
                      class="border border-slate-300 px-1 py-1 text-center"
                    >
                      {{ j + 21 }}
                    </td>
                    <td class="border-0"></td>
                    <!-- col 10 empty -->
                    <td
                      colspan="5"
                      class="border border-slate-300 px-2 py-1 bg-slate-50 font-medium"
                    >
                      Rincian Juz
                    </td>
                    <td
                      colspan="6"
                      class="border border-slate-300 px-2 py-1 text-center"
                    >
                      {{ rincianJuz }}
                    </td>
                  </tr>
                  <!-- Row 5: Nilai 22-30 + Nilai summary -->
                  <tr>
                    <td
                      class="border border-slate-300 px-1 py-1 bg-slate-50 font-medium text-center"
                    >
                      Nilai
                    </td>
                    <td
                      v-for="j in 9"
                      :key="'nilai2-' + j"
                      class="border border-slate-300 px-1 py-1 text-center"
                    >
                      {{ getUkjScore(j + 21) }}
                    </td>
                    <td class="border-0"></td>
                    <td
                      colspan="5"
                      class="border border-slate-300 px-2 py-1 bg-slate-50 font-medium"
                    >
                      Nilai
                    </td>
                    <td
                      colspan="6"
                      class="border border-slate-300 px-2 py-1 text-center font-bold"
                    >
                      {{ avgUKJ }}
                    </td>
                  </tr>
                  <!-- Row 6: Predikat 22-30 + Predikat summary -->
                  <tr>
                    <td
                      class="border border-slate-300 px-1 py-1 bg-slate-50 font-medium text-center"
                    >
                      Predikat
                    </td>
                    <td
                      v-for="j in 9"
                      :key="'pred2-' + j"
                      class="border border-slate-300 px-1 py-1 text-center"
                    >
                      {{ getUkjPredicate(j + 21) }}
                    </td>
                    <td class="border-0"></td>
                    <td
                      colspan="5"
                      class="border border-slate-300 px-2 py-1 bg-slate-50 font-medium"
                    >
                      Predikat
                    </td>
                    <td
                      colspan="6"
                      class="border border-slate-300 px-2 py-1 text-center"
                    >
                      {{ getPredicate(avgUKJ) }}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- FOOTER TABLES -->
              <div class="grid grid-cols-12 gap-4 mb-6 text-xs">
                <!-- Mading Hafalan -->
                <div class="col-span-5">
                  <h5 class="text-center font-bold mb-2">Mading Hafalan</h5>
                  <table class="w-full border-collapse">
                    <!-- Column Headers -->
                    <tr class="bg-slate-50 h-7">
                      <th
                        class="border border-slate-300 px-1 text-center align-middle"
                      >
                        No
                      </th>
                      <th
                        class="border border-slate-300 px-1 text-center align-middle"
                      >
                        Bulan
                      </th>
                      <th
                        class="border border-slate-300 px-1 text-center align-middle"
                      >
                        Jumlah Halaman
                      </th>
                      <th
                        class="border border-slate-300 px-1 text-center align-middle"
                      >
                        Juz
                      </th>
                    </tr>
                    <!-- Data Rows -->
                    <tr
                      v-for="(m, idx) in madingData"
                      :key="'mading-' + idx"
                      class="h-7"
                    >
                      <td
                        class="border border-slate-300 px-1 text-center align-middle"
                      >
                        {{ idx + 1 }}
                      </td>
                      <td class="border border-slate-300 px-1 align-middle">
                        {{ m.bulan }}
                      </td>
                      <td
                        class="border border-slate-300 px-1 text-center align-middle"
                      >
                        {{ m.halaman }}
                      </td>
                      <td class="border border-slate-300 px-1 align-middle">
                        {{ m.juz }}
                      </td>
                    </tr>
                  </table>
                </div>
                <!-- Total Hafalan -->
                <div class="col-span-4">
                  <!-- Spacer to align with Mading Hafalan title -->
                  <h5 class="text-center font-bold mb-2 opacity-0 select-none">
                    Spacer
                  </h5>
                  <table class="w-full border-collapse">
                    <!-- Merged Header Row -->
                    <tr class="h-7">
                      <td
                        colspan="2"
                        class="border border-slate-300 px-2 text-center font-bold bg-slate-100 align-middle"
                      >
                        Total Hafalan
                      </td>
                    </tr>
                    <tr class="h-7">
                      <td
                        class="border border-slate-300 px-2 bg-slate-50 font-medium align-middle"
                      >
                        Target Minimal
                      </td>
                      <td
                        class="border border-slate-300 px-2 text-center align-middle"
                      >
                        {{ targetHafalan || 50 }}
                      </td>
                    </tr>
                    <tr class="h-7">
                      <td
                        class="border border-slate-300 px-2 bg-slate-50 font-medium align-middle"
                      >
                        Jumlah Halaman
                      </td>
                      <td
                        class="border border-slate-300 px-2 text-center align-middle"
                      >
                        {{ totalHafalan }}
                      </td>
                    </tr>
                    <tr class="h-7">
                      <td
                        class="border border-slate-300 px-2 bg-slate-50 font-medium align-middle"
                      >
                        Jumlah Juz
                      </td>
                      <td
                        class="border border-slate-300 px-2 text-center align-middle"
                      >
                        {{ jumlahJuz }}
                      </td>
                    </tr>
                    <tr class="h-7">
                      <td
                        class="border border-slate-300 px-2 bg-slate-50 font-medium align-middle"
                      >
                        Keterangan
                      </td>
                      <td
                        class="border border-slate-300 px-2 text-center font-bold text-[7pt] align-middle"
                      >
                        {{ keteranganHafalan }}
                      </td>
                    </tr>
                  </table>
                </div>
                <!-- Kehadiran -->
                <div class="col-span-3">
                  <!-- Spacer to align with Mading Hafalan title -->
                  <h5 class="text-center font-bold mb-2 opacity-0 select-none">
                    Spacer
                  </h5>
                  <table class="w-full border-collapse">
                    <!-- Merged Header Row -->
                    <tr class="h-7">
                      <td
                        colspan="3"
                        class="border border-slate-300 px-2 text-center font-bold bg-slate-100 align-middle"
                      >
                        Kehadiran
                      </td>
                    </tr>
                    <tr class="h-7">
                      <td
                        class="border border-slate-300 px-2 bg-slate-50 font-medium align-middle"
                      >
                        Sakit
                      </td>
                      <td
                        class="border border-slate-300 px-2 text-center align-middle"
                      >
                        {{ attendance.sakit }}
                      </td>
                      <td
                        class="border border-slate-300 px-2 bg-slate-50 font-medium align-middle"
                      >
                        JPL
                      </td>
                    </tr>
                    <tr class="h-7">
                      <td
                        class="border border-slate-300 px-2 bg-slate-50 font-medium align-middle"
                      >
                        Izin
                      </td>
                      <td
                        class="border border-slate-300 px-2 text-center align-middle"
                      >
                        {{ attendance.izin }}
                      </td>
                      <td
                        class="border border-slate-300 px-2 bg-slate-50 font-medium align-middle"
                      >
                        JPL
                      </td>
                    </tr>
                    <tr class="h-7">
                      <td
                        class="border border-slate-300 px-2 bg-slate-50 font-medium align-middle"
                      >
                        Alpa
                      </td>
                      <td
                        class="border border-slate-300 px-2 text-center align-middle"
                      >
                        {{ attendance.alpha }}
                      </td>
                      <td
                        class="border border-slate-300 px-2 bg-slate-50 font-medium align-middle"
                      >
                        JPL
                      </td>
                    </tr>
                  </table>
                </div>
              </div>

              <!-- CATATAN & NILAI AKHIR -->
              <div class="grid grid-cols-4 gap-4 mb-6 text-sm">
                <div class="col-span-3 flex flex-col">
                  <h5 class="font-bold mb-2">Catatan</h5>
                  <div
                    class="border border-slate-300 p-3 h-full text-xs whitespace-pre-line"
                  >
                    {{ notes || "-" }}
                  </div>
                </div>
                <div>
                  <h5 class="font-bold mb-2 text-center">Total Nilai Akhir</h5>
                  <table class="w-full border-collapse text-xs">
                    <tr>
                      <td
                        class="border border-slate-300 px-2 py-1 bg-slate-50 font-medium"
                      >
                        UPK
                      </td>
                      <td class="border border-slate-300 px-2 py-1 text-center">
                        {{ avgUPK }}
                      </td>
                    </tr>
                    <tr>
                      <td
                        class="border border-slate-300 px-2 py-1 bg-slate-50 font-medium"
                      >
                        UKJ
                      </td>
                      <td class="border border-slate-300 px-2 py-1 text-center">
                        {{ avgUKJ }}
                      </td>
                    </tr>
                    <tr>
                      <td
                        class="border border-slate-300 px-2 py-1 bg-slate-50 font-medium"
                      >
                        UA
                      </td>
                      <td class="border border-slate-300 px-2 py-1 text-center">
                        {{ uaScore || "-" }}
                      </td>
                    </tr>
                    <tr>
                      <td
                        class="border border-slate-300 px-2 py-1 bg-slate-50 font-medium"
                      >
                        Suluk
                      </td>
                      <td class="border border-slate-300 px-2 py-1 text-center">
                        {{ sulukScore }}
                      </td>
                    </tr>
                    <tr>
                      <td
                        class="border border-slate-300 px-2 py-1 bg-slate-50 font-bold"
                      >
                        Nilai Akhir
                      </td>
                      <td
                        class="border border-slate-300 px-2 py-1 text-center font-bold"
                      >
                        {{ finalScore }}
                      </td>
                    </tr>
                    <!-- Merged Predicate Row -->
                    <tr>
                      <td
                        colspan="2"
                        class="border border-slate-300 p-2 text-center font-bold"
                      >
                        {{ tercapaiLabel }}
                      </td>
                    </tr>
                  </table>
                </div>
              </div>

              <!-- SIGNATURES -->
              <div class="grid grid-cols-3 gap-4 mt-8 text-xs text-center">
                <div>
                  <p>Mengetahui,</p>
                  <p>Orang tua</p>
                  <div class="h-20"></div>
                  <p class="">( ............................... )</p>
                </div>
                <div>
                  <p>Mengetahui,</p>
                  <p>Ketua Bagian Tahfidz</p>
                  <div class="h-20"></div>
                  <p class="font-bold">
                    {{ tahfidzHeadNameDisplay }}
                  </p>
                </div>
                <div>
                  <p>
                    {{ settings.cityName || "..........." }}, {{ currentDate }}
                  </p>
                  <p>Wali Kelas</p>
                  <div class="h-20"></div>
                  <p class="font-bold">
                    {{
                      student.homeroomTeacher ||
                      "..............................."
                    }}
                  </p>
                </div>
              </div>
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
import { studentsApi, tahfidzApi } from "@/services/api";
import { exportTahfidzReportToExcel } from "@/services/exports/tahfidzReportExporter";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const loading = ref(false);

const reportContainer = ref(null);
const { width: containerWidth } = useElementSize(reportContainer);
const scale = computed(() => {
  if (!containerWidth.value) return 1;
  const A4_WIDTH_PX = 794; // 210mm @ 96dpi approx
  const availableWidth = containerWidth.value;

  // If container is smaller than A4, scale down. Otherwise 1.
  return availableWidth < A4_WIDTH_PX ? availableWidth / A4_WIDTH_PX : 1;
});

const reportStyle = computed(() => ({
  width: "210mm",
  minHeight: "297mm",
  transform: `scale(${scale.value})`,
  marginBottom: `-${(1 - scale.value) * 100}%`,
}));

/* ---------- State ---------- */
const showDropdown = ref(false);
const searchQuery = ref("");
const academicYear = ref("2025-2026");
const semester = ref("GANJIL");

const filteredStudents = ref([]);
const allStudents = ref([]);

const student = ref(null);
const settings = ref({});
const exams = ref([]);
const attendance = ref({ sakit: 0, izin: 0, alpha: 0 });
const totalHafalan = ref(0);
const notes = ref("");
const targetHafalan = ref(50); // Default, updated from API
const madingData = ref([]);

// Current date
const currentDate = computed(() => {
  return new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

// API Base for image URLs
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// Dynamic header image URL from settings
const headerImageUrl = computed(() => {
  const logo = settings.value?.institutionLogo;
  if (!logo) return null; // No default image, use text fallback
  if (logo.startsWith("http")) return logo;
  return `${API_BASE}/api/${logo}`;
});

// Conditional Tahfidz Head Name based on student gender
const tahfidzHeadNameDisplay = computed(() => {
  const isFemale =
    student.value?.gender === "female" || student.value?.gender === "perempuan";

  // If female and akhwat head name is set, use it
  if (isFemale && settings.value?.tahfidzHeadNameAkhwat) {
    return settings.value.tahfidzHeadNameAkhwat;
  }

  // Otherwise use the default (ikhwan) head name
  return settings.value?.tahfidzHeadName || "...............................";
});

const upkExams = computed(() => {
  return exams.value.filter(
    (e) => e.examCategory === "UPK" || e.type === "UPK"
  );
});

const upkExamsLeft = computed(() => {
  const total = upkExams.value.length;
  // Ensure minimum 4 rows for visual stability
  const limit = Math.max(4, Math.ceil(total / 2));

  const arr = [];
  for (let i = 0; i < limit; i++) {
    arr.push(upkExams.value[i] || null);
  }
  return arr;
});

const upkExamsRight = computed(() => {
  const total = upkExams.value.length;
  const splitPoint = Math.max(4, Math.ceil(total / 2));
  // Determine how many rows the right side should have to match left (or minimal 4)
  // Usually right side length = splitPoint if total > 8, or minimal 4 if total is small.
  // Actually, standard is to match the left side row count.
  const limit = splitPoint;

  const arr = [];
  for (let i = 0; i < limit; i++) {
    const examIndex = splitPoint + i;
    // However, if we split by index, right side indices start at `splitPoint`.
    // But what if total is 9? Split=5. Left=0-4. Right should start at 5.
    // Right table index 0 => Exam 5.
    // BUT! Wait. My original logic was "split based on list".
    // If I have 9 items. Left gets 5. Right gets 4.
    // If I force right to be length 5, the last one is null. That is correct.
    arr.push(upkExams.value[splitPoint + i] || null);
  }
  return arr;
});

// Computed for UKJ exams
const ukjExams = computed(() => {
  return exams.value.filter(
    (e) => e.examCategory === "UKJ" || e.type === "UKJ"
  );
});

// Computed for UA
const uaScore = computed(() => {
  const ua = exams.value.find((e) => e.examCategory === "UA");
  return ua ? Number(ua.finalScore) : 0;
});

// Computed for Suluk
const sulukScore = computed(() => {
  // Ambil semua ujian yang memiliki nilai adab (scoreAdab)
  const examsWithAdab = exams.value.filter(
    (e) => e.scoreAdab !== undefined && e.scoreAdab !== null && e.scoreAdab > 0
  );

  if (examsWithAdab.length === 0) return 0;

  // Hitung rata-rata
  const total = examsWithAdab.reduce((sum, e) => sum + Number(e.scoreAdab), 0);
  return (total / examsWithAdab.length).toFixed(2);
});

// Average UPK
const avgUPK = computed(() => {
  const upk = upkExams.value.filter((e) => e && e.finalScore);
  if (upk.length === 0) return 0;
  const sum = upk.reduce((acc, e) => acc + Number(e.finalScore), 0);
  return (sum / upk.length).toFixed(2);
});

// Average UKJ
const avgUKJ = computed(() => {
  const ukj = ukjExams.value.filter((e) => e && e.finalScore);
  if (ukj.length === 0) return 0;
  const sum = ukj.reduce((acc, e) => acc + Number(e.finalScore), 0);
  return (sum / ukj.length).toFixed(2);
});

// Rincian Juz (list of juz numbers from UKJ exams)
const rincianJuz = computed(() => {
  const juzNumbers = ukjExams.value.map((e) => e.juz).filter(Boolean);
  return juzNumbers.length > 0 ? juzNumbers.join(", ") : "-";
});

// Final Score
const finalScore = computed(() => {
  const upk = Number(avgUPK.value) || 0;
  const ukj = Number(avgUKJ.value) || 0;
  const ua = Number(uaScore.value) || 0;
  const suluk = Number(sulukScore.value) || 0;

  // Rata-rata dari 4 komponen (UPK, UKJ, UA, Suluk)
  // Note: If UA is 0 (not held), should we divide by 3?
  // User said "rata-rata dari nilai upk, ukj, ua dan suluk". Assuming all must exist.
  // If UA is usually integral, we keep / 4.
  const components = [upk, ukj, ua, suluk].filter((v) => v > 0);
  if (components.length === 0) return 0;

  // return (components.reduce((a, b) => a + b, 0) / components.length).toFixed(2);
  // Strict average of 4 components as requested? Or valid components?
  // Usually if UA is missing, it's 0. Let's stick to / 4 for standard.
  return ((upk + ukj + ua + suluk) / 4).toFixed(2);
});

// Jumlah Juz
const jumlahJuz = computed(() => {
  const pages = Number(totalHafalan.value);
  const juz = Math.floor(pages / 20);
  const remaining = (pages % 20).toFixed(0);
  if (juz === 0) return `${remaining} Halaman`;
  return `${juz} Juz ${remaining} Halaman`;
});

// Keterangan Hafalan
const keteranganHafalan = computed(() => {
  const current = Number(totalHafalan.value);
  const target = Number(targetHafalan.value);

  if (current >= target) return "MELEBIHI TARGET (MT)";
  // "SESUAI TARGET" logic? Maybe range? User prompt didn't specify distinct Sesuai/Melebihi range
  // Assuming >= Target is MT. < Target is "BELUM SESUAI TARGET"
  // Let's keep existing logic if target is met.
  return "BELUM SESUAI TARGET";
});

// Tercapai label
const tercapaiLabel = computed(() => {
  // Logic: Jika Nilai akhir < 70 ATAU Keterangan Tidak mencapai target MT -> Tidak tercapai
  const score = Number(finalScore.value);
  const isTargetMet = Number(totalHafalan.value) >= Number(targetHafalan.value);

  if (score < 70 || !isTargetMet) {
    return "Tidak Tercapai";
  }
  return "Tercapai";
});

// --- HELPER FUNCTIONS ---
function getExamCode(exam) {
  if (!exam || !exam.id) return "-";
  if (exam.examCode) return exam.examCode;

  // Use property from API response if varies (e.g. date vs examDate)
  const dateStr = exam.date || exam.examDate;

  // Generate from date
  if (dateStr) {
    const d = new Date(dateStr);
    const month = d.toLocaleString("id-ID", { month: "short" }).toUpperCase();
    const week = Math.ceil(d.getDate() / 7);
    return `${month}(${week})`;
  }
  return `EX-${exam.id}`;
}

function getPageRange(exam) {
  if (!exam) return "-";
  if (exam.startPage && exam.endPage)
    return `${exam.startPage}-${exam.endPage}`;
  return "-";
}

// Predicate Helper
function getPredicate(score) {
  if (score === null || score === undefined || score === "") return "-";
  const s = Number(score);
  if (isNaN(s)) return "-";

  if (s >= 90) return "A+"; // Mumtaz
  if (s >= 80) return "A"; // Jayyid Jiddan
  if (s >= 70) return "B+"; // Jayyid
  if (s >= 65) return "B"; // Maqbul
  return "C"; // Rosib (0-64.99)
}

function getUkjScore(juz) {
  const exam = ukjExams.value.find((e) => e.juz == juz); // loose equality for string/number
  return exam ? exam.finalScore : "";
}

function getUkjPredicate(juz) {
  const exam = ukjExams.value.find((e) => e.juz == juz);
  return exam ? getPredicate(exam.finalScore) : "";
}

// --- DATA LOADING ---
async function loadStudents() {
  try {
    const res = await studentsApi.getAll({ limit: 1000 });
    if (res.data) {
      allStudents.value = res.data;
      filteredStudents.value = res.data;
    }
  } catch (e) {
    console.error("Failed to load students:", e);
  }
}

function filterStudents() {
  const q = searchQuery.value.toLowerCase();
  if (!q) {
    filteredStudents.value = allStudents.value;
    return;
  }
  filteredStudents.value = allStudents.value.filter(
    (s) => s.fullName.toLowerCase().includes(q) || (s.nis && s.nis.includes(q))
  );
  showDropdown.value = true;
}

async function selectStudent(s) {
  searchQuery.value = s.fullName;
  showDropdown.value = false;
  loading.value = true;

  try {
    // Load report card data with filters
    const res = await tahfidzApi.getReportCard(s.id, {
      academicYear: academicYear.value,
      semester: semester.value,
    });

    if (res.data) {
      const d = res.data;

      student.value = d.student;
      exams.value = d.exams || [];

      attendance.value = d.attendance || { sakit: 0, izin: 0, alpha: 0 };
      totalHafalan.value = Number(d.totalHafalan || 0);
      settings.value = d.settings || {};
      madingData.value = d.mading || [];

      // Notes logic: Fetch from 'Suluk' exam notes
      const sulukExam = d.exams?.find((e) => e.examCategory === "Suluk");
      notes.value = sulukExam?.notes || "";
      targetHafalan.value = d.target?.targetPages || 50;
    }
  } catch (e) {
    console.error("Failed to load student data:", e);
    alert("Gagal memuat data rapor santri");
  } finally {
    loading.value = false;
  }
}

function clearSelection() {
  student.value = null;
  searchQuery.value = "";
  exams.value = [];
  madingData.value = [];
  totalHafalan.value = 0;
}

// Reload when filters change
// Reload when filters change
watch([academicYear, semester], () => {
  if (student.value) {
    selectStudent(student.value);
  }
});

// --- EXPORT FUNCTIONS ---
async function exportToPDF() {
  if (!student.value) return;

  const element = document.getElementById("report-area");
  if (!element) return;

  try {
    // Create fixed-width container for consistent layout
    const printContainer = document.createElement("div");
    printContainer.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 800px;
      padding: 20px;
      background: white;
      font-family: Arial, sans-serif;
    `;

    const clonedContent = element.cloneNode(true);
    printContainer.appendChild(clonedContent);
    document.body.appendChild(printContainer);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const canvas = await html2canvas(printContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: 800,
      windowWidth: 800,
    });

    document.body.removeChild(printContainer);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 5;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= pageHeight - margin * 2) {
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        margin,
        margin,
        imgWidth,
        imgHeight
      );
    } else {
      const scaleFactor = (pageHeight - margin * 2) / imgHeight;
      const scaledWidth = imgWidth * scaleFactor;
      const scaledHeight = imgHeight * scaleFactor;
      const xOffset = (pageWidth - scaledWidth) / 2;
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        xOffset,
        margin,
        scaledWidth,
        scaledHeight
      );
    }

    const fileName = `Rapor_Tahfidz_${student.value.fullName.replace(
      /\s+/g,
      "_"
    )}_${semester.value}_${academicYear.value.replace("/", "-")}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error("Failed to export PDF:", error);
    alert("Gagal mengekspor PDF. Silakan coba lagi.");
  }
}

async function exportToExcel() {
  if (!student.value) return;

  const reportData = {
    semester: semester.value,
    academicYear: academicYear.value,
    student: student.value,
    upkExams: upkExams.value,
    avgUPK: avgUPK.value,
    ukjExams: ukjExams.value,
    avgUKJ: avgUKJ.value,
    uaScore: uaScore.value,
    sulukScore: sulukScore.value,
    finalScore: finalScore.value,
    tercapaiLabel: tercapaiLabel.value,
    madingData: madingData.value,
    targetHafalan: targetHafalan.value,
    totalHafalan: totalHafalan.value,
    jumlahJuz: jumlahJuz.value,
    keteranganHafalan: keteranganHafalan.value,
    attendance: attendance.value,
    notes: notes.value,
    tahfidzHeadNameDisplay: tahfidzHeadNameDisplay.value,
    cityName: settings.value.cityName,
    currentDate: currentDate.value,
    headerImageUrl: headerImageUrl.value,
  };

  try {
    await exportTahfidzReportToExcel(reportData);
  } catch (error) {
    console.error("Export failed:", error);
    alert("Gagal mengunduh Excel.");
  }
}

function handlePrint() {
  window.print();
}

// --- LIFECYCLE ---
onMounted(() => {
  loadStudents();
});
</script>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  #report-area,
  #report-area * {
    visibility: visible;
  }
  #report-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    transform: scale(0.75);
    transform-origin: top left;
  }
}
</style>
