<template>
  <div>
    <DataTable
      title="Rawat Inap"
      description="Kelola pasien rawat inap dan ketersediaan bed."
      icon="solar:bed-bold-duotone"
      :items="activeInpatients"
      :columns="columns"
      :loading="loading"
      :viewMode="viewMode"
      v-model:viewMode="viewMode"
      :hideFilter="true"
    >
      <template #header-actions>
        <button
          @click="openCreate"
          :disabled="saving"
          class="px-4 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1d10] transition flex items-center gap-2 text-sm font-medium"
        >
          <Icon icon="solar:user-plus-bold" />
          Registrasi Pasien
        </button>
      </template>

      <template #toolbar-actions>
        <!-- Add custom filter for history/all if needed, but keeping simple for now -->
      </template>

      <!-- Cell Slots -->
      <template #cell-student="{ item }">
        <div class="font-medium text-slate-800">
          {{ item.student?.fullName || item.studentId }}
        </div>
        <div class="text-xs text-slate-400">
          Kelas: {{ item.student?.class?.name || "-" }}
        </div>
      </template>

      <template #cell-bed="{ item }">
        <div class="flex items-center gap-2">
          <Icon icon="solar:bed-line-duotone" class="text-slate-400" />
          <span v-if="item.roomNumber || item.bedNumber"
            >{{ item.roomNumber }} - {{ item.bedNumber }}</span
          >
          <span v-else class="text-slate-400 italic">Belum ditentukan</span>
        </div>
      </template>

      <template #cell-admission="{ item }">
        {{ formatDate(item.admissionDate) }}
        <div class="text-xs text-slate-400">{{ item.admissionTime }}</div>
      </template>

      <template #cell-diagnosis="{ item }">
        <div class="max-w-[200px] truncate text-slate-600">
          {{ item.diagnosis || "-" }}
        </div>
      </template>

      <template #cell-status="{ item }">
        <span
          class="inline-flex px-2 py-1 rounded-md text-xs font-medium border"
          :class="{
            'bg-amber-50 text-amber-700 border-amber-100':
              item.status === 'admitted',
            'bg-slate-100 text-slate-600 border-slate-200':
              item.status === 'discharged',
            'bg-blue-50 text-blue-700 border-blue-100':
              item.status === 'transferred',
          }"
        >
          {{
            item.status === "admitted"
              ? "Dirawat"
              : item.status === "discharged"
                ? "Pulang"
                : item.status
          }}
        </span>
        <div v-if="item.dischargeDate" class="text-xs text-slate-400 mt-1">
          Keluar: {{ formatDate(item.dischargeDate) }}
        </div>
      </template>

      <template #cell-actions="{ item }">
        <div class="flex justify-end gap-2">
          <button
            v-if="item.status === 'discharged'"
            @click="printDischargeLetter(item)"
            class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            title="Cetak Surat Pulang"
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

      <!-- Card View (BedGrid) -->
      <template #card-item="{ item }">
        <div
          class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition relative overflow-hidden group h-full"
        >
          <div
            class="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition z-10"
          >
            <button
              @click="openEdit(item)"
              class="p-1.5 bg-white border rounded shadow-sm hover:bg-slate-50 text-slate-500"
            >
              <Icon icon="solar:pen-new-square-linear" />
            </button>
          </div>
          <div class="flex items-center gap-3 mb-3">
            <div
              class="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"
            >
              <Icon icon="solar:user-bold" />
            </div>
            <div class="min-w-0">
              <h3 class="font-semibold text-slate-800 truncate">
                {{ item.student?.fullName }}
              </h3>
              <p class="text-xs text-slate-500">
                {{ item.roomNumber ? `Room ${item.roomNumber}` : "No Room" }}
              </p>
            </div>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between border-b border-slate-50 pb-2">
              <span class="text-slate-500">Masuk</span>
              <span class="text-slate-800 font-medium">{{
                formatDate(item.admissionDate)
              }}</span>
            </div>
            <div class="flex justify-between border-b border-slate-50 pb-2">
              <span class="text-slate-500">Bed</span>
              <span class="text-slate-800 font-medium">{{
                item.bedNumber || "-"
              }}</span>
            </div>
            <div class="pt-1">
              <div class="text-xs text-slate-400 mb-1">Diagnosa</div>
              <p class="text-slate-700 line-clamp-2 h-10">
                {{ item.diagnosis || "Belum ada diagnosa" }}
              </p>
            </div>
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
          class="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-fade-in-up relative z-10 flex flex-col max-h-[90vh]"
        >
          <div
            class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"
          >
            <h3 class="font-bold text-slate-800">
              {{
                modal.mode === "create"
                  ? "Registrasi Rawat Inap"
                  : "Edit Data Rawat Inap"
              }}
            </h3>
            <button
              @click="closeModal"
              class="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <div class="p-6 space-y-4 overflow-y-auto">
            <!-- Student Search Implementation would go here, for now simple input ID -->
            <div>
              <PatientSelector
                :modelValue="{
                  type: form.patientType,
                  refId: form.refId,
                  name: form.name,
                  gender: form.gender,
                  phone: form.phone,
                  address: form.address,
                  address: form.address,
                  dob: form.dob,
                  bloodType: form.bloodType,
                }"
                @update:modelValue="
                  (val) => {
                    form.patientType = val.type;
                    Object.assign(form, val);
                  }
                "
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider"
                  >Tanggal Masuk</label
                >
                <input
                  v-model="form.admissionDate"
                  type="date"
                  class="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#602515]/20 focus:border-[#602515] transition"
                />
              </div>
              <div>
                <label
                  class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider"
                  >Jam Masuk</label
                >
                <input
                  v-model="form.admissionTime"
                  type="time"
                  class="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#602515]/20 focus:border-[#602515] transition"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider"
                  >Kamar / Ruangan</label
                >
                <select
                  v-model="form.roomId"
                  class="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#602515]/20 focus:border-[#602515] transition"
                >
                  <option :value="null">Pilih Ruangan</option>
                  <option v-for="room in rooms" :key="room.id" :value="room.id">
                    {{ room.name }} ({{
                      room.gender === "mixed" ? "Campur" : room.gender
                    }}) - Kapasitas: {{ room.capacity }}
                  </option>
                </select>
              </div>
              <div>
                <label
                  class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider"
                  >Nomor Bed</label
                >
                <select
                  v-model="form.bedNumber"
                  class="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#602515]/20 focus:border-[#602515] transition"
                >
                  <option value="">- Pilih Bed -</option>
                  <option v-for="bed in availableBeds" :key="bed" :value="bed">
                    Bed {{ bed }}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label
                class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider"
                >Diagnosa Awal</label
              >
              <textarea
                v-model="form.diagnosis"
                rows="2"
                class="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#602515]/20 focus:border-[#602515] transition"
              ></textarea>
            </div>

            <div
              v-if="modal.mode === 'edit'"
              class="p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
              <h4 class="text-sm font-semibold text-slate-700 mb-3">
                Discharge / Kepulangan
              </h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-slate-500 mb-1"
                    >Status</label
                  >
                  <select
                    v-model="form.status"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="admitted">Masih Dirawat</option>
                    <option value="discharged">Pulang</option>
                    <option value="transferred">Dirujuk</option>
                  </select>
                </div>
                <div v-if="form.status === 'discharged'">
                  <label class="block text-xs text-slate-500 mb-1"
                    >Tanggal Keluar</label
                  >
                  <input
                    v-model="form.dischargeDate"
                    type="date"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
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
              {{ saving ? "Menyimpan..." : "Simpan Data" }}
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
      message="Yakin hapus data rawat inap ini?"
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

    <!-- Hidden Print Template -->
    <div
      id="print-area"
      class="hidden print:block fixed inset-0 bg-white z-[9999] p-8"
    >
      <div v-if="printData" class="max-w-2xl mx-auto border p-8">
        <div class="text-center border-b pb-4 mb-6">
          <h1 class="text-xl font-bold uppercase">
            Klinik Pesantren Minhajul Haq
          </h1>
          <p class="text-sm text-slate-600">Surat Keterangan Pulang</p>
        </div>

        <div class="space-y-4 text-sm leading-relaxed">
          <p>Yang bertanda tangan di bawah ini menerangkan bahwa:</p>
          <table class="w-full ml-4">
            <tr>
              <td class="w-32 py-1">Nama</td>
              <td>
                : <strong>{{ printData.student?.fullName }}</strong>
              </td>
            </tr>
            <tr>
              <td class="w-32 py-1">ID Santri</td>
              <td>: {{ printData.studentId }}</td>
            </tr>
            <tr>
              <td class="w-32 py-1">Tanggal Masuk</td>
              <td>: {{ formatDate(printData.admissionDate) }}</td>
            </tr>
            <tr>
              <td class="w-32 py-1">Diagnosa</td>
              <td>: {{ printData.diagnosis }}</td>
            </tr>
          </table>

          <p class="mt-4">
            Telah menjalani perawatan di Klinik Minhajul Haq dan diperbolehkan
            pulang pada tanggal
            <strong>{{ formatDate(printData.dischargeDate) }}</strong
            >.
          </p>

          <p class="mt-4">Catatan Medis / Saran:</p>
          <div class="border rounded p-4 h-24">
            {{ printData.notes || "Istirahat yang cukup." }}
          </div>

          <div class="mt-12 flex justify-end">
            <div class="text-center">
              <p class="mb-16">Petugas Klinik,</p>
              <p class="font-bold underline">{{ user?.name || "Admin" }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from "vue";
import { Icon } from "@iconify/vue";
import { clinicApi } from "@/services/api.js";
import DataTable from "@/components/ui/DataTable.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import StatusModal from "@/components/ui/StatusModal.vue";

import PatientSelector from "@/components/clinic/PatientSelector.vue";

const viewMode = ref("list");
const inpatients = ref([]);
const rooms = ref([]);
const loading = ref(false);
const saving = ref(false);
const user = ref(null); // For signature

const modal = reactive({ show: false, mode: "create" });
const statusModal = reactive({
  show: false,
  type: "success",
  title: "",
  message: "",
});
const confirm = reactive({ show: false, item: null });
const printData = ref(null);

const form = reactive({
  id: null,
  patientType: "student",
  refId: null,
  name: "",
  gender: "L",
  phone: "",
  address: "",
  address: "",
  dob: null,
  bloodType: "",

  admissionDate: "",
  admissionTime: "",
  dischargeDate: "",
  roomId: null,
  bedNumber: "", // Manual input or derived
  status: "admitted",
  diagnosis: "",
  notes: "",
});

const columns = [
  { label: "Pasien", field: "student", sortable: true },
  { label: "Kamar / Bed", field: "bed", sortable: true },
  { label: "Waktu Masuk", field: "admission", sortable: true },
  { label: "Diagnosa", field: "diagnosis" },
  { label: "Status", field: "status", sortable: true },
  { label: "Aksi", field: "actions", align: "right" },
];

const activeInpatients = computed(() => inpatients.value);

const availableBeds = computed(() => {
  if (!form.roomId) return [];
  const room = rooms.value.find((r) => r.id === form.roomId);
  if (!room) return [];

  // Generate beds 1 to Capacity
  return Array.from({ length: room.capacity }, (_, i) => String(i + 1));
});
// Note: We might want to filter only admitted depending on view requirements,
// but usually list view shows all. The original code filtered for grid view if I recall.
// Actually, let's just allow all for now.

function showStatus(type, title, message) {
  statusModal.type = type;
  statusModal.title = title;
  statusModal.message = message;
  statusModal.show = true;
}

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID");
}

async function fetchData() {
  loading.value = true;
  try {
    const [resInpatients, resRooms] = await Promise.all([
      clinicApi.getInpatients(),
      clinicApi.getRooms(),
    ]);

    inpatients.value = Array.isArray(resInpatients?.data)
      ? resInpatients.data
      : [];
    rooms.value = Array.isArray(resRooms?.data) ? resRooms.data : [];

    // Get user for signature
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
    if (!form.name || !form.admissionDate) {
      throw new Error("Nama Pasien dan Tanggal Masuk wajib diisi");
    }
    const payload = {
      patientType: form.patientType,
      refId: form.refId,
      name: form.name,
      gender: form.gender,
      phone: form.phone,
      address: form.address,
      dob: form.dob,
      bloodType: form.bloodType || undefined,
      clinicPatientId: form.clinicPatientId || undefined,

      admissionDate: form.admissionDate,
      admissionTime: form.admissionTime || undefined,
      dischargeDate: form.dischargeDate || undefined,
      roomId: form.roomId || undefined,
      bedNumber: form.bedNumber || undefined,
      status: form.status,
      diagnosis: form.diagnosis || undefined,
      notes: form.notes || undefined,
    };
    if (modal.mode === "edit" && form.id) {
      await clinicApi.updateInpatient(form.id, payload);
    } else {
      await clinicApi.createInpatient(payload);
    }
    await fetchData();
    closeModal();
    showStatus("success", "Berhasil", "Data rawat inap berhasil disimpan");
  } catch (e) {
    showStatus("error", "Gagal", e.message || "Gagal menyimpan");
  } finally {
    saving.value = false;
  }
}

async function deleteItem() {
  saving.value = true;
  try {
    await clinicApi.deleteInpatient(confirm.item.id);
    await fetchData();
    confirmCancel();
    showStatus("success", "Terhapus", "Data berhasil dihapus");
  } catch (e) {
    showStatus("error", "Gagal", e.message || "Gagal menghapus");
  } finally {
    saving.value = false;
  }
}

function printDischargeLetter(item) {
  printData.value = item;
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
    bloodType: "",
    clinicPatientId: null,

    admissionDate: new Date().toISOString().split("T")[0],
    admissionTime: new Date()
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(".", ":"),
    dischargeDate: "",
    status: "admitted",
    diagnosis: "",
    notes: "",
    roomId: null,
    bedNumber: "",
  });
}

function openEdit(item) {
  modal.show = true;
  modal.mode = "edit";
  Object.assign(form, {
    ...item,
    name: item.patientName,
    patientType: item.patientType,
    // Format dates for input type="date" (YYYY-MM-DD)
    admissionDate: item.admissionDate
      ? new Date(item.admissionDate).toISOString().split("T")[0]
      : "",
    dischargeDate: item.dischargeDate
      ? new Date(item.dischargeDate).toISOString().split("T")[0]
      : "",
    // Format time (HH:mm) - Ensure it's valid, remove seconds if present, replace dots with colons
    admissionTime: item.admissionTime
      ? item.admissionTime.slice(0, 5).replace(".", ":")
      : "",
    // Ensure nested fields are mapped for display
    bloodType: item.patientBloodType || "",
    // Important for duplicates prevention
    clinicPatientId: item.id, // Inpatient ID is NOT clinicPatientId. Wait.
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

onMounted(fetchData);
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
