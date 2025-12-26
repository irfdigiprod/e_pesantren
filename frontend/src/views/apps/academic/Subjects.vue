<template>
  <div class="p-6">
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4"
    >
      <div>
        <h1 class="text-xl font-semibold text-slate-800">Mata Pelajaran</h1>
        <p class="text-sm text-slate-500">Kelola data mata pelajaran.</p>
      </div>
      <button
        @click="openCreate"
        :disabled="saving"
        class="px-3 py-2 rounded-lg border text-sm"
        :style="btnPrimaryOutline"
      >
        + Tambah Mapel
      </button>
    </div>

    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <table class="min-w-full table-auto">
        <thead class="bg-slate-50 text-slate-600 text-sm">
          <tr>
            <th class="px-4 py-3 text-left">#</th>
            <th class="px-4 py-3 text-left">Kode</th>
            <th class="px-4 py-3 text-left">Nama Mapel</th>
            <th class="px-4 py-3 text-left">Kategori</th>
            <th class="px-4 py-3 text-left">Aksi</th>
          </tr>
        </thead>
        <tbody class="text-sm text-slate-700">
          <tr v-for="(s, idx) in subjects" :key="s.id" class="border-t">
            <td class="px-4 py-3">{{ idx + 1 }}</td>
            <td class="px-4 py-3">{{ s.code || "-" }}</td>
            <td class="px-4 py-3 font-medium">{{ s.name }}</td>
            <td class="px-4 py-3">{{ s.category || "-" }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button
                  @click="openEdit(s)"
                  class="px-2 py-1 rounded border text-xs"
                >
                  Edit
                </button>
                <button
                  @click="confirmDelete(s)"
                  class="px-2 py-1 rounded border text-xs"
                >
                  Hapus
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="subjects.length === 0">
            <td colspan="5" class="px-4 py-6 text-center">Data kosong</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="modal.show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        class="bg-white w-full max-w-md rounded-lg shadow-lg overflow-auto max-h-[90vh]"
      >
        <div class="p-4 border-b flex justify-between">
          <h3 class="font-medium">
            {{ modal.mode === "create" ? "Tambah" : "Edit" }} Mapel
          </h3>
          <button @click="closeModal">✕</button>
        </div>
        <div class="p-4 space-y-3">
          <div>
            <label class="text-xs text-slate-500">Kode</label
            ><input
              v-model="form.code"
              class="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="text-xs text-slate-500">Nama Mapel *</label
            ><input
              v-model="form.name"
              class="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="text-xs text-slate-500">Kategori</label
            ><input
              v-model="form.category"
              class="w-full border rounded px-3 py-2 text-sm"
              placeholder="Umum, Agama, dll"
            />
          </div>
          <div>
            <label class="text-xs text-slate-500">Deskripsi</label
            ><textarea
              v-model="form.description"
              class="w-full border rounded px-3 py-2 text-sm"
              rows="2"
            ></textarea>
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
        <h3 class="font-medium">Hapus Mapel</h3>
        <p class="text-sm text-slate-600 mt-2">
          Yakin hapus <strong>{{ confirm.item?.name }}</strong
          >?
        </p>
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

const subjects = ref([]);
const loading = ref(true);
const saving = ref(false);

const modal = reactive({ show: false, mode: "create", error: "" });
const form = reactive({
  id: null,
  code: "",
  name: "",
  category: "",
  description: "",
});
const confirm = reactive({ show: false, item: null });

async function fetchData() {
  loading.value = true;
  try {
    const res = await academicApi.getSubjects();
    subjects.value = Array.isArray(res?.data) ? res.data : [];
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
    if (!form.name) {
      modal.error = "Nama mapel wajib diisi";
      return;
    }
    const payload = {
      code: form.code || undefined,
      name: form.name,
      category: form.category || undefined,
      description: form.description || undefined,
    };
    if (modal.mode === "edit" && form.id) {
      await academicApi.updateSubject(form.id, payload);
    } else {
      await academicApi.createSubject(payload);
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
    await academicApi.deleteSubject(confirm.item.id);
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
    code: "",
    name: "",
    category: "",
    description: "",
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
