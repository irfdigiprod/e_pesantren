<template>
  <div>
    <DataTable
      title="Manajemen Ruangan"
      description="Atur ketersediaan ruangan dan kapasitas bed klinik."
      icon="solar:bed-bold-duotone"
      :items="paginatedRooms"
      :columns="columns"
      :loading="loading"
      v-model:search="search"
      v-model:viewMode="viewMode"
      :pagination="pagination"
      @page-change="onPageChange"
      @update:limit="onLimitChange"
    >
      <template #header-actions>
        <button
          @click="openCreate"
          :disabled="saving"
          class="px-4 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1d10] transition flex items-center gap-2 text-sm font-medium"
        >
          <Icon icon="solar:add-circle-bold" />
          Tambah Ruangan
        </button>
      </template>

      <!-- Table Cell Templates -->
      <template #cell-gender="{ item }">
        <span
          v-if="item.gender === 'L'"
          class="text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs"
          >Putra</span
        >
        <span
          v-else-if="item.gender === 'P'"
          class="text-pink-600 bg-pink-50 px-2 py-1 rounded text-xs"
          >Putri</span
        >
        <span
          v-else
          class="text-slate-600 bg-slate-50 px-2 py-1 rounded text-xs"
          >Campur</span
        >
      </template>

      <template #cell-capacity="{ item }">
        <div class="flex flex-col gap-1">
          <div class="flex flex-wrap gap-1 max-w-[200px]">
            <div
              v-for="n in item.capacity"
              :key="n"
              class="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all"
              :class="[
                (item.occupiedBedNumbers || []).some((b) => Number(b) === n)
                  ? 'bg-red-100 text-red-700 border border-red-200 cursor-pointer hover:bg-red-200'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200',
              ]"
              :title="
                (item.occupiedBedNumbers || []).some((b) => Number(b) === n)
                  ? 'Terisi (Klik untuk detail)'
                  : 'Kosong'
              "
              @click="
                (item.occupiedBedNumbers || []).some((b) => Number(b) === n)
                  ? showOccupantDetail(item, n)
                  : null
              "
            >
              {{ n }}
            </div>
          </div>
          <span class="text-xs text-slate-400 mt-1">
            Terisi: {{ item.occupied }} / {{ item.capacity }}
          </span>
        </div>
      </template>

      <template #cell-actions="{ item }">
        <div class="flex justify-end gap-2">
          <button
            @click="openEdit(item)"
            class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <Icon icon="solar:pen-new-square-linear" class="text-lg" />
          </button>
          <button
            @click="confirmDelete(item)"
            class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            :disabled="item.occupied > 0"
            :title="item.occupied > 0 ? 'Ruangan sedang dipakai' : 'Hapus'"
            :class="item.occupied > 0 ? 'opacity-50 cursor-not-allowed' : ''"
          >
            <Icon icon="solar:trash-bin-trash-linear" class="text-lg" />
          </button>
        </div>
      </template>

      <!-- Card View Template (Denah Mode) -->
      <template #card-item="{ item }">
        <div
          class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all"
        >
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="font-bold text-slate-800">{{ item.name }}</h3>
              <div class="text-xs text-slate-500 mt-0.5">
                <span v-if="item.gender === 'L'" class="text-blue-600"
                  >Santri Putra</span
                >
                <span v-else-if="item.gender === 'P'" class="text-pink-600"
                  >Santri Putri</span
                >
                <span v-else class="text-slate-500">Campur</span>
              </div>
            </div>
            <div class="flex gap-1">
              <button
                @click="openEdit(item)"
                class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
              >
                <Icon icon="solar:pen-new-square-linear" />
              </button>
              <button
                @click="confirmDelete(item)"
                :disabled="item.occupied > 0"
                class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
              >
                <Icon icon="solar:trash-bin-trash-linear" />
              </button>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 mb-3">
            <div
              v-for="n in item.capacity"
              :key="n"
              class="w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all relative group"
              :class="[
                (item.occupiedBedNumbers || []).some((b) => Number(b) === n)
                  ? 'bg-red-100 text-red-700 border border-red-200 cursor-pointer hover:bg-red-200'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200',
              ]"
              :title="
                (item.occupiedBedNumbers || []).some((b) => Number(b) === n)
                  ? 'Terisi (Klik untuk detail)'
                  : 'Kosong'
              "
              @click="
                (item.occupiedBedNumbers || []).some((b) => Number(b) === n)
                  ? showOccupantDetail(item, n)
                  : null
              "
            >
              {{ n }}
              <div
                v-if="
                  (item.occupiedBedNumbers || []).some((b) => Number(b) === n)
                "
                class="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 shadow-lg"
              >
                Terisi (Klik untuk detail)
              </div>
            </div>
          </div>

          <div
            class="flex justify-between items-center text-xs border-t border-slate-100 pt-3"
          >
            <span class="text-slate-500"
              >Terisi: <b>{{ item.occupied }}</b> / {{ item.capacity }}</span
            >
            <span
              v-if="item.isFull"
              class="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded"
              >Penuh</span
            >
            <span
              v-else
              class="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded"
              >Tersedia</span
            >
          </div>
        </div>
      </template>
    </DataTable>

    <!-- Modal -->
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
          class="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-fade-in-up relative z-10"
        >
          <div
            class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"
          >
            <h3 class="font-bold text-slate-800">
              {{ modal.mode === "create" ? "Tambah Ruangan" : "Edit Ruangan" }}
            </h3>
            <button
              @click="closeModal"
              class="text-slate-400 hover:text-slate-600"
            >
              <Icon icon="solar:close-circle-bold" class="text-xl" />
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label
                class="block text-xs font-semibold text-slate-500 mb-1 uppercase"
                >Nama Ruangan</label
              >
              <input
                v-model="form.name"
                class="w-full border rounded-lg px-4 py-2 text-sm"
                placeholder="Contoh: Ruang Melati"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-xs font-semibold text-slate-500 mb-1 uppercase"
                  >Kapasitas (Bed)</label
                >
                <input
                  v-model="form.capacity"
                  type="number"
                  min="1"
                  class="w-full border rounded-lg px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label
                  class="block text-xs font-semibold text-slate-500 mb-1 uppercase"
                  >Khusus</label
                >
                <select
                  v-model="form.gender"
                  class="w-full border rounded-lg px-4 py-2 text-sm"
                >
                  <option value="mixed">Campur</option>
                  <option value="L">Putra (L)</option>
                  <option value="P">Putri (P)</option>
                </select>
              </div>
            </div>
            <div>
              <label
                class="block text-xs font-semibold text-slate-500 mb-1 uppercase"
                >Keterangan</label
              >
              <textarea
                v-model="form.description"
                rows="2"
                class="w-full border rounded-lg px-4 py-2 text-sm"
              ></textarea>
            </div>
          </div>
          <div
            class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3"
          >
            <button
              @click="closeModal"
              class="px-4 py-2 rounded-lg border text-sm hover:bg-white"
            >
              Batal
            </button>
            <button
              @click="submitForm"
              :disabled="saving"
              class="px-4 py-2 rounded-lg bg-[#602515] text-white text-sm hover:bg-[#4a1d10]"
            >
              {{ saving ? "Menyimpan..." : "Simpan" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Inpatient Details & Medical History Modal (Beds Click) -->
    <Teleport to="body">
      <div
        v-if="detailModal.show"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          @click="detailModal.show = false"
        ></div>
        <div
          class="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden animate-fade-in-up relative z-10 flex flex-col max-h-[90vh]"
        >
          <!-- Header -->
          <div
            class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"
          >
            <div class="flex items-center gap-3">
              <div class="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <Icon icon="solar:hospital-bold-duotone" class="text-2xl animate-pulse" />
              </div>
              <div>
                <h3 class="font-bold text-slate-800">Detail Pasien & Riwayat Medis</h3>
                <p class="text-xs text-slate-500 mt-0.5">
                  {{ detailModal.inpatient?.student?.fullName || detailModal.inpatient?.patientName }} • 
                  {{ detailModal.inpatient?.roomName || "No Room" }} - Bed {{ detailModal.inpatient?.bedNumber }}
                </p>
              </div>
            </div>
            <button
              @click="detailModal.show = false"
              class="text-slate-400 hover:text-slate-600 transition"
            >
              <Icon icon="solar:close-circle-bold" class="text-xl" />
            </button>
          </div>

          <!-- Tabs Navigation -->
          <div class="flex border-b border-slate-100 px-6 bg-slate-50/20">
            <button
              @click="detailModal.activeTab = 'details'"
              class="py-3 px-4 text-sm font-semibold border-b-2 -mb-px transition-colors"
              :class="
                detailModal.activeTab === 'details'
                  ? 'border-[#602515] text-[#602515]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              "
            >
              Rincian Rawat Inap
            </button>
            <button
              @click="detailModal.activeTab = 'history'"
              class="py-3 px-4 text-sm font-semibold border-b-2 -mb-px transition-colors"
              :class="
                detailModal.activeTab === 'history'
                  ? 'border-[#602515] text-[#602515]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              "
            >
              Riwayat Medis / Pemeriksaan
            </button>
          </div>

          <!-- Content -->
          <div class="p-6 overflow-y-auto flex-1 bg-slate-50/30">
            <!-- Loading State -->
            <div v-if="detailModal.loading" class="flex flex-col items-center justify-center py-12 gap-3">
              <div class="w-10 h-10 border-4 border-[#602515] border-t-transparent rounded-full animate-spin"></div>
              <p class="text-sm text-slate-500 font-medium">Memuat data pasien...</p>
            </div>

            <template v-else>
              <!-- TAB 1: DETAILS -->
              <div v-if="detailModal.activeTab === 'details'" class="space-y-6">
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                    <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Rawat Inap</h4>
                    <div class="flex items-center justify-between">
                      <span
                        class="px-2.5 py-1 rounded-lg text-xs font-bold border uppercase"
                        :class="{
                          'bg-amber-50 text-amber-700 border-amber-100': detailModal.inpatient?.status === 'admitted',
                          'bg-slate-100 text-slate-600 border-slate-200': detailModal.inpatient?.status === 'discharged',
                          'bg-blue-50 text-blue-700 border-blue-100': detailModal.inpatient?.status === 'transferred',
                        }"
                      >
                        {{
                          detailModal.inpatient?.status === 'admitted'
                            ? 'Dalam Perawatan'
                            : detailModal.inpatient?.status === 'discharged'
                              ? 'Sudah Pulang'
                              : detailModal.inpatient?.status
                        }}
                      </span>
                    </div>
                    <div class="text-xs text-slate-500 space-y-1">
                      <div class="flex justify-between">
                        <span>Tgl Masuk:</span>
                        <span class="font-semibold text-slate-700">{{ formatDate(detailModal.inpatient?.admissionDate) }} ({{ detailModal.inpatient?.admissionTime || '-' }})</span>
                      </div>
                      <div v-if="detailModal.inpatient?.dischargeDate" class="flex justify-between">
                        <span>Tgl Keluar:</span>
                        <span class="font-semibold text-slate-700">{{ formatDate(detailModal.inpatient?.dischargeDate) }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                    <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Lokasi Kamar & Bed</h4>
                    <div class="flex items-center gap-2 text-slate-700 font-bold">
                      <Icon icon="solar:bed-bold-duotone" class="text-amber-600 text-lg" />
                      <span>{{ detailModal.inpatient?.roomName || 'No Room' }}</span>
                    </div>
                    <div class="text-xs text-slate-500 space-y-1">
                      <div class="flex justify-between">
                        <span>Nomor Bed:</span>
                        <span class="font-semibold text-slate-700">Bed {{ detailModal.inpatient?.bedNumber || '-' }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Tipe Pasien:</span>
                        <span class="font-semibold text-slate-700 capitalize">{{ detailModal.inpatient?.patientType === 'student' ? 'Santri' : detailModal.inpatient?.patientType === 'teacher' ? 'Guru' : 'Umum' }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Diagnosis Card -->
                <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2">
                  <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Icon icon="solar:notes-bold-duotone" class="text-slate-400 text-sm" />
                    Diagnosa Awal
                  </h4>
                  <p class="text-sm text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                    {{ detailModal.inpatient?.diagnosis || "Tidak ada diagnosa awal tercatat" }}
                  </p>
                </div>

                <!-- Notes Card -->
                <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2">
                  <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Icon icon="solar:document-text-bold-duotone" class="text-slate-400 text-sm" />
                    Catatan Medis & Tindak Lanjut
                  </h4>
                  <p class="text-sm text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100 min-h-[4rem]">
                    {{ detailModal.inpatient?.notes || "Tidak ada catatan tambahan" }}
                  </p>
                </div>
              </div>

              <!-- TAB 2: MEDICAL HISTORY -->
              <div v-else-if="detailModal.activeTab === 'history'" class="space-y-4">
                <!-- Empty State -->
                <div
                  v-if="detailModal.examinations.length === 0"
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
                    v-for="(exam, i) in detailModal.examinations"
                    :key="i"
                    class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                  >
                    <!-- Examination Card Header -->
                    <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start gap-4">
                      <div>
                        <h5 class="font-bold text-slate-800 text-sm">
                          {{ exam.diagnosis || "Pemeriksaan Umum" }}
                        </h5>
                        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
                          <span class="flex items-center gap-1">
                            <Icon icon="solar:calendar-date-bold-duotone" class="text-slate-400 text-xs" />
                            {{ formatDate(exam.date || exam.examinationDate) }}
                          </span>
                          <span v-if="exam.examinerName" class="flex items-center gap-1 border-l border-slate-200 pl-3">
                            <Icon icon="solar:user-bold-duotone" class="text-slate-400 text-xs" />
                            Pemeriksa: {{ exam.examinerName }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Examination Details Content -->
                    <div class="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div class="space-y-3">
                        <div v-if="exam.complaint || exam.symptoms" class="text-[11px]">
                          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Keluhan / Gejala</p>
                          <p class="text-slate-700 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                            {{ exam.complaint || exam.symptoms }}
                          </p>
                        </div>
                        
                        <div v-if="exam.treatment" class="text-[11px]">
                          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tindakan Medis</p>
                          <p class="text-slate-700 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                            {{ exam.treatment }}
                          </p>
                        </div>

                        <div v-if="exam.prescribedMedicines" class="text-[11px]">
                          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Resep Obat</p>
                          <p class="text-slate-700 leading-relaxed bg-emerald-50/30 p-2 rounded-lg border border-emerald-100 text-emerald-800">
                            {{ exam.prescribedMedicines }}
                          </p>
                        </div>
                      </div>

                      <!-- Vitals Card inside history -->
                      <div
                        v-if="
                          exam.temperature ||
                          exam.bloodPressure ||
                          exam.weight ||
                          exam.height ||
                          exam.heartRate ||
                          exam.respiratoryRate
                        "
                        class="bg-slate-50/50 p-3 rounded-xl border border-slate-100 self-start"
                      >
                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Icon icon="solar:heart-pulse-bold-duotone" class="text-slate-400" />
                          Tanda Vital & Fisik
                        </p>
                        <div class="grid grid-cols-2 gap-2 text-xs">
                          <div v-if="exam.temperature" class="bg-white p-1.5 rounded-lg border border-slate-100">
                            <span class="text-[9px] text-slate-400 block">Suhu</span>
                            <span class="font-bold text-slate-700">{{ exam.temperature }} °C</span>
                          </div>
                          <div v-if="exam.bloodPressure" class="bg-white p-1.5 rounded-lg border border-slate-100">
                            <span class="text-[9px] text-slate-400 block">TD</span>
                            <span class="font-bold text-slate-700">{{ exam.bloodPressure }}</span>
                          </div>
                          <div v-if="exam.heartRate" class="bg-white p-1.5 rounded-lg border border-slate-100">
                            <span class="text-[9px] text-slate-400 block">Nadi</span>
                            <span class="font-bold text-slate-700">{{ exam.heartRate }} bpm</span>
                          </div>
                          <div v-if="exam.weight" class="bg-white p-1.5 rounded-lg border border-slate-100">
                            <span class="text-[9px] text-slate-400 block">Berat</span>
                            <span class="font-bold text-slate-700">{{ exam.weight }} kg</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

          </div>

          <!-- Footer -->
          <div
            class="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end"
          >
            <button
              @click="detailModal.show = false"
              class="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 transition text-sm font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <ConfirmModal
      :isOpen="confirm.show"
      :loading="saving"
      title="Hapus Ruangan?"
      message="Yakin ingin menghapus ruangan ini?"
      type="danger"
      @confirm="deleteItem"
      @cancel="confirm.show = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import DataTable from "@/components/ui/DataTable.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import { request } from "@/services/api";

const rooms = ref([]);
const loading = ref(false);
const saving = ref(false);
const search = ref("");
const viewMode = ref("table"); // 'table' | 'card'

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

const modal = reactive({ show: false, mode: "create" });
const confirm = reactive({ show: false, item: null });
const form = reactive({
  id: null,
  name: "",
  capacity: 1,
  gender: "mixed",
  description: "",
});

const detailModal = reactive({
  show: false,
  activeTab: "details",
  loading: false,
  inpatient: null,
  examinations: [],
});

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID");
}

async function showOccupantDetail(room, bedNumber) {
  detailModal.loading = true;
  detailModal.show = true;
  detailModal.activeTab = "details";
  detailModal.inpatient = null;
  detailModal.examinations = [];

  try {
    const res = await request("/api/clinic/inpatients");
    const activeList = res.data || [];
    const occupant = activeList.find(
      (p) =>
        p.roomId === room.id &&
        Number(p.bedNumber) === Number(bedNumber) &&
        p.status === "admitted"
    );

    if (occupant) {
      occupant.roomName = room.name;
      detailModal.inpatient = occupant;

      // Fetch exams
      const examRes = await request(`/api/clinic/examinations?clinicPatientId=${occupant.clinicPatientId}`);
      detailModal.examinations = examRes.data || [];
    } else {
      detailModal.show = false;
      alert("Detail pasien tidak ditemukan.");
    }
  } catch (e) {
    console.error(e);
  } finally {
    detailModal.loading = false;
  }
}

const columns = [
  { label: "Nama Ruangan", field: "name", sortable: true },
  { label: "Kapasitas", field: "capacity" },
  { label: "Khusus", field: "gender" },
  { label: "Keterangan", field: "description" },
  { label: "Aksi", field: "actions", align: "right" },
];

const filteredRooms = computed(() => {
  let result = rooms.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    result = result.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q),
    );
  }
  return result;
});

const paginatedRooms = computed(() => {
  const start = (pagination.page - 1) * pagination.limit;
  const end = start + pagination.limit;
  return filteredRooms.value.slice(start, end);
});

// Update pagination total when filter changes
watch(filteredRooms, (newVal) => {
  pagination.total = newVal.length;
  pagination.totalPages = Math.ceil(newVal.length / pagination.limit);
  // Reset to page 1 if current page is out of bounds
  if (pagination.page > pagination.totalPages && pagination.totalPages > 0) {
    pagination.page = 1;
  }
});

function onPageChange(page) {
  pagination.page = page;
}

function onLimitChange(limit) {
  pagination.limit = limit;
  pagination.totalPages = Math.ceil(pagination.total / pagination.limit);
}

async function fetchRooms() {
  loading.value = true;
  try {
    const res = await request("/api/clinic/rooms");
    rooms.value = res.data || [];
    // Initialize pagination
    pagination.total = rooms.value.length;
    pagination.totalPages = Math.ceil(rooms.value.length / pagination.limit);
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function submitForm() {
  saving.value = true;
  try {
    const url =
      modal.mode === "create"
        ? "/api/clinic/rooms"
        : `/api/clinic/rooms/${form.id}`;
    const method = modal.mode === "create" ? "POST" : "PUT";
    await request(url, { method, body: form });
    await fetchRooms();
    closeModal();
  } catch (e) {
    alert(e.message);
  } finally {
    saving.value = false;
  }
}

async function deleteItem() {
  saving.value = true;
  try {
    await request(`/api/clinic/rooms/${confirm.item.id}`, { method: "DELETE" });
    await fetchRooms();
    confirm.show = false;
  } catch (e) {
    alert(e.message);
  } finally {
    saving.value = false;
  }
}

function openCreate() {
  modal.mode = "create";
  modal.show = true;
  Object.assign(form, {
    id: null,
    name: "",
    capacity: 2,
    gender: "mixed",
    description: "",
  });
}

function openEdit(item) {
  modal.mode = "edit";
  modal.show = true;
  Object.assign(form, { ...item });
}

function closeModal() {
  modal.show = false;
}

function confirmDelete(item) {
  confirm.item = item;
  confirm.show = true;
}

onMounted(fetchRooms);
</script>
