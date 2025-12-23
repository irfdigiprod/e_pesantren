<template>
  <div class="p-6">
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4"
    >
      <div>
        <h1 class="text-xl font-semibold text-slate-800">Nilai</h1>
        <p class="text-sm text-slate-500">Kelola nilai santri.</p>
      </div>
      <button
        @click="openCreate"
        :disabled="saving"
        class="px-3 py-2 rounded-lg border text-sm"
        :style="btnPrimaryOutline"
      >
        + Tambah Nilai
      </button>
    </div>

    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <table class="min-w-full table-auto">
        <thead class="bg-slate-50 text-slate-600 text-sm">
          <tr>
            <th class="px-4 py-3 text-left">#</th>
            <th class="px-4 py-3 text-left">Santri</th>
            <th class="px-4 py-3 text-left">Mapel</th>
            <th class="px-4 py-3 text-left">Tipe</th>
            <th class="px-4 py-3 text-left">Nilai</th>
            <th class="px-4 py-3 text-left">Semester</th>
            <th class="px-4 py-3 text-left">Aksi</th>
          </tr>
        </thead>
        <tbody class="text-sm text-slate-700">
          <tr v-for="(g, idx) in grades" :key="g.id" class="border-t">
            <td class="px-4 py-3">{{ idx + 1 }}</td>
            <td class="px-4 py-3 font-medium">
              {{ g.student?.fullName || g.studentId }}
            </td>
            <td class="px-4 py-3">{{ g.subject?.name || g.subjectId }}</td>
            <td class="px-4 py-3">{{ g.type || "-" }}</td>
            <td class="px-4 py-3">{{ g.score }}</td>
            <td class="px-4 py-3">{{ g.semester || "-" }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button
                  @click="openEdit(g)"
                  class="px-2 py-1 rounded border text-xs"
                >
                  Edit
                </button>
                <button
                  @click="confirmDelete(g)"
                  class="px-2 py-1 rounded border text-xs"
                >
                  Hapus
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="grades.length === 0">
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
            {{ modal.mode === "create" ? "Tambah" : "Edit" }} Nilai
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
              <label class="text-xs text-slate-500">ID Mapel *</label
              ><input
                v-model="form.subjectId"
                type="number"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Tipe Nilai</label
              ><select
                v-model="form.type"
                class="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="quiz">Quiz</option>
                <option value="uts">UTS</option>
                <option value="uas">UAS</option>
                <option value="tugas">Tugas</option>
              </select>
            </div>
            <div>
              <label class="text-xs text-slate-500">Nilai *</label
              ><input
                v-model="form.score"
                type="number"
                class="w-full border rounded px-3 py-2 text-sm"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Semester</label
              ><input
                v-model="form.semester"
                class="w-full border rounded px-3 py-2 text-sm"
                placeholder="Ganjil/Genap"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Tahun Ajaran</label
              ><input
                v-model="form.academicYear"
                class="w-full border rounded px-3 py-2 text-sm"
                placeholder="2024/2025"
              />
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
        <h3 class="font-medium">Hapus Nilai</h3>
        <p class="text-sm text-slate-600 mt-2">Yakin hapus nilai ini?</p>
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
import { academicApi } from "@/services/api.js";

const btnPrimary = { background: "#602515", color: "#fff" };
const btnPrimaryOutline = { borderColor: "#602515" };
const btnSecondary = { background: "#f8ae19", color: "#fff" };

const grades = ref([]);
const loading = ref(false);
const saving = ref(false);

const modal = reactive({ show: false, mode: "create", error: "" });
const form = reactive({
  id: null,
  studentId: "",
  subjectId: "",
  type: "quiz",
  score: "",
  semester: "",
  academicYear: "",
});
const confirm = reactive({ show: false, item: null });

async function fetchData() {
  loading.value = true;
  try {
    const res = await academicApi.getGrades();
    grades.value = Array.isArray(res?.data) ? res.data : [];
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
    if (!form.studentId || !form.subjectId || !form.score) {
      modal.error = "ID Santri, Mapel, dan Nilai wajib diisi";
      return;
    }
    const payload = {
      studentId: parseInt(form.studentId),
      subjectId: parseInt(form.subjectId),
      type: form.type,
      score: parseFloat(form.score),
      semester: form.semester || undefined,
      academicYear: form.academicYear || undefined,
    };
    if (modal.mode === "edit" && form.id) {
      await academicApi.updateGrade(form.id, payload);
    } else {
      await academicApi.createGrade(payload);
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
    await academicApi.deleteGrade(confirm.item.id);
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
    subjectId: "",
    type: "quiz",
    score: "",
    semester: "",
    academicYear: "",
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
