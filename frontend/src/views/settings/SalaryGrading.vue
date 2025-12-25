<template>
  <div class="max-w-6xl mx-auto pb-12">
    <!-- Header -->
    <div
      class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-800">
          Penentuan Komponen Gaji Guru
        </h1>
        <p class="text-slate-500 mt-1">
          Atur golongan, jabatan, dan masa kerja untuk setiap guru.
        </p>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-3 w-full">
        <!-- Row 1: View Toggle -->
        <div class="flex items-center gap-3">
          <div
            class="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex items-center"
          >
            <button
              @click="viewMode = 'table'"
              class="p-1.5 rounded-md transition-all"
              :class="
                viewMode === 'table'
                  ? 'bg-indigo-50 text-indigo-600'
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
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
              "
            >
              <Icon icon="lucide:layout-grid" class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Row 2: Filters Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <select
            v-model="filters.divisionId"
            class="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Semua Divisi</option>
            <option v-for="div in divisions" :key="div.id" :value="div.id">
              {{ div.name }}
            </option>
          </select>

          <select
            v-model="filters.gradeId"
            class="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Semua Golongan</option>
            <option value="null">Belum Diatur</option>
            <option v-for="g in grades" :key="g.id" :value="g.id">
              {{ g.name }}
            </option>
          </select>

          <select
            v-model="filters.gender"
            class="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Semua Gender</option>
            <option value="male">Laki-laki</option>
            <option value="female">Perempuan</option>
          </select>

          <!-- Search -->
          <div class="relative col-span-2 sm:col-span-1">
            <span class="absolute left-3 top-2.5 text-slate-400">
              <Icon icon="lucide:search" class="w-5 h-5" />
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari guru..."
              class="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-if="loading" class="flex justify-center py-12">
      <Icon
        icon="lucide:loader-2"
        class="w-8 h-8 animate-spin text-indigo-600"
      />
    </div>

    <div
      v-else-if="viewMode === 'table'"
      class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead
            class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200"
          >
            <tr>
              <th class="px-6 py-3">Nama Guru</th>
              <th class="px-6 py-3">NIP</th>
              <th class="px-6 py-3">Golongan</th>
              <th class="px-6 py-3">Jabatan</th>
              <th class="px-6 py-3">Masa Kerja</th>
              <th class="px-6 py-3">Jam Mengajar</th>
              <th class="px-6 py-3">Rekening Bank</th>
              <th class="px-6 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="teacher in filteredTeachers"
              :key="teacher.id"
              class="border-b border-slate-100 hover:bg-slate-50"
            >
              <td class="px-6 py-4 font-medium text-slate-800">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600"
                  >
                    {{ getInitials(teacher.fullName) }}
                  </div>
                  <div>
                    <span>{{ teacher.fullName }}</span>
                    <p class="text-xs text-slate-400">
                      {{
                        teacher.divisions?.map((d) => d.name).join(", ") ||
                        teacher.department ||
                        "-"
                      }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-slate-600">
                {{ teacher.nip || "-" }}
              </td>
              <td class="px-6 py-4">
                <span
                  v-if="teacher.salaryGrade"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                >
                  <Icon
                    icon="solar:banknote-2-line-duotone"
                    class="w-3.5 h-3.5"
                  />
                  {{ teacher.salaryGrade.name }}
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500"
                >
                  Belum diatur
                </span>
              </td>
              <td class="px-6 py-4">
                <span
                  v-if="teacher.positionAllowance"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
                >
                  <Icon icon="lucide:briefcase" class="w-3.5 h-3.5" />
                  {{ teacher.positionAllowance.position }}
                </span>
                <span
                  v-else-if="teacher.position"
                  class="text-slate-600 text-xs"
                >
                  {{ teacher.position }}
                </span>
                <span v-else class="text-slate-400 text-xs">-</span>
              </td>
              <td class="px-6 py-4">
                <span
                  v-if="teacher.joinDate"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100"
                >
                  <Icon icon="lucide:calendar" class="w-3.5 h-3.5" />
                  {{ calculateYearsService(teacher.joinDate) }} Tahun
                </span>
                <span v-else class="text-slate-400 text-xs">-</span>
              </td>
              <td class="px-6 py-4">
                <span
                  v-if="teacher.teachingHours"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                >
                  <Icon icon="lucide:clock" class="w-3.5 h-3.5" />
                  {{ teacher.teachingHours }} Jam
                </span>
                <span v-else class="text-slate-400 text-xs">-</span>
              </td>
              <td class="px-6 py-4">
                <div v-if="teacher.bankName" class="text-xs">
                  <div class="font-medium text-slate-700">
                    {{ teacher.bankName }}
                  </div>
                  <div class="text-slate-500">
                    {{ teacher.bankAccountNumber || "-" }}
                  </div>
                </div>
                <span v-else class="text-slate-400 text-xs">-</span>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  @click="openAssignModal(teacher)"
                  class="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg transition-colors shadow-sm"
                >
                  Atur Komponen
                </button>
              </td>
            </tr>
            <tr v-if="filteredTeachers.length === 0">
              <td colspan="8" class="px-6 py-12 text-center text-slate-500">
                Data guru tidak ditemukan
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Card View -->
    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <div
        v-for="teacher in filteredTeachers"
        :key="teacher.id"
        class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow flex flex-col"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600"
            >
              {{ getInitials(teacher.fullName) }}
            </div>
            <div>
              <h3
                class="font-bold text-slate-800 line-clamp-1"
                :title="teacher.fullName"
              >
                {{ teacher.fullName }}
              </h3>
              <p class="text-xs text-slate-500">{{ teacher.nip || "-" }}</p>
            </div>
          </div>
          <span
            v-if="teacher.gender === 'male'"
            class="bg-blue-50 text-blue-600 p-1 rounded-md"
            title="Laki-laki"
          >
            <Icon icon="lucide:user" class="w-4 h-4" />
          </span>
          <span
            v-else
            class="bg-pink-50 text-pink-600 p-1 rounded-md"
            title="Perempuan"
          >
            <Icon icon="lucide:user" class="w-4 h-4" />
          </span>
        </div>

        <div class="space-y-2 text-sm border-t border-slate-100 pt-3 mb-4">
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Golongan</span>
            <span
              v-if="teacher.salaryGrade"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
            >
              {{ teacher.salaryGrade.name }}
            </span>
            <span v-else class="text-xs text-slate-400"> - </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Jabatan</span>
            <span
              v-if="teacher.positionAllowance"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700"
            >
              {{ teacher.positionAllowance.position }}
            </span>
            <span v-else class="text-xs text-slate-400">{{
              teacher.position || "-"
            }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Masa Kerja</span>
            <span
              v-if="teacher.joinDate"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700"
            >
              {{ calculateYearsService(teacher.joinDate) }} Thn
            </span>
            <span v-else class="text-xs text-slate-400">-</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Jam Mengajar</span>
            <span
              v-if="teacher.teachingHours"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
            >
              {{ teacher.teachingHours }} Jam
            </span>
            <span v-else class="text-xs text-slate-400">-</span>
          </div>
        </div>

        <!-- Bank Info Section -->
        <div
          v-if="teacher.bankName"
          class="mt-3 mb-3 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-100"
        >
          <div class="flex items-center gap-2 mb-2">
            <Icon icon="lucide:landmark" class="w-4 h-4 text-cyan-600" />
            <span class="text-xs font-semibold text-cyan-800"
              >Informasi Rekening</span
            >
          </div>
          <div class="space-y-1.5 text-xs">
            <div class="flex justify-between">
              <span class="text-slate-500">Bank</span>
              <span class="font-medium text-slate-700"
                >{{ teacher.bankName }}
                {{ teacher.bankCode ? `(${teacher.bankCode})` : "" }}</span
              >
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">No. Rekening</span>
              <span class="font-mono font-medium text-slate-700">{{
                teacher.bankAccountNumber || "-"
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Atas Nama</span>
              <span class="font-medium text-slate-700">{{
                teacher.bankAccountName || "-"
              }}</span>
            </div>
          </div>
        </div>
        <div
          v-else
          class="flex flex-col items-center justify-center h-full mt-3 mb-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-center"
        >
          <div>
            <Icon
              icon="lucide:landmark"
              class="w-4 h-4 text-slate-400 m-auto"
            />
            <span class="text-xs text-slate-400">Belum ada data rekening</span>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="mt-auto pt-3 border-t border-slate-100">
          <button
            @click="openAssignModal(teacher)"
            class="w-full py-2 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-100 hover:border-indigo-200 transition-colors text-sm font-medium"
          >
            <Icon icon="solar:pen-bold-duotone" class="w-4 h-4" />
            Atur Komponen
          </button>
        </div>
      </div>

      <div
        v-if="filteredTeachers.length === 0"
        class="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200"
      >
        Data guru tidak ditemukan
      </div>
    </div>

    <!-- Assign Modal -->
    <div
      v-if="modalOpen"
      class="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
    >
      <div
        class="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
      >
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="text-lg font-bold">Atur Komponen Gaji Guru</h3>
            <p class="text-sm text-slate-500">
              Atur golongan, jabatan, dan tanggal bergabung untuk
              <strong>{{ selectedTeacher?.fullName }}</strong>
            </p>
          </div>
          <button
            type="button"
            @click="closeModal"
            class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Icon icon="lucide:x" class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveAssignment">
          <div class="space-y-4">
            <!-- Golongan -->
            <div>
              <label class="block text-sm font-medium mb-1">
                <Icon
                  icon="solar:banknote-2-line-duotone"
                  class="w-4 h-4 inline mr-1"
                />
                Golongan Gaji
              </label>
              <select
                v-model="formData.salaryGradeId"
                class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option :value="null">-- Tidak Ada Golongan --</option>
                <option
                  v-for="grade in grades"
                  :key="grade.id"
                  :value="grade.id"
                >
                  {{ grade.name }}
                </option>
              </select>
            </div>

            <!-- Jabatan -->
            <div>
              <label class="block text-sm font-medium mb-1">
                <Icon icon="lucide:briefcase" class="w-4 h-4 inline mr-1" />
                Jabatan (Tunjangan)
              </label>
              <select
                v-model="formData.positionAllowanceId"
                class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option :value="null">-- Tidak Ada Jabatan --</option>
                <option v-for="pos in positions" :key="pos.id" :value="pos.id">
                  {{ pos.position }} ({{ formatCurrency(pos.amount) }})
                </option>
              </select>
              <p class="text-xs text-slate-500 mt-1">
                Jabatan akan menentukan tunjangan jabatan guru.
              </p>
            </div>

            <!-- Tanggal Bergabung -->
            <div>
              <label class="block text-sm font-medium mb-1">
                <Icon icon="lucide:calendar" class="w-4 h-4 inline mr-1" />
                Tanggal Bergabung
              </label>
              <input
                v-model="formData.joinDate"
                type="date"
                class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <p class="text-xs text-slate-500 mt-1">
                <template v-if="formData.joinDate">
                  Masa Kerja:
                  <strong class="text-amber-600"
                    >{{
                      calculateYearsService(formData.joinDate)
                    }}
                    Tahun</strong
                  >
                </template>
                <template v-else>
                  Masa kerja akan dihitung otomatis dari tanggal bergabung.
                </template>
              </p>
            </div>

            <!-- Jam Mengajar -->
            <div>
              <label class="block text-sm font-medium mb-1">
                <Icon icon="lucide:clock" class="w-4 h-4 inline mr-1" />
                Jam Mengajar (per minggu)
              </label>
              <input
                v-model.number="formData.teachingHours"
                type="number"
                min="0"
                placeholder="Contoh: 24"
                class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <p class="text-xs text-slate-500 mt-1">
                Jumlah jam mengajar per minggu untuk perhitungan tunjangan jam
                mengajar.
              </p>
            </div>

            <!-- Divider -->
            <div class="border-t border-slate-200 pt-4 mt-4">
              <h4
                class="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"
              >
                <Icon icon="lucide:landmark" class="w-4 h-4" />
                Informasi Rekening Bank
              </h4>
            </div>

            <!-- Nama Bank -->
            <div>
              <label class="block text-sm font-medium mb-1"> Nama Bank </label>
              <select
                v-model="formData.bankName"
                class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">-- Pilih Bank --</option>
                <optgroup label="Bank BUMN">
                  <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                  <option value="BNI">BNI (Bank Negara Indonesia)</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BTN">BTN (Bank Tabungan Negara)</option>
                </optgroup>
                <optgroup label="Bank Syariah">
                  <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                  <option value="Bank Muamalat">Bank Muamalat</option>
                  <option value="BCA Syariah">BCA Syariah</option>
                  <option value="BNI Syariah">BNI Syariah</option>
                  <option value="BRI Syariah">BRI Syariah</option>
                  <option value="Mandiri Syariah">Mandiri Syariah</option>
                  <option value="BTPN Syariah">BTPN Syariah</option>
                </optgroup>
                <optgroup label="Bank Swasta">
                  <option value="BCA">BCA (Bank Central Asia)</option>
                  <option value="CIMB Niaga">CIMB Niaga</option>
                  <option value="Danamon">Bank Danamon</option>
                  <option value="Permata">Bank Permata</option>
                  <option value="OCBC NISP">OCBC NISP</option>
                  <option value="Panin">Bank Panin</option>
                  <option value="Maybank">Maybank Indonesia</option>
                  <option value="UOB">UOB Indonesia</option>
                  <option value="HSBC">HSBC Indonesia</option>
                  <option value="Mega">Bank Mega</option>
                  <option value="Bukopin">Bank Bukopin</option>
                  <option value="Sinarmas">Bank Sinarmas</option>
                  <option value="BTPN">BTPN</option>
                  <option value="Jenius">Jenius (BTPN)</option>
                </optgroup>
                <optgroup label="Bank Digital">
                  <option value="Jago">Bank Jago</option>
                  <option value="Sea Bank">Sea Bank</option>
                  <option value="Blu BCA">Blu by BCA Digital</option>
                  <option value="Line Bank">Line Bank</option>
                  <option value="Allo Bank">Allo Bank</option>
                  <option value="Neo Commerce">Bank Neo Commerce</option>
                </optgroup>
                <optgroup label="Bank Daerah">
                  <option value="Bank Jateng">Bank Jateng</option>
                  <option value="Bank Jatim">Bank Jatim</option>
                  <option value="Bank DKI">Bank DKI</option>
                  <option value="Bank BJB">Bank BJB (Jabar Banten)</option>
                  <option value="Bank Nagari">Bank Nagari</option>
                  <option value="Bank Sumut">Bank Sumut</option>
                  <option value="Bank Papua">Bank Papua</option>
                  <option value="Bank Kalsel">Bank Kalsel</option>
                  <option value="Bank NTB">Bank NTB Syariah</option>
                  <option value="Bank Aceh">Bank Aceh Syariah</option>
                  <option value="Bank Lampung">Bank Lampung</option>
                  <option value="Bank Banten">Bank Banten</option>
                </optgroup>
                <option value="Lainnya">Lainnya</option>
              </select>
              <!-- Custom bank name input when "Lainnya" is selected -->
              <input
                v-if="formData.bankName === 'Lainnya'"
                v-model="formData.customBankName"
                type="text"
                placeholder="Ketik nama bank..."
                class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 mt-2"
              />
            </div>

            <!-- Kode Bank -->
            <div>
              <label class="block text-sm font-medium mb-1"> Kode Bank </label>
              <input
                v-model="formData.bankCode"
                type="text"
                :placeholder="
                  formData.bankName === 'Lainnya'
                    ? 'Masukkan kode bank...'
                    : 'Otomatis terisi'
                "
                :disabled="
                  formData.bankName !== 'Lainnya' && formData.bankName !== ''
                "
                class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100 disabled:text-slate-600"
              />
              <p class="text-xs text-slate-500 mt-1">
                Kode bank akan terisi otomatis jika memilih dari daftar.
              </p>
            </div>

            <!-- Nomor Rekening -->
            <div>
              <label class="block text-sm font-medium mb-1">
                Nomor Rekening
              </label>
              <input
                v-model="formData.bankAccountNumber"
                type="text"
                placeholder="Contoh: 1234567890"
                class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <!-- Nama pada Rekening -->
            <div>
              <label class="block text-sm font-medium mb-1">
                Nama pada Rekening
              </label>
              <div class="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="useTeacherName"
                  :checked="
                    formData.bankAccountName === selectedTeacher?.fullName
                  "
                  @change="toggleAccountName"
                  class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label for="useTeacherName" class="text-sm text-slate-600">
                  Sama dengan nama di data ({{ selectedTeacher?.fullName }})
                </label>
              </div>
              <input
                v-model="formData.bankAccountName"
                type="text"
                placeholder="Nama sesuai rekening bank"
                :disabled="
                  formData.bankAccountName === selectedTeacher?.fullName
                "
                class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100 disabled:text-slate-500"
              />
              <p class="text-xs text-slate-500 mt-1">
                Jika nama di rekening berbeda dengan nama pegawai, silakan input
                manual.
              </p>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-8">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="saving"
            >
              <span v-if="saving">Menyimpan...</span>
              <span v-else>Simpan</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <StatusModal
      :is-open="statusModal.open"
      :type="statusModal.type"
      :title="statusModal.title"
      :message="statusModal.message"
      @close="statusModal.open = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from "vue";
import { Icon } from "@iconify/vue";
import {
  teachersApi,
  salaryGradesApi,
  divisionsApi,
  salaryApi,
} from "@/services/api";
import StatusModal from "@/components/ui/StatusModal.vue";

const loading = ref(true);
const teachers = ref([]);
const grades = ref([]);
const positions = ref([]); // Position allowances
const divisions = ref([]);
const searchQuery = ref("");
const viewMode = ref("table");

// Bank codes mapping
const bankCodes = {
  BRI: "002",
  BNI: "009",
  Mandiri: "008",
  BTN: "200",
  BSI: "451",
  "Bank Muamalat": "147",
  "BCA Syariah": "536",
  "BNI Syariah": "427",
  "BRI Syariah": "422",
  "Mandiri Syariah": "451",
  "BTPN Syariah": "547",
  BCA: "014",
  "CIMB Niaga": "022",
  Danamon: "011",
  Permata: "013",
  "OCBC NISP": "028",
  Panin: "019",
  Maybank: "016",
  UOB: "023",
  HSBC: "041",
  Mega: "426",
  Bukopin: "441",
  Sinarmas: "153",
  BTPN: "213",
  Jenius: "213",
  Jago: "542",
  "Sea Bank": "535",
  "Blu BCA": "501",
  "Line Bank": "484",
  "Allo Bank": "567",
  "Neo Commerce": "490",
  "Bank Jateng": "113",
  "Bank Jatim": "114",
  "Bank DKI": "111",
  "Bank BJB": "110",
  "Bank Nagari": "118",
  "Bank Sumut": "117",
  "Bank Papua": "132",
  "Bank Kalsel": "122",
  "Bank NTB": "128",
  "Bank Aceh": "116",
  "Bank Lampung": "121",
  "Bank Banten": "137",
};

const filters = reactive({
  divisionId: "",
  gradeId: "",
  gender: "",
});

const modalOpen = ref(false);
const selectedTeacher = ref(null);
const saving = ref(false);

const formData = reactive({
  salaryGradeId: null,
  positionAllowanceId: null,
  joinDate: "",
  teachingHours: 0,
  bankName: "",
  bankCode: "",
  customBankName: "",
  bankAccountNumber: "",
  bankAccountName: "",
});

const statusModal = reactive({
  open: false,
  type: "success",
  title: "",
  message: "",
});

const filteredTeachers = computed(() => {
  let result = teachers.value;

  // 1. Search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (t) =>
        t.fullName.toLowerCase().includes(q) || (t.nip && t.nip.includes(q))
    );
  }

  // 2. Filter by Division
  if (filters.divisionId) {
    const divId = parseInt(filters.divisionId);
    result = result.filter((t) => {
      if (t.divisions && t.divisions.some((d) => d.id === divId)) return true;
      if (t.divisionId === divId) return true;
      return false;
    });
  }

  // 3. Filter by Grade
  if (filters.gradeId) {
    if (filters.gradeId === "null") {
      result = result.filter((t) => !t.salaryGradeId);
    } else {
      const gId = parseInt(filters.gradeId);
      result = result.filter((t) => t.salaryGradeId === gId);
    }
  }

  // 4. Filter by Gender
  if (filters.gender) {
    result = result.filter((t) => t.gender === filters.gender);
  }

  return result;
});

function calculateYearsService(joinDate) {
  if (!joinDate) return 0;
  const join = new Date(joinDate);
  const now = new Date();
  const years = now.getFullYear() - join.getFullYear();
  const monthDiff = now.getMonth() - join.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < join.getDate())) {
    return years - 1;
  }
  return years;
}

function formatCurrency(val) {
  if (!val) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
}

async function loadData() {
  loading.value = true;
  try {
    const [resTeachers, resGrades, resDivisions, resSettings] =
      await Promise.all([
        teachersApi.getAll(),
        salaryGradesApi.getAll(),
        divisionsApi.getAll(),
        salaryApi.getSettings(),
      ]);

    if (resTeachers.success) {
      teachers.value = resTeachers.data;
    }
    if (resGrades.success) {
      grades.value = resGrades.data;
    }
    if (resDivisions.success) {
      divisions.value = resDivisions.data;
    }
    if (resSettings.success) {
      positions.value = resSettings.data.positions || [];
    }
  } catch (err) {
    console.error(err);
    showStatus("error", "Error", "Gagal memuat data.");
  } finally {
    loading.value = false;
  }
}

function openAssignModal(teacher) {
  selectedTeacher.value = teacher;
  formData.salaryGradeId = teacher.salaryGradeId || null;
  formData.positionAllowanceId = teacher.positionAllowanceId || null;
  formData.joinDate = teacher.joinDate ? teacher.joinDate.split("T")[0] : "";
  formData.teachingHours = teacher.teachingHours || 0;

  // Check if bank name is a known bank or custom
  const knownBanks = [
    "BRI",
    "BNI",
    "Mandiri",
    "BTN",
    "BSI",
    "Bank Muamalat",
    "BCA Syariah",
    "BNI Syariah",
    "BRI Syariah",
    "Mandiri Syariah",
    "BTPN Syariah",
    "BCA",
    "CIMB Niaga",
    "Danamon",
    "Permata",
    "OCBC NISP",
    "Panin",
    "Maybank",
    "UOB",
    "HSBC",
    "Mega",
    "Bukopin",
    "Sinarmas",
    "BTPN",
    "Jenius",
    "Jago",
    "Sea Bank",
    "Blu BCA",
    "Line Bank",
    "Allo Bank",
    "Neo Commerce",
    "Bank Jateng",
    "Bank Jatim",
    "Bank DKI",
    "Bank BJB",
    "Bank Nagari",
    "Bank Sumut",
    "Bank Papua",
    "Bank Kalsel",
    "Bank NTB",
    "Bank Aceh",
    "Bank Lampung",
    "Bank Banten",
  ];

  if (teacher.bankName && !knownBanks.includes(teacher.bankName)) {
    formData.bankName = "Lainnya";
    formData.customBankName = teacher.bankName;
    formData.bankCode = teacher.bankCode || "";
  } else {
    formData.bankName = teacher.bankName || "";
    formData.customBankName = "";
    formData.bankCode = teacher.bankCode || bankCodes[teacher.bankName] || "";
  }

  formData.bankAccountNumber = teacher.bankAccountNumber || "";
  formData.bankAccountName = teacher.bankAccountName || teacher.fullName || "";
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  selectedTeacher.value = null;
  formData.salaryGradeId = null;
  formData.positionAllowanceId = null;
  formData.joinDate = "";
  formData.teachingHours = 0;
  formData.bankName = "";
  formData.bankCode = "";
  formData.customBankName = "";
  formData.bankAccountNumber = "";
  formData.bankAccountName = "";
}

function toggleAccountName(event) {
  if (event.target.checked) {
    formData.bankAccountName = selectedTeacher.value?.fullName || "";
  } else {
    formData.bankAccountName = "";
  }
}

// Watch for bank name changes to auto-fill bank code
watch(
  () => formData.bankName,
  (newBankName) => {
    if (newBankName && newBankName !== "Lainnya" && bankCodes[newBankName]) {
      formData.bankCode = bankCodes[newBankName];
    } else if (newBankName === "Lainnya") {
      formData.bankCode = "";
    }
  }
);

async function saveAssignment() {
  if (!selectedTeacher.value) return;

  saving.value = true;
  try {
    // Use customBankName if "Lainnya" is selected
    const actualBankName =
      formData.bankName === "Lainnya"
        ? formData.customBankName
        : formData.bankName;

    const updateData = {
      salaryGradeId: formData.salaryGradeId,
      positionAllowanceId: formData.positionAllowanceId,
      teachingHours: formData.teachingHours,
      bankName: actualBankName || null,
      bankCode: formData.bankCode || null,
      bankAccountNumber: formData.bankAccountNumber || null,
      bankAccountName: formData.bankAccountName || null,
    };

    if (formData.joinDate) {
      updateData.joinDate = formData.joinDate;
    }

    await teachersApi.update(selectedTeacher.value.id, updateData);

    // Update local data
    const teacherIndex = teachers.value.findIndex(
      (t) => t.id === selectedTeacher.value.id
    );
    if (teacherIndex !== -1) {
      const grade = grades.value.find((g) => g.id === formData.salaryGradeId);
      const position = positions.value.find(
        (p) => p.id === formData.positionAllowanceId
      );

      teachers.value[teacherIndex].salaryGradeId = formData.salaryGradeId;
      teachers.value[teacherIndex].salaryGrade = grade || null;
      teachers.value[teacherIndex].positionAllowanceId =
        formData.positionAllowanceId;
      teachers.value[teacherIndex].positionAllowance = position || null;
      teachers.value[teacherIndex].joinDate = formData.joinDate;
      teachers.value[teacherIndex].teachingHours = formData.teachingHours;
      teachers.value[teacherIndex].bankName = actualBankName;
      teachers.value[teacherIndex].bankCode = formData.bankCode;
      teachers.value[teacherIndex].bankAccountNumber =
        formData.bankAccountNumber;
      teachers.value[teacherIndex].bankAccountName = formData.bankAccountName;
    }

    closeModal();
    showStatus(
      "success",
      "Berhasil",
      "Komponen gaji guru berhasil diperbarui."
    );
  } catch (err) {
    console.error(err);
    showStatus("error", "Gagal", "Gagal memperbarui komponen gaji guru.");
  } finally {
    saving.value = false;
  }
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function showStatus(type, title, message) {
  statusModal.type = type;
  statusModal.title = title;
  statusModal.message = message;
  statusModal.open = true;
}

onMounted(() => {
  loadData();
});
</script>
