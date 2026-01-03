<template>
  <div class="p-2 max-w-4xl mx-auto pb-12">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Pengaturan Akademik</h1>
      <p class="text-slate-500 text-sm mt-1">
        Kelola tahun pelajaran dan semester aktif
      </p>
    </div>

    <!-- Academic Year Section -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
      <h2
        class="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"
      >
        <Icon icon="solar:calendar-bold" class="text-[#602515]" />
        Tahun Pelajaran
      </h2>

      <!-- Add New Year -->
      <div class="mb-4">
        <p v-if="yearError" class="text-xs text-red-500 mb-2">
          {{ yearError }}
        </p>
        <div class="flex flex-col sm:flex-row gap-2">
          <input
            v-model="newYear"
            type="text"
            placeholder="2025-2026"
            class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#602515]/30 focus:border-[#602515]"
            :class="yearError ? 'border-red-400' : 'border-slate-300'"
            @keyup.enter="addYear"
            @input="validateYearInput"
          />
          <button
            @click="addYear"
            :disabled="!newYear || loading || !!yearError"
            class="w-full sm:w-auto px-4 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1c10] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Icon icon="solar:add-circle-bold" />
            Tambah
          </button>
        </div>
        <p class="text-xs text-slate-500 mt-1">
          Format: YYYY-YYYY (contoh: 2025-2026)
        </p>
      </div>

      <!-- Year List -->
      <div v-if="years.length" class="space-y-2">
        <div
          v-for="y in years"
          :key="y.year"
          class="flex items-center justify-between p-3 rounded-lg border transition-colors"
          :class="
            y.isActive
              ? 'bg-[#602515]/5 border-[#602515]/30'
              : 'bg-slate-50 border-slate-200'
          "
        >
          <span class="font-medium text-slate-800">{{ y.year }}</span>
          <div class="flex items-center gap-2">
            <span
              v-if="y.isActive"
              class="px-2 py-0.5 text-xs font-medium bg-[#602515] text-white rounded-full"
            >
              Aktif
            </span>
            <button
              v-if="!y.isActive"
              @click="setActiveYear(y.year)"
              class="px-3 py-1.5 text-sm bg-[#602515]/10 text-[#602515] rounded-lg hover:bg-[#602515]/20"
            >
              Set Aktif
            </button>
            <button
              @click="deleteYear(y.year)"
              class="p-1.5 text-red-500 hover:bg-red-100 rounded-lg"
              title="Hapus"
            >
              <Icon icon="solar:trash-bin-trash-bold" />
            </button>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-8 text-slate-400">
        Belum ada tahun pelajaran. Tambahkan tahun pertama.
      </div>
    </div>

    <!-- Semester Section -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h2
        class="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"
      >
        <Icon icon="solar:calendar-date-bold" class="text-[#602515]" />
        Semester Aktif
      </h2>

      <div class="grid grid-cols-2 gap-4">
        <button
          v-for="s in semesters"
          :key="s.id"
          @click="setActiveSemester(s.id)"
          class="p-4 rounded-xl border-2 transition-colors text-center"
          :class="
            s.isActive
              ? 'bg-[#602515]/5 border-[#602515] text-[#602515]'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-[#602515]/50'
          "
        >
          <div class="text-lg font-semibold">{{ s.name }}</div>
          <div v-if="s.isActive" class="text-xs mt-1 text-[#602515]">
            <Icon icon="solar:check-circle-bold" class="inline" />
            Semester Aktif
          </div>
        </button>
      </div>
    </div>

    <!-- Grading Rules Section (Restored) -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
      <div
        class="mb-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
      >
        <h2
          class="text-lg font-semibold text-slate-800 flex items-center gap-2"
        >
          <Icon icon="solar:diploma-verified-bold" class="text-[#602515]" />
          Aturan Penilaian & Predikat (Legacy)
        </h2>

        <!-- Mode Toggle -->
        <div class="flex bg-slate-100 p-1 rounded-lg">
          <button
            @click="gradingRules.mode = 'SPECIFIC'"
            class="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
            :class="
              gradingRules.mode === 'SPECIFIC'
                ? 'bg-white text-[#602515] shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            "
          >
            Per KKM (Spesifik)
          </button>
          <button
            @click="gradingRules.mode = 'GLOBAL'"
            class="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
            :class="
              gradingRules.mode === 'GLOBAL'
                ? 'bg-white text-[#602515] shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            "
          >
            Samakan Semua (Global)
          </button>
        </div>
      </div>

      <!-- Specific Mode: List of KKM Configs -->
      <div v-if="gradingRules.mode === 'SPECIFIC'" class="space-y-6">
        <div
          v-if="gradingRules.specificRules && gradingRules.specificRules.length"
        >
          <div
            v-for="(config, kkmIndex) in gradingRules.specificRules"
            :key="kkmIndex"
            class="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-medium text-slate-800 flex items-center gap-2">
                <span
                  class="bg-[#602515] text-white px-2 py-0.5 rounded text-sm"
                  >KKM {{ config.kkm }}</span
                >
                <span class="text-sm text-slate-500"
                  >(Digunakan untuk mapel dengan KKM {{ config.kkm }})</span
                >
              </h3>
              <button
                @click="removeKkmConfig(kkmIndex)"
                class="text-red-500 hover:text-red-700 text-sm"
              >
                Hapus Aturan
              </button>
            </div>

            <!-- Rules Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="text-xs text-slate-500 uppercase bg-slate-100">
                  <tr>
                    <th class="px-3 py-2">Predikat</th>
                    <th class="px-3 py-2">Predikat (Arab)</th>
                    <th class="px-3 py-2">Min</th>
                    <th class="px-3 py-2">Max</th>
                    <th class="px-3 py-2">Keterangan (ID)</th>
                    <th class="px-3 py-2">Keterangan (AR)</th>
                    <th class="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(rule, rIndex) in config.rules"
                    :key="rIndex"
                    class="bg-white border-b hover:bg-slate-50"
                  >
                    <td class="px-3 py-2">
                      <input
                        v-model="rule.predicate"
                        type="text"
                        class="w-16 px-2 py-1 border rounded text-center font-bold"
                      />
                    </td>
                    <td class="px-3 py-2">
                      <input
                        v-model="rule.predicateAr"
                        type="text"
                        dir="rtl"
                        class="w-16 px-2 py-1 border rounded text-center font-akkurat-arabic"
                      />
                    </td>
                    <td class="px-3 py-2">
                      <input
                        v-model.number="rule.min"
                        type="number"
                        class="w-16 px-2 py-1 border rounded text-center"
                      />
                    </td>
                    <td class="px-3 py-2">
                      <input
                        v-model.number="rule.max"
                        type="number"
                        class="w-16 px-2 py-1 border rounded text-center"
                      />
                    </td>
                    <td class="px-3 py-2">
                      <input
                        v-model="rule.descriptionId"
                        type="text"
                        class="w-full px-2 py-1 border rounded"
                        placeholder="Sangat Baik"
                      />
                    </td>
                    <td class="px-3 py-2">
                      <input
                        v-model="rule.descriptionAr"
                        type="text"
                        class="w-full px-2 py-1 border rounded text-right font-akkurat-arabic"
                        placeholder="ممتاز"
                      />
                    </td>
                    <td class="px-3 py-2 text-center">
                      <button
                        @click="removeRuleRow(config.rules, rIndex)"
                        class="text-red-500 hover:text-red-700"
                        title="Hapus baris"
                      >
                        <Icon
                          icon="solar:trash-bin-trash-bold"
                          class="w-4 h-4"
                        />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="mt-2 text-center">
                <button
                  @click="addRuleRow(config.rules)"
                  class="text-[#602515] hover:underline text-sm flex items-center justify-center gap-1 mx-auto"
                >
                  <Icon icon="solar:add-circle-bold" />
                  Tambah Baris Aturan
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-6 text-slate-400 italic">
          Belum ada aturan penilaian spesifik. Tambahkan KKM.
        </div>
      </div>

      <!-- Actions for Specific Mode (Add KKM) -->
      <div
        v-if="gradingRules.mode === 'SPECIFIC'"
        class="mt-4 flex flex-wrap gap-3"
      >
        <div class="flex items-center gap-2">
          <input
            v-model.number="newKkmValue"
            type="number"
            class="w-20 px-3 py-2 border rounded-lg"
            placeholder="KKM"
          />
          <button
            @click="addKkmConfig"
            :disabled="!newKkmValue"
            class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            + Tambah Aturan KKM
          </button>
        </div>
      </div>

      <!-- Global Mode: Single Table -->
      <div v-if="gradingRules.mode === 'GLOBAL'" class="space-y-6">
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h3 class="font-medium text-slate-800 mb-4">
            Aturan Global (Berlaku untuk semua mapel)
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="text-xs text-slate-500 uppercase bg-slate-100">
                <tr>
                  <th class="px-3 py-2">Predikat</th>
                  <th class="px-3 py-2">Predikat (Arab)</th>
                  <th class="px-3 py-2">Min</th>
                  <th class="px-3 py-2">Max</th>
                  <th class="px-3 py-2">Keterangan (ID)</th>
                  <th class="px-3 py-2">Keterangan (AR)</th>
                  <th class="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(rule, rIndex) in gradingRules.globalRules"
                  :key="rIndex"
                  class="bg-white border-b hover:bg-slate-50"
                >
                  <td class="px-3 py-2">
                    <input
                      v-model="rule.predicate"
                      type="text"
                      class="w-16 px-2 py-1 border rounded text-center font-bold"
                    />
                  </td>
                  <td class="px-3 py-2">
                    <input
                      v-model="rule.predicateAr"
                      type="text"
                      dir="rtl"
                      class="w-16 px-2 py-1 border rounded text-center font-akkurat-arabic"
                    />
                  </td>
                  <td class="px-3 py-2">
                    <input
                      v-model.number="rule.min"
                      type="number"
                      class="w-16 px-2 py-1 border rounded text-center"
                    />
                  </td>
                  <td class="px-3 py-2">
                    <input
                      v-model.number="rule.max"
                      type="number"
                      class="w-16 px-2 py-1 border rounded text-center"
                    />
                  </td>
                  <td class="px-3 py-2">
                    <input
                      v-model="rule.descriptionId"
                      type="text"
                      class="w-full px-2 py-1 border rounded"
                      placeholder="Sangat Baik"
                    />
                  </td>
                  <td class="px-3 py-2">
                    <input
                      v-model="rule.descriptionAr"
                      type="text"
                      class="w-full px-2 py-1 border rounded text-right font-akkurat-arabic"
                      placeholder="ممتاز"
                    />
                  </td>
                  <td class="px-3 py-2 text-center">
                    <button
                      @click="removeRuleRow(gradingRules.globalRules, rIndex)"
                      class="text-red-500 hover:text-red-700"
                      title="Hapus baris"
                    >
                      <Icon icon="solar:trash-bin-trash-bold" class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="mt-2 text-center">
              <button
                @click="addRuleRow(gradingRules.globalRules)"
                class="text-[#602515] hover:underline text-sm flex items-center justify-center gap-1 mx-auto"
              >
                <Icon icon="solar:add-circle-bold" />
                Tambah Baris Aturan
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- General Save Button -->
      <div class="flex justify-end mt-4">
        <button
          @click="saveGradingRules"
          :disabled="savingRules"
          class="px-6 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1c10] flex items-center gap-2 disabled:opacity-50"
        >
          <Icon v-if="savingRules" icon="svg-spinners:ring-resize" />
          <Icon v-else icon="solar:diskette-bold" />
          Simpan Perubahan
        </button>
      </div>
    </div>

    <!-- Predicate Settings (New Table-Based) -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
      <div
        class="mb-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
      >
        <h2
          class="text-lg font-semibold text-slate-800 flex items-center gap-2"
        >
          <Icon icon="solar:diploma-verified-bold" class="text-[#602515]" />
          Aturan Predikat Nilai
        </h2>
        <button
          @click="openPredicateModal()"
          class="px-4 py-2 bg-[#602515] text-white text-sm rounded-lg hover:bg-[#4a1c10] flex items-center gap-2"
        >
          <Icon icon="solar:add-circle-bold" />
          Tambah Predikat
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-slate-500 uppercase bg-slate-100">
            <tr>
              <th class="px-3 py-2">Grade</th>
              <th class="px-3 py-2">Min</th>
              <th class="px-3 py-2">Max</th>
              <th class="px-3 py-2">Keterangan</th>
              <th class="px-3 py-2">Keterangan (Arab)</th>
              <th class="px-3 py-2 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in predicates"
              :key="p.id"
              class="bg-white border-b hover:bg-slate-50"
            >
              <td class="px-3 py-2 font-bold">{{ p.grade }}</td>
              <td class="px-3 py-2">{{ p.minScore }}</td>
              <td class="px-3 py-2">{{ p.maxScore }}</td>
              <td class="px-3 py-2">{{ p.description }}</td>
              <td class="px-3 py-2 font-akkurat-arabic text-right">
                {{ p.descriptionAr }}
              </td>
              <td class="px-3 py-2 text-center">
                <button
                  @click="openPredicateModal(p)"
                  class="text-blue-600 hover:text-blue-800 mr-2"
                  title="Edit"
                >
                  <Icon icon="solar:pen-bold" />
                </button>
                <button
                  @click="deletePredicate(p.id)"
                  class="text-red-500 hover:text-red-700"
                  title="Hapus"
                >
                  <Icon icon="solar:trash-bin-trash-bold" />
                </button>
              </td>
            </tr>
            <tr v-if="predicates.length === 0">
              <td colspan="6" class="px-3 py-4 text-center text-slate-500">
                Belum ada data predikat.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Current Active Display -->
    <div class="mt-6 p-4 bg-[#602515]/5 border border-[#602515]/20 rounded-xl">
      <div class="text-sm text-[#602515] font-medium mb-1">
        Setting Aktif Saat Ini:
      </div>
      <div class="text-lg font-bold text-[#602515]">
        {{ activeYear }} - Semester {{ activeSemesterName }}
      </div>
    </div>

    <!-- Report Dates (Titi Mangsa) -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mt-6">
      <h2
        class="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"
      >
        <Icon icon="solar:calendar-mark-bold" class="text-[#602515]" />
        Titi Mangsa Rapor
      </h2>

      <!-- Form -->
      <div class="bg-[#602515]/5 p-4 rounded-lg mb-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Year -->
          <div class="md:col-span-1">
            <label class="block text-xs font-medium text-slate-600 mb-1"
              >Tahun Pelajaran</label
            >
            <select
              v-model="newReportDate.academicYear"
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#602515]/30 focus:border-[#602515]"
            >
              <option v-for="y in years" :key="y.year" :value="y.year">
                {{ y.year }}
              </option>
            </select>
          </div>

          <!-- Semester -->
          <div class="md:col-span-1">
            <label class="block text-xs font-medium text-slate-600 mb-1"
              >Semester</label
            >
            <select
              v-model="newReportDate.semester"
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#602515]/30 focus:border-[#602515]"
            >
              <option :value="1">Ganjil (1)</option>
              <option :value="2">Genap (2)</option>
            </select>
          </div>

          <!-- Date -->
          <div class="md:col-span-1">
            <label class="block text-xs font-medium text-slate-600 mb-1"
              >Tanggal Rapor</label
            >
            <input
              v-model="newReportDate.reportDate"
              type="date"
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#602515]/30 focus:border-[#602515]"
            />
          </div>

          <!-- Action -->
          <div class="md:col-span-1 flex items-end">
            <button
              @click="saveReportDate"
              :disabled="loading || !newReportDate.reportDate"
              class="w-full px-4 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1c10] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Icon icon="solar:diskette-bold" />
              Simpan
            </button>
          </div>
        </div>
      </div>

      <!-- List -->
      <div v-if="reportDates.length" class="space-y-2">
        <div
          v-for="rd in reportDates"
          :key="rd.id"
          class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
        >
          <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
            <div class="flex items-center gap-2">
              <span class="font-medium text-slate-800">{{
                rd.academicYear
              }}</span>
              <span
                class="px-2 py-0.5 text-xs font-medium rounded-full"
                :class="
                  rd.semester === 1
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-orange-100 text-orange-700'
                "
              >
                Sem {{ rd.semester }}
              </span>
            </div>
            <div class="flex items-center gap-2 text-slate-600">
              <Icon icon="solar:calendar-line-duotone" class="text-sm" />
              <span>{{ formatDate(rd.reportDate) }}</span>
            </div>
          </div>
          <button
            @click="deleteReportDate(rd.id)"
            class="p-1.5 text-red-500 hover:bg-red-100 rounded-lg"
            title="Hapus"
          >
            <Icon icon="solar:trash-bin-trash-bold" />
          </button>
        </div>
      </div>
      <div v-else class="text-center py-6 text-slate-400">
        Belum ada data titi mangsa rapor.
      </div>
    </div>

    <!-- Report Header Section -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mt-6">
      <h2
        class="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"
      >
        <Icon icon="solar:document-text-bold" class="text-[#602515]" />
        Kop & TTD Rapor Akademik
      </h2>

      <p class="text-sm text-slate-500 mb-6">
        Upload gambar kop surat yang akan digunakan sebagai header rapor
        akademik.
      </p>

      <!-- Upload Zone -->
      <div
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        :class="[
          'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer',
          isDragging
            ? 'border-[#602515] bg-[#602515]/5 scale-[1.01]'
            : 'border-slate-300 hover:border-[#602515]/50 hover:bg-slate-50',
        ]"
        @click="triggerFileInput"
      >
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileSelect"
        />

        <!-- Upload Progress -->
        <div v-if="uploadingHeader" class="flex flex-col items-center gap-4">
          <div
            class="w-16 h-16 rounded-full border-4 border-[#602515]/20 border-t-[#602515] animate-spin"
          ></div>
          <span class="text-slate-600 font-medium">Mengupload gambar...</span>
        </div>

        <!-- Preview (if image exists) -->
        <div v-else-if="headerForm.institutionLogo" class="space-y-4">
          <img
            :src="getImageUrl(headerForm.institutionLogo)"
            alt="Kop Surat Preview"
            class="max-h-48 mx-auto rounded-lg shadow-lg border border-slate-200"
          />
          <div class="flex items-center justify-center gap-3">
            <button
              @click.stop="triggerFileInput"
              class="px-4 py-2 text-sm font-medium text-[#602515] border border-[#602515] rounded-lg hover:bg-[#602515]/5 flex items-center gap-2"
            >
              <Icon icon="solar:gallery-edit-bold" />
              Ganti Gambar
            </button>
            <button
              @click.stop="removeHeader"
              class="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 flex items-center gap-2"
            >
              <Icon icon="solar:trash-bin-trash-bold" />
              Hapus
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="space-y-4">
          <div
            class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#602515]/10 to-[#602515]/5 flex items-center justify-center"
          >
            <Icon
              icon="solar:cloud-upload-bold-duotone"
              class="w-10 h-10 text-[#602515]"
            />
          </div>
          <div>
            <p class="text-slate-700 font-medium">
              Drag & drop gambar kop surat di sini
            </p>
            <p class="text-slate-500 text-sm mt-1">
              atau klik untuk memilih file (PNG, JPG, max 5MB)
            </p>
          </div>
        </div>
      </div>

      <!-- Signature Names Section -->
      <div class="mt-6 border-t pt-6">
        <h4 class="font-bold text-slate-800 mb-4">Nama Penandatangan</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Nama Kepala Sekolah
            </label>
            <input
              v-model="headerForm.principalName"
              type="text"
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
              placeholder="Nama lengkap + Gelar"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Kota
            </label>
            <input
              v-model="headerForm.cityName"
              type="text"
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
              placeholder="Purwakarta"
            />
          </div>
        </div>

        <!-- Save Button -->
        <div class="mt-6 flex justify-end">
          <button
            @click="saveHeaderSettings"
            :disabled="savingHeader"
            class="px-6 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1c10] disabled:opacity-50 flex items-center gap-2"
          >
            <Icon
              v-if="savingHeader"
              icon="solar:spinner-bold"
              class="animate-spin"
            />
            <Icon v-else icon="solar:diskette-bold-duotone" />
            {{ savingHeader ? "Menyimpan..." : "Simpan Pengaturan" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Modal -->
    <ConfirmModal
      :isOpen="showConfirmModal"
      title="Hapus Tahun Pelajaran"
      confirmText="Ya, Hapus"
      cancelText="Batal"
      :loading="deleteLoading"
      @confirm="onConfirmDelete"
      @cancel="showConfirmModal = false"
    >
      Apakah Anda yakin ingin menghapus tahun pelajaran
      <strong>{{ yearToDelete }}</strong
      >?
    </ConfirmModal>

    <!-- Status Modal -->
    <StatusModal
      :isOpen="showStatusModal"
      :title="statusTitle"
      :message="statusMessage"
      :type="statusType"
      @close="showStatusModal = false"
    />

    <!-- Predicate Modal -->
    <div
      v-if="showPredicateModal"
      class="fixed inset-0 z-[1000] flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/50"
        @click="showPredicateModal = false"
      ></div>
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-bold mb-4">
          {{ editingPredicate ? "Edit" : "Tambah" }} Predikat
        </h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Grade</label>
            <input
              v-model="predicateForm.grade"
              type="text"
              placeholder="A, B, C..."
              class="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Min Score</label>
              <input
                v-model.number="predicateForm.minScore"
                type="number"
                step="0.01"
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Max Score</label>
              <input
                v-model.number="predicateForm.maxScore"
                type="number"
                step="0.01"
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Keterangan</label>
            <input
              v-model="predicateForm.description"
              type="text"
              placeholder="Sangat Baik"
              class="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1"
              >Keterangan (Arab)</label
            >
            <input
              v-model="predicateForm.descriptionAr"
              type="text"
              dir="rtl"
              placeholder="ممتاز"
              class="w-full px-3 py-2 border rounded-lg font-akkurat-arabic text-right"
            />
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <button
            @click="showPredicateModal = false"
            class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Batal
          </button>
          <button
            @click="savePredicate"
            :disabled="savingPredicate"
            class="px-4 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1c10] disabled:opacity-50"
          >
            {{ savingPredicate ? "Menyimpan..." : "Simpan" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { academicSettingsApi, uploadsApi } from "@/services/api";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import StatusModal from "@/components/ui/StatusModal.vue";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const loading = ref(false);
const years = ref([]);
const semesters = ref([]);
const newYear = ref("");
const yearError = ref("");
const activeYear = ref("");
const activeSemester = ref("");

// Grading Rules State
// Grading Rules State
const gradingRules = ref({
  mode: "SPECIFIC",
  globalRules: [],
  specificRules: [],
});
const newKkmValue = ref("");
const savingRules = ref(false);

// Header Settings State
const headerForm = ref({
  institutionLogo: "",
  principalName: "",
  cityName: "Purwakarta",
});
const savingHeader = ref(false);
const uploadingHeader = ref(false);
const isDragging = ref(false);
const fileInput = ref(null);

// Modal states
const showConfirmModal = ref(false);
const yearToDelete = ref("");
const deleteLoading = ref(false);

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

const activeSemesterName = computed(() => {
  const s = semesters.value.find((x) => x.isActive);
  return s?.name || "-";
});

async function loadData() {
  loading.value = true;
  try {
    const [yearsRes, semestersRes, activeRes, rulesRes] = await Promise.all([
      academicSettingsApi.getAcademicYears(),
      academicSettingsApi.getSemesters(),
      academicSettingsApi.getActive(),
      academicSettingsApi.getGradingRules(),
    ]);

    years.value = yearsRes.data || [];
    semesters.value = semestersRes.data || [];
    activeYear.value = activeRes.data?.academicYear || "";
    activeSemester.value = activeRes.data?.semester || "";
    // Load predicates
    await fetchPredicates();
    if (rulesRes.success && rulesRes.data) {
      gradingRules.value = rulesRes.data;
    } else {
      gradingRules.value = {
        mode: "SPECIFIC",
        globalRules: getDefaultRules(),
        specificRules: [],
      };
    }
  } catch (e) {
    console.error("Failed to load academic settings:", e);
  } finally {
    loading.value = false;
  }
}

// Predicates Logic
const predicates = ref([]);
const showPredicateModal = ref(false);
const editingPredicate = ref(null);
const savingPredicate = ref(false);
const predicateForm = ref({
  grade: "",
  minScore: 0,
  maxScore: 100,
  description: "",
  descriptionAr: "",
});

async function fetchPredicates() {
  try {
    const res = await academicSettingsApi.getPredicates();
    predicates.value = res.data || [];
  } catch (e) {
    console.error(e);
  }
}

function openPredicateModal(p = null) {
  editingPredicate.value = p;
  if (p) {
    predicateForm.value = {
      ...p,
      minScore: Number(p.minScore),
      maxScore: Number(p.maxScore),
    };
  } else {
    predicateForm.value = {
      grade: "",
      minScore: 0,
      maxScore: 100,
      description: "",
      descriptionAr: "",
    };
  }
  showPredicateModal.value = true;
}

async function savePredicate() {
  if (!predicateForm.value.grade) return;
  savingPredicate.value = true;
  try {
    if (editingPredicate.value) {
      await academicSettingsApi.updatePredicate(
        editingPredicate.value.id,
        predicateForm.value
      );
      showStatus("Berhasil", "Predikat berhasil diupdate");
    } else {
      await academicSettingsApi.createPredicate(predicateForm.value);
      showStatus("Berhasil", "Predikat berhasil ditambahkan");
    }
    showPredicateModal.value = false;
    await fetchPredicates();
  } catch (e) {
    showStatus("Error", e.message || "Gagal menyimpan", "error");
  } finally {
    savingPredicate.value = false;
  }
}

async function deletePredicate(id) {
  if (!confirm("Hapus predikat ini?")) return;
  try {
    await academicSettingsApi.deletePredicate(id);
    await fetchPredicates();
    showStatus("Berhasil", "Predikat dihapus");
  } catch (e) {
    showStatus("Error", e.message, "error");
  }
}

// Helper for default rules if empty
function getDefaultRules() {
  return [
    {
      min: 91,
      max: 100,
      predicate: "A",
      predicateAr: "أ",
      descriptionId: "Sangat Baik",
      descriptionAr: "ممتاز",
    },
    {
      min: 81,
      max: 90,
      predicate: "B",
      predicateAr: "ب",
      descriptionId: "Baik",
      descriptionAr: "جيد جدا",
    },
    {
      min: 71,
      max: 80,
      predicate: "C",
      predicateAr: "ج",
      descriptionId: "Cukup",
      descriptionAr: "جيد",
    },
    {
      min: 0,
      max: 70,
      predicate: "D",
      predicateAr: "د",
      descriptionId: "Kurang",
      descriptionAr: "مقبول",
    },
  ];
}

async function saveGradingRules() {
  savingRules.value = true;
  try {
    await academicSettingsApi.saveGradingRules(gradingRules.value);
    showStatus("Berhasil", "Aturan penilaian berhasil disimpan");
  } catch (e) {
    showStatus("Error", e.message || "Gagal menyimpan aturan", "error");
  } finally {
    savingRules.value = false;
  }
}

function addKkmConfig() {
  if (!newKkmValue.value) return;
  // Check duplicate
  const exists = gradingRules.value.specificRules?.find(
    (r) => r.kkm === newKkmValue.value
  );
  if (exists) {
    showStatus("Error", "Aturan untuk KKM ini sudah ada", "error");
    return;
  }

  if (!gradingRules.value.specificRules) gradingRules.value.specificRules = [];
  gradingRules.value.specificRules.push({
    kkm: newKkmValue.value,
    rules: getDefaultRules(),
  });
  // Sort by KKM
  gradingRules.value.specificRules.sort((a, b) => b.kkm - a.kkm);
  newKkmValue.value = "";
}

function removeKkmConfig(index) {
  if (!confirm("Hapus aturan KKM ini?")) return;
  gradingRules.value.specificRules.splice(index, 1);
}

function addRuleRow(rulesArray) {
  rulesArray.push({
    min: 0,
    max: 0,
    predicate: "",
    predicateAr: "",
    descriptionId: "",
    descriptionAr: "",
  });
}

function removeRuleRow(rulesArray, index) {
  rulesArray.splice(index, 1);
}

// Header Image Helpers
function getImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE}/api/${path}`;
}

function triggerFileInput() {
  fileInput.value?.click();
}

function handleDrop(e) {
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    processFile(files[0]);
  }
}

function handleFileSelect(e) {
  const files = e.target?.files;
  if (files && files.length > 0) {
    processFile(files[0]);
  }
  if (e.target) e.target.value = "";
}

function processFile(file) {
  if (!file.type.startsWith("image/")) {
    showStatus(
      "File Tidak Valid",
      "Silakan pilih file gambar (PNG, JPG)",
      "error"
    );
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showStatus(
      "File Terlalu Besar",
      "Ukuran maksimal file adalah 5MB",
      "error"
    );
    return;
  }

  uploadFile(file);
}

async function uploadFile(file) {
  uploadingHeader.value = true;
  try {
    const res = await uploadsApi.upload(file);
    if (res.success && res.data?.filePath) {
      headerForm.value.institutionLogo = res.data.filePath;
      await saveHeaderSettings();
      showStatus("Berhasil", "Gambar kop surat berhasil diupload", "success");
    } else {
      throw new Error(res.message || "Upload gagal");
    }
  } catch (e) {
    console.error("Upload error:", e);
    showStatus(
      "Gagal Upload",
      e.message || "Terjadi kesalahan saat mengupload gambar",
      "error"
    );
  } finally {
    uploadingHeader.value = false;
  }
}

async function removeHeader() {
  headerForm.value.institutionLogo = "";
  await saveHeaderSettings();
  showStatus("Berhasil", "Gambar kop surat berhasil dihapus", "success");
}

async function saveHeaderSettings() {
  savingHeader.value = true;
  try {
    await academicSettingsApi.updateReportHeader({
      institutionLogo: headerForm.value.institutionLogo,
      principalName: headerForm.value.principalName,
      cityName: headerForm.value.cityName,
    });
  } catch (e) {
    console.error("Save header error:", e);
    showStatus(
      "Gagal",
      e.message || "Gagal menyimpan pengaturan header",
      "error"
    );
  } finally {
    savingHeader.value = false;
  }
}

async function loadHeaderSettings() {
  try {
    const res = await academicSettingsApi.getReportHeader();
    if (res.success && res.data) {
      headerForm.value = {
        institutionLogo: res.data.institutionLogo || "",
        principalName: res.data.principalName || "",
        cityName: res.data.cityName || "Purwakarta",
      };
    }
  } catch (e) {
    console.error("Failed to load header settings:", e);
  }
}

function validateYearInput() {
  yearError.value = "";
  const input = newYear.value.trim();

  if (!input) return;

  // Check basic format YYYY-YYYY
  if (!/^\d{4}-\d{4}$/.test(input)) {
    yearError.value = "Format harus: YYYY-YYYY (contoh: 2025-2026)";
    return;
  }

  const [year1, year2] = input.split("-").map(Number);

  // Check year2 = year1 + 1
  if (year2 !== year1 + 1) {
    yearError.value = `Tahun kedua harus ${year1 + 1}, bukan ${year2}`;
    return;
  }

  // Check reasonable year range (1990 - 2100)
  if (year1 < 1990 || year1 > 2100) {
    yearError.value = "Tahun harus antara 1990 - 2100";
    return;
  }
}

async function addYear() {
  if (!newYear.value || loading.value) return;

  // Validate before submitting
  validateYearInput();
  if (yearError.value) return;

  loading.value = true;
  try {
    await academicSettingsApi.addAcademicYear(newYear.value);
    newYear.value = "";
    await loadData();
    showStatus("Berhasil", "Tahun pelajaran berhasil ditambahkan", "success");
  } catch (e) {
    showStatus(
      "Gagal",
      e.message || "Gagal menambahkan tahun pelajaran",
      "error"
    );
  } finally {
    loading.value = false;
  }
}

async function deleteYear(year) {
  yearToDelete.value = year;
  showConfirmModal.value = true;
}

async function onConfirmDelete() {
  deleteLoading.value = true;
  try {
    await academicSettingsApi.deleteAcademicYear(yearToDelete.value);
    showConfirmModal.value = false;
    await loadData();
    showStatus("Berhasil", "Tahun pelajaran berhasil dihapus", "success");
  } catch (e) {
    showStatus(
      "Gagal",
      e.message || "Gagal menghapus tahun pelajaran",
      "error"
    );
  } finally {
    deleteLoading.value = false;
  }
}

async function setActiveYear(year) {
  loading.value = true;
  try {
    await academicSettingsApi.setActiveAcademicYear(year);
    await loadData();
    showStatus("Berhasil", "Tahun aktif berhasil diubah", "success");
  } catch (e) {
    showStatus("Gagal", e.message || "Gagal mengubah tahun aktif", "error");
  } finally {
    loading.value = false;
  }
}

async function setActiveSemester(semesterId) {
  loading.value = true;
  try {
    await academicSettingsApi.setActiveSemester(semesterId);
    await loadData();
    showStatus("Berhasil", "Semester aktif berhasil diubah", "success");
  } catch (e) {
    showStatus("Gagal", e.message || "Gagal mengubah semester aktif", "error");
  } finally {
    loading.value = false;
  }
}

const reportDates = ref([]);
const newReportDate = ref({
  academicYear: "",
  semester: 1,
  reportDate: "",
});

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function fetchReportDates() {
  try {
    const res = await academicSettingsApi.getReportDates();
    if (res.success) {
      reportDates.value = res.data;
    }
  } catch (e) {
    console.error("Failed to fetch report dates", e);
  }
}

async function saveReportDate() {
  loading.value = true;
  try {
    const res = await academicSettingsApi.saveReportDate(newReportDate.value);
    if (res.success) {
      showStatus("Berhasil", "Titi mangsa berhasil disimpan", "success");
      await fetchReportDates();
      // Reset form but keep year/sem for convenience
      newReportDate.value.reportDate = "";
    }
  } catch (e) {
    showStatus("Gagal", e.message || "Gagal menyimpan titi mangsa", "error");
  } finally {
    loading.value = false;
  }
}

async function deleteReportDate(id) {
  if (!confirm("Hapus titi mangsa ini?")) return;

  loading.value = true;
  try {
    const res = await academicSettingsApi.deleteReportDate(id);
    if (res.success) {
      showStatus("Berhasil", "Titi mangsa berhasil dihapus", "success");
      await fetchReportDates();
    }
  } catch (e) {
    showStatus("Gagal", e.message || "Gagal menghapus titi mangsa", "error");
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadData();
  await loadHeaderSettings();
  await fetchReportDates();

  // Set default year for new report date
  if (years.value.length > 0) {
    newReportDate.value.academicYear = activeYear.value || years.value[0].year;
  }
});
</script>
