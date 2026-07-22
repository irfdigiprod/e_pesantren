<template>
  <div class="flex px-2 flex-col gap-2">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Dashboard Klinik</h1>
        <p class="text-slate-500">
          Ringkasan operasional klinik hari ini, {{ todayFormatted }}.
        </p>
      </div>
      <div class="flex gap-2">
        <button
          @click="$router.push('/apps/clinic/examinations')"
          class="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition flex items-center gap-2"
        >
          <Icon icon="solar:stethoscope-bold" />
          Periksa Pasien
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- Patients Today -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-3 mb-2">
          <div
            class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"
          >
            <Icon icon="solar:user-plus-bold-duotone" class="text-xl" />
          </div>
          <span class="text-slate-500 text-sm font-medium"
            >Pasien Hari Ini</span
          >
        </div>
        <div class="text-2xl font-bold text-slate-800">
          {{ stats.todayPatients }}
        </div>
      </div>

      <!-- Active Inpatients -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-3 mb-2">
          <div
            class="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center"
          >
            <Icon icon="solar:bed-bold-duotone" class="text-xl" />
          </div>
          <span class="text-slate-500 text-sm font-medium">Rawat Inap</span>
        </div>
        <div class="text-2xl font-bold text-slate-800">
          {{ stats.activeInpatients }}
        </div>
      </div>

      <!-- Low Stock Medicines -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-3 mb-2">
          <div
            class="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center"
          >
            <Icon icon="solar:pill-bold-duotone" class="text-xl" />
          </div>
          <span class="text-slate-500 text-sm font-medium">Stok Menipis</span>
        </div>
        <div class="text-2xl font-bold text-slate-800">
          {{ stats.lowStockMedicines }}
        </div>
      </div>

      <!-- Total Medicines -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-3 mb-2">
          <div
            class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"
          >
            <Icon icon="solar:medical-kit-bold-duotone" class="text-xl" />
          </div>
          <span class="text-slate-500 text-sm font-medium">Total Obat</span>
        </div>
        <div class="text-2xl font-bold text-slate-800">
          {{ stats.totalMedicines }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Activity (Left 2 cols) -->
      <div class="lg:col-span-2 space-y-6">
        <div
          class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <div
            class="p-4 border-b border-slate-100 flex justify-between items-center"
          >
            <h3 class="font-semibold text-slate-800">Pemeriksaan Terakhir</h3>
            <button
              @click="$router.push('/apps/clinic/examinations')"
              class="text-xs text-blue-600 font-medium hover:underline"
            >
              Lihat Semua
            </button>
          </div>
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-sm">
              <thead
                class="bg-slate-50 text-slate-500 border-b border-slate-100"
              >
                <tr>
                  <th class="text-left py-3 px-4 font-medium">Waktu</th>
                  <th class="text-left py-3 px-4 font-medium">Santri</th>
                  <th class="text-left py-3 px-4 font-medium">Diagnosa</th>
                  <th class="text-left py-3 px-4 font-medium">Status</th>
                  <th class="text-right py-3 px-4 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="exam in recentExaminations"
                  :key="exam.id"
                  class="hover:bg-slate-50/50"
                >
                  <td class="py-3 px-4 text-slate-500">
                    {{ formatDate(exam.createdAt) }}
                  </td>
                  <td class="py-3 px-4 font-medium text-slate-800">
                    {{ exam.studentName }}
                  </td>
                  <td class="py-3 px-4 text-slate-600 truncate max-w-[150px]">
                    {{ exam.diagnosis || "-" }}
                  </td>
                  <td class="py-3 px-4">
                    <span
                      class="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"
                      >Selesai</span
                    >
                  </td>
                  <td class="py-2 px-4 text-right">
                    <button
                      @click="viewHistory(exam)"
                      class="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      title="Riwayat Medis"
                    >
                      <Icon icon="solar:medical-kit-linear" class="text-lg" />
                    </button>
                  </td>
                </tr>
                <tr v-if="recentExaminations.length === 0">
                  <td colspan="5" class="py-8 text-center text-slate-400">
                    Belum ada pemeriksaan hari ini
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Card View (Mobile only) -->
          <div class="block md:hidden divide-y divide-slate-100 p-4 space-y-4">
            <div
              v-for="exam in recentExaminations"
              :key="exam.id"
              class="pt-4 first:pt-0 flex flex-col gap-3"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-bold text-slate-800 text-sm">
                    {{ exam.studentName }}
                  </h4>
                  <p class="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Icon icon="solar:clock-circle-linear" class="text-slate-400 text-xs" />
                    {{ formatDate(exam.createdAt) }}
                  </p>
                </div>
                <div class="flex gap-2">
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-100"
                  >
                    Selesai
                  </span>
                  <button
                    @click="viewHistory(exam)"
                    class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg border border-slate-100 transition"
                    title="Riwayat Medis"
                  >
                    <Icon icon="solar:medical-kit-linear" class="text-sm" />
                  </button>
                </div>
              </div>
              <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs flex justify-between">
                <span class="text-slate-400">Diagnosa:</span>
                <span class="font-medium text-slate-700 truncate max-w-[200px]">{{ exam.diagnosis || "-" }}</span>
              </div>
            </div>
            <div v-if="recentExaminations.length === 0" class="py-8 text-center text-slate-400 text-xs">
              Belum ada pemeriksaan hari ini
            </div>
          </div>
        </div>

        <!-- Low Stock Alert List -->
        <div
          v-if="lowStockItems.length > 0"
          class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <div
            class="p-4 border-b border-slate-100 bg-red-50/30 flex justify-between items-center"
          >
            <h3 class="font-semibold text-red-800 flex items-center gap-2">
              <Icon icon="solar:danger-triangle-bold" />
              Peringatan Stok Obat
            </h3>
            <button
              @click="$router.push('/apps/clinic/medicines')"
              class="text-xs text-red-600 font-medium hover:underline"
            >
              Kelola Stok
            </button>
          </div>
          <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="med in lowStockItems"
              :key="med.id"
              class="flex items-center justify-between p-3 rounded-lg border border-red-100 bg-red-50/10"
            >
              <div>
                <div class="font-medium text-slate-800">{{ med.name }}</div>
                <div class="text-xs text-slate-500">{{ med.category }}</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-red-600">
                  {{ med.stock }} {{ med.unit }}
                </div>
                <div class="text-xs text-slate-400">
                  Min: {{ med.minStock }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Occupied Beds & Quick Stats -->
      <div class="space-y-6">
        <!-- Bed Status -->
        <div
          class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <div class="p-4 border-b border-slate-100">
            <h3 class="font-semibold text-slate-800">Status Rawat Inap</h3>
          </div>
          <div class="p-4">
            <div class="p-4 space-y-6">
              <div
                v-for="room in roomsList"
                :key="room.id"
                class="border-b border-slate-50 last:border-0 pb-4 last:pb-0"
              >
                <div class="flex justify-between items-center mb-2">
                  <h4 class="font-semibold text-sm text-slate-700">
                    {{ room.name }}
                  </h4>
                  <span class="text-xs text-slate-500">
                    {{ room.occupied }} / {{ room.capacity }}
                  </span>
                </div>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="n in room.capacity"
                    :key="n"
                    class="w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all relative group"
                    :class="[
                      (room.occupiedBedNumbers || []).some(
                        (b) => Number(b) === n,
                      )
                        ? 'bg-red-100 text-red-700 border border-red-200 cursor-help'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200',
                    ]"
                  >
                    {{ n }}
                    <!-- Simple Tooltip -->
                    <div
                      v-if="
                        (room.occupiedBedNumbers || []).some(
                          (b) => Number(b) === n,
                        )
                      "
                      class="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 shadow-lg"
                    >
                      Terisi
                    </div>
                  </div>
                </div>
              </div>

              <button
                @click="$router.push('/apps/clinic/inpatients')"
                class="w-full mt-2 py-2 text-sm text-center border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Lihat Detail Rawat Inap
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Medical History Modal -->
    <Teleport to="body">
      <div
        v-if="historyModal.show"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          @click="historyModal.show = false"
        ></div>
        <div
          class="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden animate-fade-in-up relative z-10 flex flex-col max-h-[90vh]"
        >
          <!-- Header -->
          <div
            class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"
          >
            <div class="flex items-center gap-3">
              <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Icon icon="solar:medical-kit-bold-duotone" class="text-2xl" />
              </div>
              <div>
                <h3 class="font-bold text-slate-800">Riwayat Medis Pasien</h3>
                <p class="text-xs text-slate-500 mt-0.5">
                  {{ historyModal.patient?.name }} • {{ historyModal.patient?.type === 'student' ? 'Santri' : historyModal.patient?.type === 'teacher' ? 'Guru' : 'Umum' }}
                </p>
              </div>
            </div>
            <button
              @click="historyModal.show = false"
              class="text-slate-400 hover:text-slate-600 transition"
            >
              <Icon icon="solar:close-circle-bold" class="text-xl" />
            </button>
          </div>

          <!-- Content -->
          <div class="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
            <!-- Patient Info Card -->
            <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold shrink-0"
                  :class="
                    historyModal.patient?.gender === 'P'
                      ? 'bg-pink-50 text-pink-600 border border-pink-100'
                      : 'bg-blue-50 text-blue-600 border border-blue-100'
                  "
                >
                  {{ historyModal.patient?.name?.charAt(0) }}
                </div>
                <div>
                  <h4 class="font-bold text-slate-800 text-sm leading-tight">
                    {{ historyModal.patient?.name }}
                  </h4>
                  <p class="text-xs text-slate-500 mt-1">
                    {{ historyModal.patient?.gender === 'P' ? 'Perempuan' : 'Laki-laki' }} • 
                    {{ historyModal.patient?.age && historyModal.patient?.age !== '-' ? `${historyModal.patient?.age} Tahun` : '-' }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-6 text-xs text-slate-600">
                <div class="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <span class="text-slate-400 mr-1.5">Gol. Darah:</span>
                  <span class="font-bold text-slate-800">{{ historyModal.patient?.bloodType || '-' }}</span>
                </div>
                <div class="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <span class="text-slate-400 mr-1.5">No. HP:</span>
                  <span class="font-bold text-slate-800">{{ historyModal.patient?.phone || '-' }}</span>
                </div>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="historyModal.loading" class="flex flex-col items-center justify-center py-12 gap-3">
              <div class="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p class="text-sm text-slate-500 font-medium">Memuat riwayat medis...</p>
            </div>

            <!-- Empty State -->
            <div
              v-else-if="historyModal.examinations.length === 0"
              class="text-center text-slate-500 py-12 bg-white rounded-2xl border border-dashed border-slate-200"
            >
              <Icon
                icon="solar:folder-with-files-bold-duotone"
                class="text-6xl text-slate-200 mb-4 mx-auto"
              />
              <h5 class="font-bold text-slate-700 mb-1">Belum Ada Riwayat</h5>
              <p class="text-xs text-slate-400 max-w-sm mx-auto">
                Pasien ini belum memiliki catatan pemeriksaan medis atau checkup di klinik.
              </p>
            </div>

            <!-- History List -->
            <div v-else class="space-y-4">
              <div
                v-for="(exam, i) in historyModal.examinations"
                :key="i"
                class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <!-- Examination Card Header -->
                <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start gap-4">
                  <div>
                    <h5 class="font-bold text-slate-800 text-base">
                      {{ exam.diagnosis || "Pemeriksaan Umum" }}
                    </h5>
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                      <span class="flex items-center gap-1">
                        <Icon icon="solar:calendar-date-bold-duotone" class="text-slate-400 text-sm" />
                        {{ formatFullDate(exam.date || exam.examinationDate) }}
                      </span>
                      <span v-if="exam.examinerName" class="flex items-center gap-1 border-l border-slate-200 pl-3">
                        <Icon icon="solar:user-bold-duotone" class="text-slate-400 text-sm" />
                        Pemeriksa: {{ exam.examinerName }}
                      </span>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <span
                      v-if="exam.hasSickLeave"
                      class="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-1 rounded-lg border border-rose-100 uppercase"
                    >
                      Izin Sakit
                    </span>
                    <span
                      v-if="exam.inpatient"
                      class="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-lg border border-indigo-100 uppercase"
                    >
                      Rawat Inap
                    </span>
                  </div>
                </div>

                <!-- Inpatient details badge if any -->
                <div
                  v-if="exam.inpatient"
                  class="mx-4 mt-4 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex items-center gap-3"
                >
                  <div
                    class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"
                  >
                    <Icon icon="solar:hospital-bold-duotone" class="text-lg animate-pulse" />
                  </div>
                  <div>
                    <p class="text-xs font-bold text-indigo-900 leading-none">
                      Rawat Inap Klinik
                    </p>
                    <p class="text-[11px] text-indigo-700 mt-1.5">
                      Ruang: <span class="font-bold text-indigo-900">{{ exam.inpatient.roomName }}</span>
                      <span class="mx-1.5 text-indigo-300">•</span>
                      Bed: <span class="font-bold text-indigo-900">{{ exam.inpatient.bedNumber || "-" }}</span>
                      <span class="mx-1.5 text-indigo-300">•</span>
                      Tgl Admission: <span class="font-bold text-indigo-900">{{ formatFullDate(exam.inpatient.admissionDate) }}</span>
                    </p>
                  </div>
                </div>

                <!-- Examination Details Content -->
                <div class="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div class="space-y-4">
                    <div v-if="exam.complaint || exam.symptoms" class="text-xs">
                      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Icon icon="solar:dialog-2-bold-duotone" class="text-slate-400 text-sm" />
                        Keluhan / Gejala
                      </p>
                      <p class="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {{ exam.complaint || exam.symptoms }}
                      </p>
                    </div>
                    
                    <div v-if="exam.treatment" class="text-xs">
                      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Icon icon="solar:medical-kit-bold-duotone" class="text-slate-400 text-sm" />
                        Tindakan Medis
                      </p>
                      <p class="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {{ exam.treatment }}
                      </p>
                    </div>

                    <div v-if="exam.prescribedMedicines" class="text-xs">
                      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Icon icon="solar:pill-bold-duotone" class="text-slate-400 text-sm" />
                        Resep Obat
                      </p>
                      <p class="text-slate-700 leading-relaxed bg-emerald-50/30 p-2.5 rounded-xl border border-emerald-100 text-emerald-800">
                        {{ exam.prescribedMedicines }}
                      </p>
                    </div>

                    <div v-if="exam.notes || exam.anamnesis" class="text-xs">
                      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Icon icon="solar:notes-bold-duotone" class="text-slate-400 text-sm" />
                        Catatan / Anamnesis
                      </p>
                      <p class="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {{ exam.notes || exam.anamnesis }}
                      </p>
                    </div>
                  </div>

                  <!-- Vitals & Physical Cards -->
                  <div
                    v-if="
                      exam.temperature ||
                      exam.bloodPressure ||
                      exam.weight ||
                      exam.height ||
                      exam.heartRate ||
                      exam.respiratoryRate
                    "
                    class="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 self-start"
                  >
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Icon icon="solar:heart-pulse-bold-duotone" class="text-slate-400 text-sm" />
                      Tanda Vital & Fisik
                    </p>
                    <div class="grid grid-cols-2 gap-3">
                      <div v-if="exam.temperature" class="bg-white p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                        <span class="text-[10px] text-slate-400 block mb-0.5">Suhu Tubuh</span>
                        <span class="font-bold text-slate-700 text-sm">
                          {{ exam.temperature }}<span class="font-normal text-slate-400 ml-0.5">°C</span>
                        </span>
                      </div>
                      <div v-if="exam.bloodPressure" class="bg-white p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                        <span class="text-[10px] text-slate-400 block mb-0.5">Tekanan Darah</span>
                        <span class="font-bold text-slate-700 text-sm">{{ exam.bloodPressure }}</span>
                      </div>
                      <div v-if="exam.heartRate" class="bg-white p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                        <span class="text-[10px] text-slate-400 block mb-0.5">Denyut Nadi</span>
                        <span class="font-bold text-slate-700 text-sm">
                          {{ exam.heartRate }}<span class="font-normal text-slate-400 text-[10px] ml-0.5">bpm</span>
                        </span>
                      </div>
                      <div v-if="exam.respiratoryRate" class="bg-white p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                        <span class="text-[10px] text-slate-400 block mb-0.5">Laju Nafas</span>
                        <span class="font-bold text-slate-700 text-sm">
                          {{ exam.respiratoryRate }}<span class="font-normal text-slate-400 text-[10px] ml-0.5">x/mnt</span>
                        </span>
                      </div>
                      <div v-if="exam.weight" class="bg-white p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                        <span class="text-[10px] text-slate-400 block mb-0.5">Berat Badan</span>
                        <span class="font-bold text-slate-700 text-sm">
                          {{ exam.weight }}<span class="font-normal text-slate-400 ml-0.5">kg</span>
                        </span>
                      </div>
                      <div v-if="exam.height" class="bg-white p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                        <span class="text-[10px] text-slate-400 block mb-0.5">Tinggi Badan</span>
                        <span class="font-bold text-slate-700 text-sm">
                          {{ exam.height }}<span class="font-normal text-slate-400 ml-0.5">cm</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end"
          >
            <button
              @click="historyModal.show = false"
              class="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition text-sm font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from "vue";
import { Icon } from "@iconify/vue";
import { clinicApi, studentsApi, request } from "@/services/api";

const loading = ref(true);
const stats = ref({
  todayPatients: 0,
  activeInpatients: 0,
  lowStockMedicines: 0,
  totalMedicines: 0,
});

const recentExaminations = ref([]);
const lowStockItems = ref([]);
const activeInpatientsList = ref([]);
const roomsList = ref([]);

const historyModal = reactive({
  show: false,
  loading: false,
  patient: null,
  examinations: [],
});
async function viewHistory(exam) {
  const patient = {
    id: exam.clinicPatientId,
    name: exam.patientName || exam.studentName,
    gender: exam.patientGender,
    age: calculateAge(exam.patientDob),
    bloodType: exam.patientBloodType,
    phone: exam.patientPhone,
    type: exam.patientType,
  };
  
  historyModal.patient = patient;
  historyModal.show = true;
  historyModal.loading = true;
  historyModal.examinations = [];
  try {
    const res = await request(`/api/clinic/examinations?clinicPatientId=${exam.clinicPatientId}`);
    historyModal.examinations = res.data || [];
  } catch (e) {
    console.error(e);
  } finally {
    historyModal.loading = false;
  }
}

function calculateAge(dob) {
  if (!dob) return "-";
  const diff = Date.now() - new Date(dob).getTime();
  const ageDt = new Date(diff);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}

function formatFullDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const todayFormatted = computed(() => {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

async function loadData() {
  loading.value = true;
  try {
    // Parallel fetch for efficiency
    const [medsRes, patientsRes, examsRes, roomsRes] = await Promise.all([
      clinicApi.getMedicines(),
      clinicApi.getInpatients({ status: "admitted" }),
      clinicApi.getExaminations(),
      request("/api/clinic/rooms"), // Use request helper or add to clinicApi
    ]);

    const medicines = medsRes.data || [];
    const inpatients = patientsRes.data || [];
    const examinations = examsRes.data || [];

    // Process Medicines
    stats.value.totalMedicines = medicines.length;
    const lowStock = medicines.filter((m) => m.stock <= (m.minStock || 10));
    stats.value.lowStockMedicines = lowStock.length;
    lowStockItems.value = lowStock.slice(0, 4); // Top 4 low stock

    // Process Inpatients
    stats.value.activeInpatients = inpatients.length;
    // Enhance inpatient data with student names if missing (API usually populates student)
    activeInpatientsList.value = inpatients.map((p) => ({
      ...p,
      studentName: p.student?.fullName || `Santri #${p.studentId}`,
    }));

    // Process Examinations (Today Only)
    const today = new Date().toISOString().split("T")[0];
    const todayExams = examinations.filter(
      (e) => e.date === today || (e.createdAt && e.createdAt.startsWith(today)),
    );

    stats.value.todayPatients = todayExams.length;

    // Recent exams list (take last 5)
    recentExaminations.value = todayExams
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date),
      )
      .slice(0, 5)
      .map((e) => ({
        ...e,
        studentName: e.student?.fullName || e.patientName,
      }));

    // Process Rooms
    roomsList.value = Array.isArray(roomsRes?.data) ? roomsRes.data : [];
  } catch (err) {
    console.error("Failed to load dashboard data", err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>
