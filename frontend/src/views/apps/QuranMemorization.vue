<template>
  <div class="p-6">
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4"
    >
      <div>
        <h1 class="text-xl font-semibold text-slate-800">Hafalan Al-Quran</h1>
        <p class="text-sm text-slate-500">Kelola catatan hafalan santri.</p>
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
      <table class="min-w-full table-auto hidden md:table">
        <thead class="bg-slate-50 text-slate-600 text-sm">
          <tr>
            <th class="px-4 py-3 text-left">#</th>
            <th class="px-4 py-3 text-left">Santri</th>
            <th class="px-4 py-3 text-left">Surah</th>
            <th class="px-4 py-3 text-left">Ayat</th>
            <th class="px-4 py-3 text-left">Juz</th>
            <th class="px-4 py-3 text-left">Status</th>
            <th class="px-4 py-3 text-left">Tanggal</th>
            <th class="px-4 py-3 text-left">Aksi</th>
          </tr>
        </thead>
        <tbody class="text-sm text-slate-700">
          <tr v-for="(m, idx) in memorizations" :key="m.id" class="border-t">
            <td class="px-4 py-3">{{ idx + 1 }}</td>
            <td class="px-4 py-3">{{ m.student?.fullName || m.studentId }}</td>
            <td class="px-4 py-3">{{ m.surahName || "-" }}</td>
            <td class="px-4 py-3">{{ m.fromAyah }} - {{ m.toAyah }}</td>
            <td class="px-4 py-3">{{ m.juz || "-" }}</td>
            <td class="px-4 py-3">
              <span
                class="px-2 py-1 rounded text-xs"
                :class="{
                  'bg-green-100 text-green-800': m.status === 'passed',
                  'bg-yellow-100 text-yellow-800': m.status === 'pending',
                  'bg-red-100 text-red-800': m.status === 'failed',
                }"
                >{{ m.status }}</span
              >
            </td>
            <td class="px-4 py-3">{{ m.date || "-" }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button
                  @click="openEdit(m)"
                  class="px-2 py-1 rounded border text-xs"
                >
                  Edit
                </button>
                <button
                  @click="confirmDelete(m)"
                  class="px-2 py-1 rounded border text-xs"
                >
                  Hapus
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="memorizations.length === 0">
            <td colspan="8" class="px-4 py-6 text-center">Data kosong</td>
          </tr>
        </tbody>
      </table>

      <div class="md:hidden divide-y">
        <div v-for="m in memorizations" :key="m.id" class="p-4">
          <div class="font-medium">
            {{ m.student?.fullName || m.studentId }}
          </div>
          <div class="text-xs text-slate-500">
            {{ m.surahName }} ({{ m.fromAyah }}-{{ m.toAyah }}) • Juz
            {{ m.juz }}
          </div>
          <div class="mt-2 flex gap-2">
            <button
              @click="openEdit(m)"
              class="px-2 py-1 rounded border text-xs"
            >
              Edit
            </button>
            <button
              @click="confirmDelete(m)"
              class="px-2 py-1 rounded border text-xs"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div
      v-if="modal.show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        class="bg-white w-full max-w-lg rounded-lg shadow-lg overflow-auto max-h-[90vh]"
      >
        <div class="p-4 border-b flex justify-between">
          <h3 class="font-medium">
            {{ modal.mode === "create" ? "Tambah Hafalan" : "Edit Hafalan" }}
          </h3>
          <button @click="closeModal">✕</button>
        </div>
        <div class="p-4 space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2">
              <label class="text-xs text-slate-500">ID Santri *</label
              ><input
                v-model="form.studentId"
                type="number"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Nama Surah</label
              ><input
                v-model="form.surahName"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Juz</label
              ><input
                v-model="form.juz"
                type="number"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Dari Ayat</label
              ><input
                v-model="form.fromAyah"
                type="number"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Sampai Ayat</label
              ><input
                v-model="form.toAyah"
                type="number"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Status</label
              ><select
                v-model="form.status"
                class="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label class="text-xs text-slate-500">Tanggal</label
              ><input
                v-model="form.date"
                type="date"
                class="w-full border rounded px-3 py-2 text-sm"
              />
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
        <h3 class="font-medium">Hapus Hafalan</h3>
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
import { quranApi } from "@/services/api.js";

const btnPrimary = { background: "#602515", color: "#fff" };
const btnPrimaryOutline = { borderColor: "#602515" };
const btnSecondary = { background: "#f8ae19", color: "#fff" };

const memorizations = ref([]);
const loading = ref(false);
const saving = ref(false);

const modal = reactive({ show: false, mode: "create", error: "" });
const form = reactive({
  id: null,
  studentId: "",
  surahName: "",
  juz: "",
  fromAyah: "",
  toAyah: "",
  status: "pending",
  date: "",
  notes: "",
});
const confirm = reactive({ show: false, item: null });

async function fetchData() {
  loading.value = true;
  try {
    const res = await quranApi.getAll();
    memorizations.value = Array.isArray(res?.data) ? res.data : [];
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
    if (!form.studentId) {
      modal.error = "ID Santri wajib diisi";
      return;
    }
    const payload = {
      studentId: parseInt(form.studentId),
      surahName: form.surahName,
      juz: form.juz ? parseInt(form.juz) : undefined,
      fromAyah: form.fromAyah ? parseInt(form.fromAyah) : undefined,
      toAyah: form.toAyah ? parseInt(form.toAyah) : undefined,
      status: form.status,
      date: form.date || undefined,
      notes: form.notes || undefined,
    };
    if (modal.mode === "edit" && form.id) {
      await quranApi.update(form.id, payload);
    } else {
      await quranApi.create(payload);
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
    await quranApi.delete(confirm.item.id);
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
    surahName: "",
    juz: "",
    fromAyah: "",
    toAyah: "",
    status: "pending",
    date: "",
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
