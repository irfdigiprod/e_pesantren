<template>
  <div class="p-6">
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4"
    >
      <div>
        <h1 class="text-xl font-semibold text-slate-800">Absensi Guru</h1>
        <p class="text-sm text-slate-500">
          Kelola check-in dan check-out guru.
        </p>
      </div>
      <div class="flex gap-2">
        <button
          @click="openCheckIn"
          :disabled="saving"
          class="px-3 py-2 rounded-lg text-sm text-white"
          :style="btnSecondary"
        >
          Check In
        </button>
        <button
          @click="openCheckOut"
          :disabled="saving"
          class="px-3 py-2 rounded-lg border text-sm"
          :style="btnPrimaryOutline"
        >
          Check Out
        </button>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <table class="min-w-full table-auto">
        <thead class="bg-slate-50 text-slate-600 text-sm">
          <tr>
            <th class="px-4 py-3 text-left">#</th>
            <th class="px-4 py-3 text-left">Guru</th>
            <th class="px-4 py-3 text-left">Tanggal</th>
            <th class="px-4 py-3 text-left">Check In</th>
            <th class="px-4 py-3 text-left">Check Out</th>
            <th class="px-4 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody class="text-sm text-slate-700">
          <tr v-for="(a, idx) in attendances" :key="a.id" class="border-t">
            <td class="px-4 py-3">{{ idx + 1 }}</td>
            <td class="px-4 py-3 font-medium">
              {{ a.teacher?.fullName || a.teacherId }}
            </td>
            <td class="px-4 py-3">{{ a.date }}</td>
            <td class="px-4 py-3">{{ a.checkInTime || "-" }}</td>
            <td class="px-4 py-3">{{ a.checkOutTime || "-" }}</td>
            <td class="px-4 py-3">
              <span
                class="px-2 py-1 rounded text-xs"
                :class="{
                  'bg-green-100 text-green-800': a.status === 'present',
                  'bg-yellow-100 text-yellow-800': a.status === 'late',
                  'bg-red-100 text-red-800': a.status === 'absent',
                }"
                >{{ a.status }}</span
              >
            </td>
          </tr>
          <tr v-if="attendances.length === 0">
            <td colspan="6" class="px-4 py-6 text-center">Data kosong</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Check In Modal -->
    <div
      v-if="modal.show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        class="bg-white w-full max-w-md rounded-lg shadow-lg overflow-auto max-h-[90vh]"
      >
        <div class="p-4 border-b flex justify-between">
          <h3 class="font-medium">
            {{ modal.mode === "checkin" ? "Check In" : "Check Out" }}
          </h3>
          <button @click="closeModal">✕</button>
        </div>
        <div class="p-4 space-y-3">
          <div>
            <label class="text-xs text-slate-500">ID Guru *</label
            ><input
              v-model="form.teacherId"
              type="number"
              class="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div v-if="modal.mode === 'checkin'">
            <label class="text-xs text-slate-500">Waktu Check In</label>
            <input
              v-model="form.checkInTime"
              type="time"
              class="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div v-else>
            <label class="text-xs text-slate-500">Waktu Check Out</label>
            <input
              v-model="form.checkOutTime"
              type="time"
              class="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="text-xs text-slate-500">Catatan</label
            ><input
              v-model="form.notes"
              class="w-full border rounded px-3 py-2 text-sm"
            />
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

    <div v-if="loading" class="mt-4 text-sm text-slate-500">Memuat...</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { attendanceApi } from "@/services/api.js";

const btnPrimaryOutline = { borderColor: "#602515" };
const btnSecondary = { background: "#f8ae19", color: "#fff" };

const attendances = ref([]);
const loading = ref(false);
const saving = ref(false);

const modal = reactive({ show: false, mode: "checkin", error: "" });
const form = reactive({
  teacherId: "",
  checkInTime: "",
  checkOutTime: "",
  notes: "",
});

async function fetchData() {
  loading.value = true;
  try {
    const res = await attendanceApi.getTeacherAttendance();
    attendances.value = Array.isArray(res?.data) ? res.data : [];
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
    if (!form.teacherId) {
      modal.error = "ID Guru wajib diisi";
      return;
    }
    const payload = {
      teacherId: parseInt(form.teacherId),
      notes: form.notes || undefined,
    };
    if (modal.mode === "checkin") {
      payload.checkInTime =
        form.checkInTime || new Date().toTimeString().slice(0, 5);
      await attendanceApi.teacherCheckIn(payload);
    } else {
      payload.checkOutTime =
        form.checkOutTime || new Date().toTimeString().slice(0, 5);
      await attendanceApi.teacherCheckOut(payload);
    }
    await fetchData();
    closeModal();
  } catch (e) {
    modal.error = e.message || "Gagal menyimpan";
  } finally {
    saving.value = false;
  }
}

function openCheckIn() {
  modal.show = true;
  modal.mode = "checkin";
  modal.error = "";
  Object.assign(form, {
    teacherId: "",
    checkInTime: new Date().toTimeString().slice(0, 5),
    checkOutTime: "",
    notes: "",
  });
}
function openCheckOut() {
  modal.show = true;
  modal.mode = "checkout";
  modal.error = "";
  Object.assign(form, {
    teacherId: "",
    checkInTime: "",
    checkOutTime: new Date().toTimeString().slice(0, 5),
    notes: "",
  });
}
function closeModal() {
  modal.show = false;
}

onMounted(fetchData);
</script>
