<template>
  <div class="p-6">
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4"
    >
      <div>
        <h1 class="text-xl font-semibold text-slate-800">Rawat Inap</h1>
        <p class="text-sm text-slate-500">
          Kelola data santri rawat inap di klinik.
        </p>
      </div>
      <button
        @click="openCreate"
        :disabled="saving"
        class="px-3 py-2 rounded-lg border text-sm"
        :style="btnPrimaryOutline"
      >
        + Tambah
      </button>
    </div>

    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <table class="min-w-full table-auto">
        <thead class="bg-slate-50 text-slate-600 text-sm">
          <tr>
            <th class="px-4 py-3 text-left">#</th>
            <th class="px-4 py-3 text-left">Santri</th>
            <th class="px-4 py-3 text-left">Diagnosa</th>
            <th class="px-4 py-3 text-left">Tanggal Masuk</th>
            <th class="px-4 py-3 text-left">Tanggal Keluar</th>
            <th class="px-4 py-3 text-left">Status</th>
            <th class="px-4 py-3 text-left">Aksi</th>
          </tr>
        </thead>
        <tbody class="text-sm text-slate-700">
          <tr v-for="(i, idx) in inpatients" :key="i.id" class="border-t">
            <td class="px-4 py-3">{{ idx + 1 }}</td>
            <td class="px-4 py-3 font-medium">
              {{ i.student?.fullName || i.studentId }}
            </td>
            <td class="px-4 py-3">{{ i.diagnosis || "-" }}</td>
            <td class="px-4 py-3">{{ i.admissionDate }}</td>
            <td class="px-4 py-3">{{ i.dischargeDate || "Masih rawat" }}</td>
            <td class="px-4 py-3">
              <span
                class="px-2 py-1 rounded text-xs"
                :class="{
                  'bg-yellow-100 text-yellow-800': i.status === 'admitted',
                  'bg-green-100 text-green-800': i.status === 'discharged',
                }"
                >{{ i.status }}</span
              >
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button
                  @click="openEdit(i)"
                  class="px-2 py-1 rounded border text-xs"
                >
                  Edit
                </button>
                <button
                  @click="confirmDelete(i)"
                  class="px-2 py-1 rounded border text-xs"
                >
                  Hapus
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="inpatients.length === 0">
            <td colspan="7" class="px-4 py-6 text-center">Data kosong</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="modal.show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        class="bg-white w-full max-w-lg rounded-lg shadow-lg overflow-auto max-h-[90vh]"
      >
        <div class="p-4 border-b flex justify-between">
          <h3 class="font-medium">
            {{ modal.mode === "create" ? "Tambah" : "Edit" }} Rawat Inap
          </h3>
          <button @click="closeModal">✕</button>
        </div>
        <div class="p-4 space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-slate-500">ID Santri *</label
              ><input
                v-model="form.studentId"
                type="number"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Tanggal Masuk *</label
              ><input
                v-model="form.admissionDate"
                type="date"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Tanggal Keluar</label
              ><input
                v-model="form.dischargeDate"
                type="date"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Status</label
              ><select
                v-model="form.status"
                class="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="admitted">Dirawat</option>
                <option value="discharged">Pulang</option>
              </select>
            </div>
            <div class="col-span-2">
              <label class="text-xs text-slate-500">Diagnosa</label
              ><textarea
                v-model="form.diagnosis"
                class="w-full border rounded px-3 py-2 text-sm"
                rows="2"
              ></textarea>
            </div>
            <div class="col-span-2">
              <label class="text-xs text-slate-500">Catatan</label
              ><textarea
                v-model="form.notes"
                class="w-full border rounded px-3 py-2 text-sm"
                rows="2"
              ></textarea>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="submitForm"
              :disabled="saving"
              class="px-4 py-2 rounded-lg"
              :style="btnSecondary"
            >
              {{ saving ? "Memproses..." : "Simpan" }}
            </button>
            <button @click="closeModal" class="px-4 py-2 rounded-lg border">
              Batal
            </button>
          </div>
          <div v-if="modal.error" class="text-sm text-red-600">
            {{ modal.error }}
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="confirm.show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div class="bg-white w-full max-w-md rounded-lg shadow-lg p-4">
        <h3 class="font-medium">Hapus Data</h3>
        <p class="text-sm text-slate-600 mt-2">Yakin hapus data ini?</p>
        <div class="mt-4 flex gap-2">
          <button
            @click="deleteItem"
            :disabled="saving"
            class="px-4 py-2 rounded-lg"
            :style="btnPrimary"
          >
            Ya, Hapus
          </button>
          <button @click="confirmCancel" class="px-4 py-2 rounded-lg border">
            Batal
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="mt-4 text-sm text-slate-500">Memuat...</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { clinicApi } from "@/services/api.js";

const btnPrimary = { background: "#602515", color: "#fff" };
const btnPrimaryOutline = { borderColor: "#602515" };
const btnSecondary = { background: "#f8ae19", color: "#fff" };

const inpatients = ref([]);
const loading = ref(false);
const saving = ref(false);

const modal = reactive({ show: false, mode: "create", error: "" });
const form = reactive({
  id: null,
  studentId: "",
  admissionDate: "",
  dischargeDate: "",
  status: "admitted",
  diagnosis: "",
  notes: "",
});
const confirm = reactive({ show: false, item: null });

async function fetchData() {
  loading.value = true;
  try {
    const res = await clinicApi.getInpatients();
    inpatients.value = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    alert(e.message || "Gagal memuat");
  } finally {
    loading.value = false;
  }
}

async function submitForm() {
  saving.value = true;
  modal.error = "";
  try {
    if (!form.studentId || !form.admissionDate) {
      modal.error = "ID Santri dan Tanggal Masuk wajib diisi";
      return;
    }
    const payload = {
      studentId: parseInt(form.studentId),
      admissionDate: form.admissionDate,
      dischargeDate: form.dischargeDate || undefined,
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
  } catch (e) {
    modal.error = e.message || "Gagal menyimpan";
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
  } catch (e) {
    alert(e.message || "Gagal menghapus");
  } finally {
    saving.value = false;
  }
}

function openCreate() {
  modal.show = true;
  modal.mode = "create";
  modal.error = "";
  Object.assign(form, {
    id: null,
    studentId: "",
    admissionDate: new Date().toISOString().split("T")[0],
    dischargeDate: "",
    status: "admitted",
    diagnosis: "",
    notes: "",
  });
}
function openEdit(item) {
  modal.show = true;
  modal.mode = "edit";
  modal.error = "";
  Object.assign(form, { ...item });
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
