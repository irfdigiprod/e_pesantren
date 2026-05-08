<template>
  <div>
    <DataTable
      title="Pemeriksaan"
      description="Riwayat pemeriksaan dan cetak resep."
      icon="solar:stethoscope-bold-duotone"
      :items="filteredExaminations"
      :columns="columns"
      :loading="loading"
      :viewMode="viewMode"
      v-model:viewMode="viewMode"
      v-model:search="search"
      :hideFilter="true"
    >
      <template #header-actions>
        <button
          @click="openCreate"
          :disabled="saving"
          class="px-4 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1d10] transition flex items-center gap-2 text-sm font-medium"
        >
          <Icon icon="solar:stethoscope-bold" />
          Pemeriksaan Baru
        </button>
      </template>

      <template #cell-date="{ item }">
        <div class="font-medium text-slate-600">
          {{ formatDate(item.date) }}
        </div>
      </template>

      <template #cell-student="{ item }">
        <div class="font-medium text-slate-800">
          {{ item.student?.fullName || item.studentId }}
        </div>
        <div class="text-xs text-slate-400">ID: {{ item.studentId }}</div>
      </template>

      <template #cell-class="{ item }">
        <span class="text-slate-600 font-medium text-sm">{{
          item.class ? item.class.name : "-"
        }}</span>
      </template>

      <template #cell-halaqah="{ item }">
        <span class="text-slate-600 font-medium text-sm">{{
          item.halaqah ? item.halaqah.name : "-"
        }}</span>
      </template>

      <template #cell-room="{ item }">
        <span class="text-slate-600 font-medium text-sm">{{
          item.room ? item.room.name : "-"
        }}</span>
      </template>

      <template #cell-diagnosis="{ item }">
        <span
          class="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs border border-slate-200 block truncate max-w-[200px]"
          >{{ item.diagnosis || "-" }}</span
        >
      </template>

      <template #cell-actions="{ item }">
        <div class="flex justify-end gap-2">
          <button
            @click="printPrescription(item)"
            class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
            title="Cetak Resep"
          >
            <Icon icon="solar:printer-linear" class="text-lg" />
          </button>
          <button
            @click="openEdit(item)"
            class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Edit"
          >
            <Icon icon="solar:pen-new-square-linear" class="text-lg" />
          </button>
          <button
            @click="confirmDelete(item)"
            class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Hapus"
          >
            <Icon icon="solar:trash-bin-trash-linear" class="text-lg" />
          </button>
        </div>
      </template>

      <!-- Card View -->
      <template #card-item="{ item }">
        <div
          class="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition group relative"
        >
          <div class="flex justify-between items-start mb-2">
            <div>
              <div class="font-medium text-slate-800">
                {{ item.student?.fullName || item.studentId }}
              </div>
              <div class="text-xs text-slate-400">
                {{ formatDate(item.date) }}
              </div>
            </div>
          </div>
          <div
            v-if="item.class || item.room || item.halaqah"
            class="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 mb-2"
          >
            <div v-if="item.class" class="flex items-center gap-1.5">
              <Icon
                icon="solar:book-bookmark-bold-duotone"
                class="text-slate-400"
              />
              <span class="truncate">{{ item.class.name }}</span>
            </div>
            <div v-if="item.room" class="flex items-center gap-1.5">
              <Icon icon="solar:bed-bold-duotone" class="text-slate-400" />
              <span class="truncate">{{ item.room.name }}</span>
            </div>
            <div
              v-if="item.halaqah"
              class="col-span-2 flex items-center gap-1.5"
            >
              <Icon
                icon="solar:users-group-two-rounded-bold-duotone"
                class="text-slate-400"
              />
              <span class="truncate">{{ item.halaqah.name }}</span>
            </div>
          </div>
          <div class="space-y-2 mt-4 text-xs text-slate-600">
            <div>
              <span class="font-semibold block text-slate-500 mb-0.5"
                >Diagnosa</span
              >
              <div class="bg-slate-50 p-2 rounded border border-slate-100">
                {{ item.diagnosis || "-" }}
              </div>
            </div>
            <div>
              <span class="font-semibold block text-slate-500 mb-0.5"
                >Tindakan</span
              >
              <div class="line-clamp-2 text-slate-500">
                {{ item.treatment || "-" }}
              </div>
            </div>
          </div>
          <div
            class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1 bg-white/90 backdrop-blur rounded-lg p-1 shadow-sm border border-slate-100"
          >
            <button
              @click="printPrescription(item)"
              class="p-1.5 hover:text-emerald-600"
            >
              <Icon icon="solar:printer-linear" />
            </button>
            <button @click="openEdit(item)" class="p-1.5 hover:text-blue-600">
              <Icon icon="solar:pen-new-square-linear" />
            </button>
            <button
              @click="confirmDelete(item)"
              class="p-1.5 hover:text-red-600"
            >
              <Icon icon="solar:trash-bin-trash-linear" />
            </button>
          </div>
        </div>
      </template>
    </DataTable>

    <!-- Modal Form -->
    <Teleport to="body">
      <div
        v-if="modal.show"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          @click="closeModal"
        ></div>
        <div
          class="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden animate-fade-in-up relative z-10 flex flex-col max-h-[90vh]"
        >
          <div
            class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"
          >
            <h3 class="font-bold text-slate-800">
              {{
                modal.mode === "create"
                  ? "Pemeriksaan Baru"
                  : "Edit Pemeriksaan"
              }}
            </h3>
            <button
              @click="closeModal"
              class="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <div class="p-6 space-y-6 overflow-y-auto custom-scrollbar">
            <!-- Patient Info Section -->
            <div class="space-y-4">
              <h4 class="text-sm font-bold text-slate-700 border-b pb-2">
                Informasi Pasien
              </h4>
              <PatientSelector
                :modelValue="{
                  type: form.patientType,
                  refId: form.refId,
                  name: form.name,
                  gender: form.gender,
                  phone: form.phone,
                  address: form.address,
                  dob: form.dob,
                  birthPlace: form.birthPlace,
                  bloodType: form.bloodType,
                  clinicPatientId: form.clinicPatientId,
                  // Address Parts
                  province: form.province,
                  regency: form.regency,
                  district: form.district,
                  village: form.village,
                  addressDetail: form.addressDetail,
                  postalCode: form.postalCode,
                }"
                @update:modelValue="
                  (val) => {
                    form.patientType = val.type;
                    Object.assign(form, val);
                  }
                "
              />
              <div>
                <label
                  class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider"
                  >Tanggal Pemeriksaan</label
                >
                <input
                  v-model="form.date"
                  type="date"
                  class="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm"
                />
              </div>

              <!-- Attendance Sick Leave Toggle -->
              <div
                v-if="form.patientType === 'student'"
                class="pt-3 border-t border-slate-100"
              >
                <div class="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="createSickLeave"
                    v-model="form.createSickLeave"
                    class="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-600/30 cursor-pointer"
                  />
                  <label
                    for="createSickLeave"
                    class="text-sm font-bold text-emerald-700 cursor-pointer"
                    >Buat perizinan sakit di absensi santri?</label
                  >
                </div>

                <div
                  v-if="form.createSickLeave"
                  class="grid grid-cols-2 gap-4 p-4 bg-emerald-50 rounded-lg animate-fade-in-up border border-emerald-100 mb-3"
                >
                  <div>
                    <label
                      class="block text-xs font-semibold text-emerald-900 mb-1"
                      >Mulai Tanggal</label
                    >
                    <input
                      v-model="form.sickStartDate"
                      type="date"
                      class="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label
                      class="block text-xs font-semibold text-emerald-900 mb-1"
                      >Sampai Tanggal</label
                    >
                    <input
                      v-model="form.sickEndDate"
                      type="date"
                      class="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <!-- Inpatient Toggle -->
              <div
                v-if="modal.mode === 'create'"
                class="pt-3 border-t border-slate-100"
              >
                <div class="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="isInpatient"
                    v-model="form.isInpatient"
                    class="w-4 h-4 text-[#602515] rounded border-slate-300 focus:ring-[#602515]/30 cursor-pointer"
                  />
                  <label
                    for="isInpatient"
                    class="text-sm font-bold text-slate-700 cursor-pointer"
                    >Rujuk Ke Rawat Inap?</label
                  >
                </div>

                <div
                  v-if="form.isInpatient"
                  class="grid grid-cols-2 gap-4 p-4 bg-amber-50 rounded-lg animate-fade-in-up border border-amber-100"
                >
                  <div>
                    <label
                      class="block text-xs font-semibold text-amber-900 mb-1"
                      >Pilih Ruangan</label
                    >
                    <select
                      v-model="form.roomId"
                      class="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    >
                      <option :value="null">- Pilih Ruangan -</option>
                      <option
                        v-for="room in rooms"
                        :key="room.id"
                        :value="room.id"
                      >
                        {{ room.name }} ({{
                          room.gender === "mixed" ? "Campur" : room.gender
                        }}) - Cap: {{ room.capacity }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label
                      class="block text-xs font-semibold text-amber-900 mb-1"
                      >Nomor Bed</label
                    >
                    <select
                      v-model="form.bedNumber"
                      class="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    >
                      <option value="">- Pilh Bed -</option>
                      <option
                        v-for="bed in availableBeds"
                        :key="bed"
                        :value="bed"
                      >
                        Bed {{ bed }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Medical History (Optional) -->
            <div class="space-y-4">
              <h4 class="text-sm font-bold text-slate-700 border-b pb-2">
                Riwayat Medis (Opsional)
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1"
                    >Riwayat Penyakit Dahulu</label
                  >
                  <textarea
                    v-model="form.historyPastDiseases"
                    rows="2"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Kondisi kronis, operasi..."
                  ></textarea>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1"
                    >Riwayat Penyakit Keluarga</label
                  >
                  <textarea
                    v-model="form.historyFamilyDiseases"
                    rows="2"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Diabetes, kanker..."
                  ></textarea>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1"
                    >Alergi</label
                  >
                  <textarea
                    v-model="form.historyAllergies"
                    rows="2"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Obat, makanan..."
                  ></textarea>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1"
                    >Obat yg Sedang Dikonsumsi</label
                  >
                  <textarea
                    v-model="form.historyCurrentMedications"
                    rows="2"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Anamnesis & Vitals -->
            <div class="space-y-4">
              <h4 class="text-sm font-bold text-slate-700 border-b pb-2">
                Anamnesis & Tanda Vital
              </h4>

              <div class="grid grid-cols-1 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1"
                    >Keluhan Utama</label
                  >
                  <textarea
                    v-model="form.complaint"
                    rows="2"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Gejala utama..."
                  ></textarea>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1"
                    >Riwayat Keluhan Saat Ini</label
                  >
                  <textarea
                    v-model="form.anamnesis"
                    rows="2"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Kronologi, faktor pemicu..."
                  ></textarea>
                </div>
              </div>

              <div
                class="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg"
              >
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1"
                    >Tekanan Darah</label
                  >
                  <input
                    v-model="form.bloodPressure"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="mmHg"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1"
                    >Suhu (°C)</label
                  >
                  <input
                    v-model="form.temperature"
                    type="number"
                    step="0.1"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1"
                    >Nadi (bpm)</label
                  >
                  <input
                    v-model="form.heartRate"
                    type="number"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1"
                    >Pernapasan (rpm)</label
                  >
                  <input
                    v-model="form.respiratoryRate"
                    type="number"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1"
                    >Berat (kg)</label
                  >
                  <input
                    v-model="form.weight"
                    type="number"
                    step="0.1"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1"
                    >Tinggi (cm)</label
                  >
                  <input
                    v-model="form.height"
                    type="number"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1"
                  >Pemeriksaan Fisik</label
                >
                <textarea
                  v-model="form.physicalExam"
                  rows="3"
                  class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Temuan visual, palpasi..."
                ></textarea>
              </div>
            </div>

            <!-- Clinical Data -->
            <div class="space-y-4">
              <h4 class="text-sm font-bold text-slate-700 border-b pb-2">
                Data Klinis & Penanganan
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1"
                    >Diagnosis (ICD-10 / Nama)</label
                  >
                  <input
                    v-model="form.diagnosis"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Diagnosis utama..."
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1"
                    >Kode Diagnosis (Opsional)</label
                  >
                  <input
                    v-model="form.diagnosisCode"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="ICD-10 Code"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1"
                  >Rencana Perawatan / Tindakan</label
                >
                <textarea
                  v-model="form.treatment"
                  rows="3"
                  class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                ></textarea>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1"
                    >Resep Obat</label
                  >
                  <MedicineSelector
                    v-model="form.consumedMedicines"
                    :medicines="medicines"
                    @update:modelValue="updatePrescriptionText"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1"
                    >Instruksi Tindak Lanjut</label
                  >
                  <textarea
                    v-model="form.followUpInstructions"
                    rows="3"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
          <div
            class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3"
          >
            <button
              @click="closeModal"
              class="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 transition text-sm font-medium"
            >
              Batal
            </button>
            <button
              @click="submitForm"
              :disabled="saving"
              class="px-5 py-2.5 rounded-lg bg-[#602515] text-white hover:bg-[#4a1d10] transition text-sm font-medium flex items-center gap-2 shadow-lg shadow-[#602515]/20"
            >
              {{ saving ? "Menyimpan..." : "Simpan" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Confirm Modal -->
    <ConfirmModal
      :isOpen="confirm.show"
      :loading="saving"
      title="Hapus Data?"
      message="Yakin hapus data pemeriksaan ini?"
      type="danger"
      @confirm="deleteItem"
      @cancel="confirmCancel"
    />

    <!-- Status Modal -->
    <StatusModal
      :isOpen="statusModal.show"
      :type="statusModal.type"
      :title="statusModal.title"
      :message="statusModal.message"
      @close="statusModal.show = false"
    />

    <!-- Hidden Print Templates -->
    <div
      id="print-area"
      class="hidden print:block fixed inset-0 bg-white z-[9999] p-8"
    >
      <!-- PRESCRIPTION LAYOUT -->
      <div
        v-if="printData && printMode === 'prescription'"
        class="max-w-lg mx-auto border p-8 bg-white"
      >
        <!-- Header -->
        <div
          class="flex items-center gap-6 border-b-4 border-double border-slate-800 pb-4 mb-6"
        >
          <div class="shrink-0">
            <img
              v-if="institution.logo"
              :src="institution.logo"
              alt="Logo"
              class="h-24 w-auto object-contain"
            />
            <div
              v-else
              class="w-24 h-24 bg-slate-100 flex items-center justify-center rounded-lg border text-slate-400"
            >
              <Icon icon="solar:hospital-bold" class="text-4xl" />
            </div>
          </div>
          <div class="flex-1 text-right">
            <h1
              class="font-bold text-2xl uppercase tracking-wider text-slate-900 leading-tight"
            >
              {{ institution.name || "Klinik Minhajul Haq" }}
            </h1>
            <p class="text-sm text-slate-600 font-serif mb-1">
              {{
                institution.address || "Jl. Raya Purwakarta No. 123, Jawa Barat"
              }}
            </p>
            <p class="text-xs text-slate-500">
              {{ institution.contact ? `Kontak: ${institution.contact}` : "" }}
            </p>
            <div
              class="mt-2 text-sm font-bold border-t border-slate-300 inline-block pt-1"
            >
              SALINAN RESEP
            </div>
          </div>
        </div>

        <div
          class="mb-6 flex justify-between items-end border-b border-dashed pb-4"
        >
          <div>
            <p class="text-xs text-slate-500">Tanggal</p>
            <p class="font-medium">{{ formatDate(printData.date) }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-slate-500">Pasien</p>
            <p class="font-bold text-lg">
              {{
                printData.student?.fullName ||
                printData.studentId ||
                printData.patientName
              }}
            </p>
          </div>
        </div>

        <div class="space-y-6 mb-8 min-h-[300px]">
          <div>
            <h3
              class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2"
            >
              Diagnosa
            </h3>
            <p class="text-sm font-medium">{{ printData.diagnosis || "-" }}</p>
          </div>

          <div>
            <h3
              class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"
            >
              <span class="text-xl italic font-serif">R/</span> Resep & Obat
            </h3>
            <div
              class="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm whitespace-pre-wrap font-mono leading-relaxed"
            >
              {{ printData.prescribedMedicinesText || printData.treatment }}
            </div>
          </div>

          <div v-if="printData.followUpInstructions">
            <h3
              class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2"
            >
              Instruksi Dokter
            </h3>
            <p class="text-sm italic text-slate-600">
              {{ printData.followUpInstructions }}
            </p>
          </div>
        </div>

        <div class="mt-8 flex justify-end">
          <div class="text-center w-40">
            <p class="mb-16 text-xs text-slate-500">Pemeriksa,</p>
            <p class="text-sm font-bold underline">
              {{ user?.name || "Dokter Pemeriksa" }}
            </p>
          </div>
        </div>
      </div>

      <!-- SICK LETTER LAYOUT -->
      <div
        v-if="printData && printMode === 'sick-letter'"
        class="max-w-2xl mx-auto bg-white p-8"
      >
        <!-- Formal Header -->
        <div
          class="flex items-center gap-4 border-b-4 border-double border-slate-800 pb-4 mb-8"
        >
          <!-- Dynamic Logo -->
          <div
            v-if="institution.logo"
            class="w-24 h-24 flex items-center justify-center"
          >
            <img :src="institution.logo" class="w-full h-full object-contain" />
          </div>
          <div
            v-else
            class="w-20 h-20 bg-slate-100 flex items-center justify-center rounded-full border"
          >
            <Icon icon="solar:hospital-bold" class="text-3xl text-slate-400" />
          </div>

          <div class="flex-1 text-center">
            <h1
              class="font-bold text-2xl uppercase tracking-widest text-slate-900"
            >
              {{ institution.name || "Klinik Pratama Minhajul Haq" }}
            </h1>
            <p class="text-sm text-slate-600 font-serif">
              {{
                institution.address
                  ? `Alamat: ${institution.address}`
                  : "Alamat: Kp. Cijantung RT.03/RW.04, Purwakarta"
              }}
            </p>
            <p class="text-sm text-slate-600 font-serif">
              {{
                institution.contact
                  ? `Kontak: ${institution.contact}`
                  : "Telp: (0264) 1234567 • Email: klinik@minhajulhaq.com"
              }}
            </p>
          </div>
        </div>

        <div class="text-center mb-8">
          <h2
            class="font-bold text-xl underline decoration-2 underline-offset-4 uppercase"
          >
            Surat Keterangan Sakit
          </h2>
        </div>

        <div
          class="space-y-6 text-justify leading-relaxed font-serif text-slate-800"
        >
          <p>Yang bertanda tangan di bawah ini, menerangkan bahwa:</p>

          <table class="w-full ml-4">
            <tr>
              <td class="w-32 py-1">Nama</td>
              <td class="w-4">:</td>
              <td class="font-bold">
                {{ printData.student?.fullName || printData.patientName }}
              </td>
            </tr>
            <tr>
              <td class="py-1">Umur / Tgl Lahir</td>
              <td>:</td>
              <td>
                {{
                  printData.patientDob ? formatDate(printData.patientDob) : "-"
                }}
                {{
                  printData.patientDob
                    ? `(${
                        new Date().getFullYear() -
                        new Date(printData.patientDob).getFullYear()
                      } Th)`
                    : ""
                }}
              </td>
            </tr>
            <tr>
              <td class="py-1">Jenis Kelamin</td>
              <td>:</td>
              <td>
                {{
                  printData.gender === "P" || printData.patientGender === "P"
                    ? "Perempuan"
                    : "Laki-laki"
                }}
              </td>
            </tr>
            <tr>
              <td class="py-1">Alamat</td>
              <td>:</td>
              <td>
                {{ printData.address || printData.patientAddress || "-" }}
              </td>
            </tr>
            <tr>
              <td class="py-1">Diagnosa</td>
              <td>:</td>
              <td>{{ printData.diagnosis || "Sakit" }}</td>
            </tr>
          </table>

          <p>
            Menyatakan bahwa pasien tersebut dalam keadaan
            <strong>SAKIT</strong> dan memerlukan istirahat selama ......
            (....................) hari, terhitung mulai tanggal
            <strong>{{ formatDate(printData.date) }}</strong> s/d
            ........................ .
          </p>

          <p>
            Demikian surat keterangan ini dibuat untuk dapat dipergunakan
            sebagaimana mestinya.
          </p>
        </div>

        <div class="mt-16 flex justify-end">
          <div class="text-center w-48">
            <p class="mb-1 text-sm">Purwakarta, {{ formatDate(new Date()) }}</p>
            <p class="text-xs text-slate-500 mb-20">Dokter Pemeriksa,</p>
            <p class="font-bold underline decoration-slate-400">
              {{ user?.name || "Dr. Pemeriksa" }}
            </p>
            <p class="text-xs text-slate-400">SIP: -</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { Icon } from "@iconify/vue";
import { clinicApi, settingsApi } from "@/services/api.js";
import DataTable from "@/components/ui/DataTable.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import StatusModal from "@/components/ui/StatusModal.vue";

import PatientSelector from "@/components/clinic/PatientSelector.vue";
import MedicineSelector from "@/components/clinic/MedicineSelector.vue";

const examinations = ref([]);
const loading = ref(false);
const saving = ref(false);
const search = ref("");
const user = ref(null);
const viewMode = ref("table");

const printData = ref(null);

const modal = reactive({ show: false, mode: "create" });
const statusModal = reactive({
  show: false,
  type: "success",
  title: "",
  message: "",
});
const confirm = reactive({ show: false, item: null });

const rooms = ref([]);
const medicines = ref([]);
const institution = reactive({
  name: "",
  address: "",
  logo: "",
  phone: "",
});

const form = reactive({
  id: null,
  patientType: "student",
  refId: null,
  name: "",
  gender: "L",
  phone: "",
  address: "",
  dob: null,

  // New Patient Fields
  birthPlace: "",
  bloodType: "",
  province: null,
  regency: null,
  district: null,
  village: null,
  addressDetail: "",
  postalCode: "",

  date: "",
  complaint: "",
  diagnosis: "",
  treatment: "",

  // Inpatient Admission
  isInpatient: false,
  roomId: null,
  bedNumber: "",
  createSickLeave: true,
  sickStartDate: new Date().toISOString().split("T")[0],
  sickEndDate: new Date().toISOString().split("T")[0],

  // New Fields
  historyPastDiseases: "",
  historyFamilyDiseases: "",
  historyAllergies: "",
  historyCurrentMedications: "",
  historyHabits: "",
  anamnesis: "",
  bloodPressure: "",
  temperature: "",
  heartRate: "",
  respiratoryRate: "",
  weight: "",
  height: "",
  physicalExam: "",
  diagnosisCode: "",
  prescribedMedicinesText: "",
  followUpInstructions: "",
  consumedMedicines: [],
});

function updatePrescriptionText(items) {
  // Auto-generate text from structured items
  if (!items || !items.length) {
    form.prescribedMedicinesText = "";
    return;
  }
  form.prescribedMedicinesText = items
    .map((i) => `${i.name} (${i.quantity} ${i.unit || "pcs"})`)
    .join("\n");
}

const columns = [
  { label: "Waktu", field: "date", sortable: true },
  { label: "Santri", field: "student", sortable: true },
  { label: "Kelas/Rombel", field: "class" },
  { label: "Grup Halaqah", field: "halaqah" },
  { label: "Kamar", field: "room" },
  { label: "Keluhan", field: "complaint" },
  { label: "Diagnosa", field: "diagnosis" },
  { label: "Penanganan", field: "treatment" },
  { label: "Aksi", field: "actions", align: "right" },
];

const filteredExaminations = computed(() => {
  if (!search.value) return examinations.value;
  const q = search.value.toLowerCase();
  return examinations.value.filter(
    (e) =>
      e.student?.fullName?.toLowerCase().includes(q) ||
      String(e.studentId).includes(q) ||
      (e.diagnosis || "").toLowerCase().includes(q),
  );
});

const availableBeds = computed(() => {
  if (!form.roomId) return [];
  const room = rooms.value.find((r) => r.id === form.roomId);
  if (!room) return [];
  const beds = [];
  for (let i = 1; i <= room.capacity; i++) {
    const bedStr = String(i).padStart(2, "0");
    const isOccupied = (room.occupiedBedNumbers || []).includes(bedStr);
    if (!isOccupied) {
      beds.push(bedStr);
    }
  }
  return beds;
});

function showStatus(type, title, message) {
  statusModal.type = type;
  statusModal.title = title;
  statusModal.message = message;
  statusModal.show = true;
}

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await clinicApi.getExaminations();
    examinations.value = Array.isArray(res?.data) ? res.data : [];

    const roomRes = await clinicApi.getRooms();
    rooms.value = Array.isArray(roomRes?.data) ? roomRes.data : [];

    const medRes = await clinicApi.getMedicines();
    medicines.value = Array.isArray(medRes?.data) ? medRes.data : [];

    // Get user
    const u = localStorage.getItem("user");
    if (u) user.value = JSON.parse(u);
  } catch (e) {
    showStatus("error", "Gagal", e.message);
  } finally {
    loading.value = false;
  }
}

async function submitForm() {
  saving.value = true;
  try {
    if (!form.name || !form.date) {
      throw new Error("Nama Pasien dan Tanggal wajib diisi");
    }
    const payload = {
      clinicPatientId: form.clinicPatientId || undefined,
      patientType: form.patientType,
      refId: form.refId,
      name: form.name,
      gender: form.gender,
      phone: form.phone,
      address: form.address, // Contains formatted string from AddressSelector
      dob: form.dob,

      // New Patient Fields
      birthPlace: form.birthPlace,
      bloodType: form.bloodType,
      province: form.province,
      regency: form.regency,
      district: form.district,
      village: form.village,
      addressDetail: form.addressDetail,
      postalCode: form.postalCode,

      date: form.date,
      complaint: form.complaint || undefined,
      diagnosis: form.diagnosis || undefined,
      treatment: form.treatment || undefined,

      // New Fields
      historyPastDiseases: form.historyPastDiseases || undefined,
      historyFamilyDiseases: form.historyFamilyDiseases || undefined,
      historyAllergies: form.historyAllergies || undefined,
      historyCurrentMedications: form.historyCurrentMedications || undefined,
      historyHabits: form.historyHabits || undefined,
      anamnesis: form.anamnesis || undefined,
      bloodPressure: form.bloodPressure || undefined,
      temperature: form.temperature || undefined,
      heartRate: form.heartRate || undefined,
      respiratoryRate: form.respiratoryRate || undefined,
      weight: form.weight || undefined,
      height: form.height || undefined,
      physicalExam: form.physicalExam || undefined,
      labResults: form.labResults || undefined,
      imagingResults: form.imagingResults || undefined,
      diagnosisCode: form.diagnosisCode || undefined,
      treatmentPlan: form.treatmentPlan || undefined,
      progressNotes: form.progressNotes || undefined,
      followUpInstructions: form.followUpInstructions || undefined,
      followUpInstructions: form.followUpInstructions || undefined,
      prescribedMedicinesText: form.prescribedMedicinesText || undefined,
      consumedMedicines: form.consumedMedicines,

      // Inpatient Admission
      isInpatient: form.isInpatient,
      roomId: form.roomId,
      bedNumber: form.bedNumber,

      createSickLeave: form.createSickLeave,
      sickStartDate: form.sickStartDate,
      sickEndDate: form.sickEndDate,
    };
    if (modal.mode === "edit" && form.id) {
      await clinicApi.updateExamination(form.id, payload);
    } else {
      await clinicApi.createExamination(payload);
    }
    await fetchData();
    closeModal();
    showStatus("success", "Berhasil", "Data pemeriksaan berhasil disimpan");
  } catch (e) {
    showStatus("error", "Gagal", e.message || "Gagal menyimpan");
  } finally {
    saving.value = false;
  }
}

async function deleteItem() {
  saving.value = true;
  try {
    await clinicApi.deleteExamination(confirm.item.id);
    await fetchData();
    confirmCancel();
    showStatus("success", "Terhapus", "Data pemeriksaan berhasil dihapus");
  } catch (e) {
    showStatus("error", "Gagal", e.message || "Gagal menghapus");
  } finally {
    saving.value = false;
  }
}

const printMode = ref("prescription"); // 'prescription' | 'sick-letter'

function printPrescription(item) {
  // Parse medicines if available as JSON string
  let medText = item.treatment || "";

  if (item.prescribedMedicines) {
    try {
      const meds =
        typeof item.prescribedMedicines === "string"
          ? JSON.parse(item.prescribedMedicines)
          : item.prescribedMedicines;

      if (Array.isArray(meds) && meds.length > 0) {
        medText = meds
          .map((m) => `${m.name} (${m.quantity} ${m.unit || "pcs"})`)
          .join("\n");
      }
    } catch (e) {
      // console.debug("Legacy medicine text format", item.prescribedMedicines);
      medText = item.prescribedMedicines;
    }
  }

  printData.value = {
    ...item,
    prescribedMedicinesText: medText,
  };
  printMode.value = "prescription";
  setTimeout(() => {
    window.print();
  }, 500); // Increased timeout for proper rendering
}

function printSickLetter(item) {
  printData.value = item;
  printMode.value = "sick-letter";
  setTimeout(() => {
    window.print();
  }, 100);
}

function openCreate() {
  modal.show = true;
  modal.mode = "create";
  Object.assign(form, {
    id: null,
    patientType: "student",
    refId: null,
    name: "",
    gender: "L",
    phone: "",
    address: "",
    dob: null,

    date: new Date().toISOString().split("T")[0],
    complaint: "",
    diagnosis: "",
    treatment: "",

    // New Fields Reset
    historyPastDiseases: "",
    historyFamilyDiseases: "",
    historyAllergies: "",
    historyCurrentMedications: "",
    historyHabits: "",
    anamnesis: "",
    bloodPressure: "",
    temperature: "",
    heartRate: "",
    respiratoryRate: "",
    weight: "",
    height: "",
    physicalExam: "",
    diagnosisCode: "",
    prescribedMedicinesText: "",
    followUpInstructions: "",
    consumedMedicines: [],
    isInpatient: false,
    roomId: null,
    bedNumber: "",
    createSickLeave: true,
    sickStartDate: new Date().toISOString().split("T")[0],
    sickEndDate: new Date().toISOString().split("T")[0],
    clinicPatientId: null,
  });
}
function openEdit(item) {
  modal.show = true;
  modal.mode = "edit";
  Object.assign(form, {
    ...item,
    // Map patient info from join
    clinicPatientId: item.clinicPatientId,
    name: item.patientName,
    patientType: item.patientType,
    gender: item.patientGender,
    phone: item.patientPhone,
    dob: item.patientDob ? item.patientDob.split("T")[0] : null,
    birthPlace: item.patientBirthPlace,
    bloodType: item.patientBloodType || "",

    // Address (Parse JSON if needed, but frontend expects objects)
    province:
      typeof item.patientProvince === "string"
        ? JSON.parse(item.patientProvince)
        : item.patientProvince,
    regency:
      typeof item.patientRegency === "string"
        ? JSON.parse(item.patientRegency)
        : item.patientRegency,
    district:
      typeof item.patientDistrict === "string"
        ? JSON.parse(item.patientDistrict)
        : item.patientDistrict,
    village:
      typeof item.patientVillage === "string"
        ? JSON.parse(item.patientVillage)
        : item.patientVillage,
    addressDetail: item.patientAddressDetail,
    postalCode: item.patientPostalCode,

    // Legacy/Display address
    address: item.patientAddress,

    // Map symptoms back to complaint
    complaint: item.symptoms || item.complaint,

    date: item.date ? new Date(item.date).toISOString().split("T")[0] : "",
    createSickLeave: !!item.hasSickLeave,
    sickStartDate: item.date
      ? new Date(item.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    sickEndDate: item.date
      ? new Date(item.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    prescribedMedicinesText: item.prescribedMedicines || "", // Legacy
    consumedMedicines: [], // For edit we don't load structured yet to avoid stock issues
  });
}
function closeModal() {
  modal.show = false;
}
function confirmDelete(item) {
  confirm.show = true;
  confirm.item = item;
}
function confirmCancel() {
  confirm.show = false;
  confirm.item = null;
}

async function fetchSettings() {
  try {
    const res = await settingsApi.getAll();
    if (res.success) {
      const data = res.data;
      if (data.institution_name) institution.name = data.institution_name;

      // Address construction
      const parts = [];
      if (data.institution_address_detail)
        parts.push(data.institution_address_detail);

      // Parse JSON regions if needed, simplified for now:
      // If full address stored in a single field or constructed:

      institution.address = parts.join(", "); // Simplified

      if (data.institution_contact)
        institution.contact = data.institution_contact;

      if (data.institution_logo) {
        // Handle full URL logic similar to SettingsInstitution
        const base = import.meta.env.VITE_API_BASE_URL || "";
        if (data.institution_logo.startsWith("/api/uploads")) {
          institution.logo = `${base}${data.institution_logo}`;
        } else if (data.institution_logo.startsWith("uploads/")) {
          institution.logo = `${base}/api/${data.institution_logo}`;
        } else {
          institution.logo = data.institution_logo;
        }
      }
    }
  } catch (e) {
    console.error("Failed settings", e);
  }
}

onMounted(() => {
  fetchData();
  fetchSettings();
});
</script>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}
</style>

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
    min-height: 100vh;
    background: white;
    display: block !important;
    z-index: 99999;
  }
  @page {
    margin: 0;
    size: auto;
  }
}
</style>
