<template>
  <div class="p-6">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4"
    >
      <div>
        <h1 class="text-xl font-semibold text-slate-800">Orang Tua / Wali</h1>
        <p class="text-sm text-slate-500">Kelola data orang tua santri.</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          @click="openCreate"
          :disabled="saving"
          class="px-3 py-2 rounded-lg border text-sm"
          :style="btnPrimaryOutline"
        >
          + Tambah
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg p-4 shadow-sm mb-4">
      <div class="flex items-center gap-4">
        <input
          v-model="searchQuery"
          @input="onSearchInput"
          placeholder="Cari nama ayah/ibu..."
          class="w-full md:w-1/3 border rounded px-3 py-2 text-sm"
        />
        <button
          @click="resetFilters"
          class="px-3 py-2 rounded-lg border text-sm"
        >
          Reset
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <table class="min-w-full table-auto hidden md:table">
        <thead class="bg-slate-50 text-slate-600 text-sm">
          <tr>
            <th class="px-4 py-3 text-left">#</th>
            <th class="px-4 py-3 text-left">Nama Ayah</th>
            <th class="px-4 py-3 text-left">Nama Ibu</th>
            <th class="px-4 py-3 text-left">Phone</th>
            <th class="px-4 py-3 text-left">Alamat</th>
            <th class="px-4 py-3 text-left">Aksi</th>
          </tr>
        </thead>

        <tbody class="text-sm text-slate-700">
          <tr v-for="(p, idx) in parents" :key="p.id" class="border-t">
            <td class="px-4 py-3">
              {{ (pagination.page - 1) * limitNumber + idx + 1 }}
            </td>
            <td class="px-4 py-3">{{ p.fatherName || "-" }}</td>
            <td class="px-4 py-3">{{ p.motherName || "-" }}</td>
            <td class="px-4 py-3">{{ p.phone || "-" }}</td>
            <td class="px-4 py-3 max-w-xs truncate">{{ p.address || "-" }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <button
                  @click="openEdit(p)"
                  class="px-2 py-1 rounded border text-xs"
                  :disabled="saving"
                >
                  Edit
                </button>
                <button
                  @click="confirmDelete(p)"
                  class="px-2 py-1 rounded border text-xs"
                  :disabled="saving"
                >
                  Hapus
                </button>
                <button
                  @click="openView(p)"
                  class="px-2 py-1 rounded border text-xs"
                >
                  Lihat
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="parents.length === 0">
            <td class="px-4 py-6 text-center" colspan="6">Data kosong</td>
          </tr>
        </tbody>
      </table>

      <!-- Mobile card list -->
      <div class="md:hidden divide-y">
        <div v-for="p in parents" :key="p.id" class="p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-medium text-slate-800">
                {{ p.fatherName || "N/A" }}
              </div>
              <div class="text-xs text-slate-500">
                Ibu: {{ p.motherName || "N/A" }}
              </div>
              <div class="text-xs text-slate-500 mt-1">
                {{ p.phone || "-" }}
              </div>
            </div>
            <div class="flex gap-1">
              <button
                @click="openEdit(p)"
                class="px-2 py-1 rounded border text-xs"
                :disabled="saving"
              >
                Edit
              </button>
              <button
                @click="confirmDelete(p)"
                class="px-2 py-1 rounded border text-xs"
                :disabled="saving"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
        <div v-if="parents.length === 0" class="p-4 text-center text-slate-500">
          Data kosong
        </div>
      </div>

      <!-- Pagination -->
      <div
        class="p-4 flex flex-col md:flex-row items-center justify-between gap-3 border-t"
      >
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-600">Menampilkan</span>
          <select
            v-model="limit"
            class="border rounded px-2 py-1 text-sm"
            @change="changeLimit"
          >
            <option v-for="o in limitOptions" :key="o" :value="o">
              {{ o }}
            </option>
          </select>
          <span class="text-sm text-slate-600">per halaman</span>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="changePage(pagination.page - 1)"
            :disabled="pagination.page <= 1 || loading"
            class="px-3 py-1 rounded border"
          >
            Prev
          </button>
          <span class="text-sm text-slate-600"
            >Halaman {{ pagination.page }} dari
            {{ pagination.total_pages }}</span
          >
          <button
            @click="changePage(pagination.page + 1)"
            :disabled="pagination.page >= pagination.total_pages || loading"
            class="px-3 py-1 rounded border"
          >
            Next
          </button>
        </div>

        <div class="text-sm text-slate-600">Total: {{ pagination.total }}</div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="modal.show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        class="bg-white w-full max-w-2xl rounded-lg shadow-lg overflow-auto max-h-[90vh]"
      >
        <div class="p-4 border-b flex items-center justify-between">
          <h3 class="font-medium">
            {{
              modal.mode === "create" ? "Tambah Orang Tua" : "Edit Orang Tua"
            }}
          </h3>
          <button @click="closeModal" class="px-2 py-1">✕</button>
        </div>

        <div class="p-4 space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-slate-500">Nama Ayah</label>
              <input
                v-model="form.fatherName"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Nama Ibu</label>
              <input
                v-model="form.motherName"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Pekerjaan Ayah</label>
              <input
                v-model="form.fatherOccupation"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Pekerjaan Ibu</label>
              <input
                v-model="form.motherOccupation"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Phone *</label>
              <input
                v-model="form.phone"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Email</label>
              <input
                v-model="form.email"
                type="email"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div class="md:col-span-2">
              <label class="text-xs text-slate-500">Alamat</label>
              <input
                v-model="form.address"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div class="md:col-span-2" v-if="modal.mode === 'create'">
              <label class="text-xs text-slate-500">Password</label>
              <input
                v-model="form.password"
                type="password"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="submitForm"
              :disabled="saving"
              class="px-4 py-2 rounded-lg"
              :style="btnSecondary"
            >
              <span v-if="!saving">{{
                modal.mode === "create" ? "Tambah" : "Simpan"
              }}</span>
              <span v-else>Memproses...</span>
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

    <!-- Confirm Delete Modal -->
    <div
      v-if="confirm.show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        class="bg-white w-full max-w-md rounded-lg shadow-lg overflow-hidden"
      >
        <div class="p-4">
          <h3 class="font-medium">Hapus Orang Tua</h3>
          <p class="text-sm text-slate-600 mt-2">
            Anda yakin akan menghapus
            <strong>{{
              confirm.item?.fatherName || confirm.item?.motherName
            }}</strong
            >?
          </p>
          <div class="mt-4 flex gap-2">
            <button
              @click="deleteParent"
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
    </div>

    <!-- View Modal -->
    <div
      v-if="view.show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        class="bg-white w-full max-w-lg rounded-lg shadow-lg overflow-auto max-h-[90vh]"
      >
        <div class="p-4 border-b flex items-center justify-between">
          <h3 class="font-medium">Detail Orang Tua</h3>
          <button @click="viewClose" class="px-2 py-1">✕</button>
        </div>
        <div class="p-4 space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div class="text-xs text-slate-500">Nama Ayah</div>
              <div class="font-medium">{{ view.item.fatherName || "-" }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500">Nama Ibu</div>
              <div class="font-medium">{{ view.item.motherName || "-" }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500">Pekerjaan Ayah</div>
              <div class="font-medium">
                {{ view.item.fatherOccupation || "-" }}
              </div>
            </div>
            <div>
              <div class="text-xs text-slate-500">Pekerjaan Ibu</div>
              <div class="font-medium">
                {{ view.item.motherOccupation || "-" }}
              </div>
            </div>
            <div>
              <div class="text-xs text-slate-500">Phone</div>
              <div class="font-medium">{{ view.item.phone || "-" }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500">Email</div>
              <div class="font-medium">{{ view.item.email || "-" }}</div>
            </div>
            <div class="md:col-span-2">
              <div class="text-xs text-slate-500">Alamat</div>
              <div class="font-medium">{{ view.item.address || "-" }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="mt-4 text-sm text-slate-500">Memuat data...</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { parentsApi } from "@/services/api.js";

const primary = "#602515";
const secondary = "#f8ae19";
const btnPrimary = { background: primary, color: "#fff" };
const btnPrimaryOutline = { borderColor: primary };
const btnSecondary = { background: secondary, color: "#fff" };

const parents = ref([]);
const loading = ref(false);
const saving = ref(false);

const limitOptions = ["5", "10", "20", "50"];
const limit = ref("20");
const pagination = reactive({ page: 1, limit: "20", total: 0, total_pages: 1 });

const searchQuery = ref("");
let searchTimer = null;

const modal = reactive({ show: false, mode: "create", error: "" });
const form = reactive({
  id: null,
  fatherName: "",
  motherName: "",
  fatherOccupation: "",
  motherOccupation: "",
  phone: "",
  address: "",
  email: "",
  password: "",
});
const confirm = reactive({ show: false, item: null });
const view = reactive({ show: false, item: {} });

const limitNumber = computed(() => parseInt(limit.value || "20", 10));

async function fetchParents(page = 1) {
  loading.value = true;
  try {
    const params = { page, limit: limit.value };
    if (searchQuery.value) params.search = searchQuery.value;

    const response = await parentsApi.getAll(params);
    parents.value = Array.isArray(response?.data) ? response.data : [];
    const p = response?.pagination || {};
    pagination.page = p.page || page;
    pagination.total = p.total || parents.value.length;
    pagination.total_pages = p.total_pages || 1;
  } catch (err) {
    console.error("fetchParents error:", err);
    alert(err.message || "Gagal memuat data");
  } finally {
    loading.value = false;
  }
}

async function submitForm() {
  saving.value = true;
  modal.error = "";
  try {
    if (!form.phone) {
      modal.error = "Phone wajib diisi";
      return;
    }

    const payload = {
      fatherName: form.fatherName || undefined,
      motherName: form.motherName || undefined,
      fatherOccupation: form.fatherOccupation || undefined,
      motherOccupation: form.motherOccupation || undefined,
      phone: form.phone,
      address: form.address || undefined,
      email: form.email || undefined,
    };

    if (modal.mode === "create" && form.password) {
      payload.password = form.password;
    }

    if (modal.mode === "edit" && form.id) {
      await parentsApi.update(form.id, payload);
    } else {
      await parentsApi.create(payload);
    }

    await fetchParents(pagination.page);
    closeModal();
  } catch (err) {
    modal.error = err.message || "Gagal menyimpan";
  } finally {
    saving.value = false;
  }
}

async function deleteParent() {
  saving.value = true;
  try {
    await parentsApi.delete(confirm.item.id);
    await fetchParents(pagination.page);
    confirmCancel();
  } catch (err) {
    alert(err.message || "Gagal menghapus");
  } finally {
    saving.value = false;
  }
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => fetchParents(1), 450);
}

function changeLimit() {
  fetchParents(1);
}
function changePage(p) {
  if (p >= 1 && p <= pagination.total_pages) fetchParents(p);
}
function resetFilters() {
  searchQuery.value = "";
  fetchParents(1);
}

function openCreate() {
  modal.show = true;
  modal.mode = "create";
  modal.error = "";
  Object.assign(form, {
    id: null,
    fatherName: "",
    motherName: "",
    fatherOccupation: "",
    motherOccupation: "",
    phone: "",
    address: "",
    email: "",
    password: "",
  });
}

function openEdit(item) {
  modal.show = true;
  modal.mode = "edit";
  modal.error = "";
  Object.assign(form, { ...item, password: "" });
}

function closeModal() {
  modal.show = false;
  modal.error = "";
}
function confirmDelete(item) {
  confirm.show = true;
  confirm.item = item;
}
function confirmCancel() {
  confirm.show = false;
  confirm.item = null;
}
function openView(item) {
  view.item = { ...item };
  view.show = true;
}
function viewClose() {
  view.show = false;
}

onMounted(() => fetchParents(1));
</script>

<style scoped>
table td,
table th {
  vertical-align: middle;
}
</style>
