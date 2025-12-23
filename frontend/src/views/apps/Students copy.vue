<template>
  <div class="p-6">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4"
    >
      <div>
        <h1 class="text-xl font-semibold text-slate-800">Santri</h1>
        <p class="text-sm text-slate-500">
          Kelola data santri — preview tampilan tanpa koneksi API.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          @click="openCreate"
          class="px-3 py-2 rounded-lg border text-sm"
          :style="{ borderColor: 'var(--primary)' }"
        >
          + Tambah
        </button>

        <label
          class="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer"
          :style="{ borderColor: 'var(--primary)' }"
        >
          <input ref="importInput" type="file" accept=".xlsx" class="hidden" />
          <span>Import Excel</span>
        </label>

        <button
          class="px-3 py-2 rounded-lg border text-sm"
          :style="{ borderColor: 'var(--primary)' }"
        >
          Export
        </button>

        <button
          class="px-3 py-2 rounded-lg border text-sm"
          :style="{ borderColor: 'var(--primary)' }"
        >
          Template
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg p-4 shadow-sm mb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="flex items-center gap-2">
          <input
            v-model="localFilters.nama_lengkap"
            placeholder="Cari nama..."
            class="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div class="flex gap-2">
          <select
            v-model="localFilters.tingkat_kelas"
            class="w-1/3 border rounded px-3 py-2 text-sm"
          >
            <option value="">Semua Tingkat</option>
            <option v-for="t in mockOptions.tingkat_kelas" :key="t" :value="t">
              {{ t }}
            </option>
          </select>

          <select
            v-model="localFilters.rombel"
            class="w-1/3 border rounded px-3 py-2 text-sm"
          >
            <option value="">Semua Rombel</option>
            <option v-for="r in mockOptions.rombel" :key="r" :value="r">
              {{ r }}
            </option>
          </select>

          <select
            v-model="localFilters.kamar"
            class="w-1/3 border rounded px-3 py-2 text-sm"
          >
            <option value="">Semua Kamar</option>
            <option v-for="k in mockOptions.kamar" :key="k" :value="k">
              {{ k }}
            </option>
          </select>
        </div>

        <div class="flex gap-2">
          <select
            v-model="localFilters.gender"
            class="w-1/3 border rounded px-3 py-2 text-sm"
          >
            <option value="">Semua Gender</option>
            <option v-for="g in mockOptions.gender" :key="g" :value="g">
              {{ g }}
            </option>
          </select>

          <select
            v-model="localFilters.grup_halaqah"
            class="w-1/3 border rounded px-3 py-2 text-sm"
          >
            <option value="">Semua Halaqah</option>
            <option
              v-for="gh in mockOptions.grup_halaqah"
              :key="gh"
              :value="gh"
            >
              {{ gh }}
            </option>
          </select>

          <div class="flex items-center">
            <button
              @click="resetFilters"
              class="px-3 py-2 rounded-lg border text-sm"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Table / Card list -->
    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <!-- Desktop table -->
      <table class="min-w-full table-auto hidden md:table">
        <thead class="bg-slate-50 text-slate-600 text-sm">
          <tr>
            <th class="px-4 py-3 text-left">#</th>
            <th
              class="px-4 py-3 text-left cursor-pointer"
              @click="toggleSort('nama_lengkap')"
            >
              Nama
              <SortIcon
                field="nama_lengkap"
                :sortBy="localPagination.sort_by"
                :order="localPagination.order"
              />
            </th>
            <th
              class="px-4 py-3 text-left cursor-pointer"
              @click="toggleSort('nis')"
            >
              NIS
              <SortIcon
                field="nis"
                :sortBy="localPagination.sort_by"
                :order="localPagination.order"
              />
            </th>
            <th class="px-4 py-3 text-left">Gender</th>
            <th
              class="px-4 py-3 text-left"
              @click="toggleSort('tingkat_kelas')"
            >
              Tingkat
              <SortIcon
                field="tingkat_kelas"
                :sortBy="localPagination.sort_by"
                :order="localPagination.order"
              />
            </th>
            <th class="px-4 py-3 text-left">Rombel</th>
            <th class="px-4 py-3 text-left">Kamar</th>
            <th class="px-4 py-3 text-left">Aksi</th>
          </tr>
        </thead>

        <tbody class="text-sm text-slate-700">
          <tr v-for="(s, idx) in pagedStudents" :key="s.id" class="border-t">
            <td class="px-4 py-3">
              {{ (localPagination.page - 1) * localLimitNumber + idx + 1 }}
            </td>
            <td class="px-4 py-3">{{ s.nama_lengkap }}</td>
            <td class="px-4 py-3">{{ s.nis }}</td>
            <td class="px-4 py-3">{{ s.gender }}</td>
            <td class="px-4 py-3">{{ s.tingkat_kelas }}</td>
            <td class="px-4 py-3">{{ s.rombel }}</td>
            <td class="px-4 py-3">{{ s.kamar }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
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
                <button
                  @click="openView(s)"
                  class="px-2 py-1 rounded border text-xs"
                >
                  Lihat
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="filteredStudents.length === 0">
            <td class="px-4 py-6 text-center" colspan="8">Data kosong</td>
          </tr>
        </tbody>
      </table>

      <!-- Mobile card list -->
      <div class="md:hidden divide-y">
        <div v-for="s in pagedStudents" :key="s.id" class="p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-medium text-slate-800">{{ s.nama_lengkap }}</div>
              <div class="text-xs text-slate-500">
                {{ s.nis }} • {{ s.tingkat_kelas }} • {{ s.rombel }}
              </div>
              <div class="text-xs text-slate-500 mt-1">
                {{ s.kamar }} • {{ s.gender }}
              </div>
            </div>
            <div class="flex flex-col items-end gap-2">
              <button
                @click="openView(s)"
                class="px-2 py-1 rounded border text-xs"
              >
                Lihat
              </button>
              <div class="flex gap-1">
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
            </div>
          </div>
        </div>
        <div
          v-if="filteredStudents.length === 0"
          class="p-4 text-center text-slate-500"
        >
          Data kosong
        </div>
      </div>

      <!-- Pagination footer -->
      <div
        class="p-4 flex flex-col md:flex-row items-center justify-between gap-3 border-t"
      >
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-600">Menampilkan</span>
          <select
            v-model="localLimit"
            class="border rounded px-2 py-1 text-sm"
            @change="changeLimit"
          >
            <option
              v-for="o in ['5', '10', '20', '50', '100', 'All']"
              :key="o"
              :value="o"
            >
              {{ o }}
            </option>
          </select>
          <span class="text-sm text-slate-600">per halaman</span>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="changePage(localPagination.page - 1)"
            :disabled="localPagination.page <= 1"
            class="px-3 py-1 rounded border"
          >
            Prev
          </button>
          <span class="text-sm text-slate-600"
            >Halaman {{ localPagination.page }} dari
            {{ localPagination.total_pages }}</span
          >
          <button
            @click="changePage(localPagination.page + 1)"
            :disabled="localPagination.page >= localPagination.total_pages"
            class="px-3 py-1 rounded border"
          >
            Next
          </button>
        </div>

        <div class="text-sm text-slate-600">
          Total: {{ filteredStudents.length }}
        </div>
      </div>
    </div>

    <!-- Modals: Create/Edit -->
    <div
      v-if="modal.show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        class="bg-white w-full max-w-2xl rounded-lg shadow-lg overflow-auto max-h-[90vh]"
      >
        <div class="p-4 border-b flex items-center justify-between">
          <h3 class="font-medium">
            {{ modal.mode === "create" ? "Tambah Student" : "Edit Student" }}
          </h3>
          <button @click="closeModal" class="px-2 py-1">✕</button>
        </div>

        <div class="p-4 space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-slate-500">NIS</label>
              <input
                v-model="form.nis"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">Nama Lengkap</label>
              <input
                v-model="form.nama_lengkap"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label class="text-xs text-slate-500">Gender</label>
              <div class="flex items-center gap-3 mt-1">
                <label class="flex items-center gap-2 text-sm"
                  ><input
                    type="radio"
                    value="Laki-laki"
                    v-model="form.gender"
                  />
                  Laki-laki</label
                >
                <label class="flex items-center gap-2 text-sm"
                  ><input
                    type="radio"
                    value="Perempuan"
                    v-model="form.gender"
                  />
                  Perempuan</label
                >
              </div>
            </div>

            <div>
              <label class="text-xs text-slate-500">Tingkat Kelas</label>
              <select
                v-model="form.tingkat_kelas"
                class="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">Pilih</option>
                <option
                  v-for="t in mockOptions.tingkat_kelas"
                  :key="t"
                  :value="t"
                >
                  {{ t }}
                </option>
              </select>
            </div>

            <div>
              <label class="text-xs text-slate-500">Rombel</label>
              <select
                v-model="form.rombel"
                class="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">Pilih</option>
                <option v-for="r in mockOptions.rombel" :key="r" :value="r">
                  {{ r }}
                </option>
              </select>
            </div>

            <div>
              <label class="text-xs text-slate-500">Kamar</label>
              <select
                v-model="form.kamar"
                class="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">Pilih</option>
                <option v-for="k in mockOptions.kamar" :key="k" :value="k">
                  {{ k }}
                </option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="text-xs text-slate-500">Email</label>
              <input
                v-model="form.email"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>

            <div class="md:col-span-2">
              <label class="text-xs text-slate-500">Tanggal Lahir</label>
              <input
                v-model="form.tanggal_lahir"
                placeholder="31/07/1987"
                class="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="saveLocalStudent"
              class="px-4 py-2 rounded-lg"
              :style="{ background: 'var(--secondary)', color: '#fff' }"
            >
              <span>{{ modal.mode === "create" ? "Tambah" : "Simpan" }}</span>
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

    <!-- Confirm delete -->
    <div
      v-if="confirm.show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        class="bg-white w-full max-w-md rounded-lg shadow-lg overflow-hidden"
      >
        <div class="p-4">
          <h3 class="font-medium">Hapus Student</h3>
          <p class="text-sm text-slate-600 mt-2">
            Anda yakin akan menghapus
            <strong>{{ confirm.item?.nama_lengkap }}</strong
            >? Tindakan ini tidak bisa dibatalkan.
          </p>
          <div class="mt-4 flex gap-2">
            <button
              @click="deleteLocalStudent"
              class="px-4 py-2 rounded-lg"
              :style="{ background: 'var(--primary)', color: '#fff' }"
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

    <!-- View modal -->
    <div
      v-if="view.show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        class="bg-white w-full max-w-lg rounded-lg shadow-lg overflow-auto max-h-[90vh]"
      >
        <div class="p-4 border-b flex items-center justify-between">
          <h3 class="font-medium">Detail Student</h3>
          <button @click="viewClose" class="px-2 py-1">✕</button>
        </div>
        <div class="p-4 space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div class="text-xs text-slate-500">Nama</div>
              <div class="font-medium">{{ view.item.nama_lengkap }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500">NIS</div>
              <div class="font-medium">{{ view.item.nis }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500">Gender</div>
              <div class="font-medium">{{ view.item.gender }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500">Tingkat</div>
              <div class="font-medium">{{ view.item.tingkat_kelas }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500">Rombel</div>
              <div class="font-medium">{{ view.item.rombel }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500">Kamar</div>
              <div class="font-medium">{{ view.item.kamar }}</div>
            </div>
            <div class="md:col-span-2">
              <div class="text-xs text-slate-500">Email</div>
              <div class="font-medium">{{ view.item.email || "-" }}</div>
            </div>
            <div class="md:col-span-2">
              <div class="text-xs text-slate-500">Tanggal Lahir</div>
              <div class="font-medium">
                {{ view.item.tanggal_lahir || "-" }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";

/* branding variables */
const primary = "#602515";
const secondary = "#f8ae19";

/* mock options & data (static) */
const mockOptions = {
  gender: ["Laki-laki", "Perempuan"],
  tingkat_kelas: ["7", "8", "9", "10", "11", "12"],
  rombel: ["7A", "7B", "10A", "10B"],
  kamar: ["D-01", "D-02"],
  grup_halaqah: ["H1", "H2", "H3"],
};

/* local UI state */
const localFilters = reactive({
  rombel: "",
  tingkat_kelas: "",
  gender: "",
  grup_halaqah: "",
  kamar: "",
  nama_lengkap: "",
});

const localPagination = reactive({
  page: 1,
  limit: "20",
  total: 0,
  total_pages: 1,
  sort_by: "id",
  order: "asc",
});
const localLimit = ref("20");

/* mock students (sample) */
const mockStudents = ref([
  {
    id: 1,
    nis: "2023-0001",
    nama_lengkap: "Irfan Alkhotiri",
    gender: "Laki-laki",
    tingkat_kelas: "10",
    rombel: "10A",
    kamar: "D-01",
    grup_halaqah: "H1",
    tanggal_lahir: "31/07/1987",
    email: "irfan@example.com",
  },
  {
    id: 2,
    nis: "2023-0002",
    nama_lengkap: "Aisyah Putri",
    gender: "Perempuan",
    tingkat_kelas: "10",
    rombel: "10B",
    kamar: "D-02",
    grup_halaqah: "H2",
    tanggal_lahir: "12/05/2008",
    email: "aisyah@example.com",
  },
  {
    id: 3,
    nis: "2023-0003",
    nama_lengkap: "Budi Santoso",
    gender: "Laki-laki",
    tingkat_kelas: "9",
    rombel: "9A",
    kamar: "D-01",
    grup_halaqah: "H1",
    tanggal_lahir: "20/03/2009",
    email: "budi@example.com",
  },
  // add more sample rows if you want to test pagination
]);

/* derived: filtered -> sorted -> paged */
const filteredStudents = computed(() => {
  let out = mockStudents.value.slice();

  // filter exact matches when provided
  if (localFilters.rombel)
    out = out.filter((s) => s.rombel === localFilters.rombel);
  if (localFilters.tingkat_kelas)
    out = out.filter((s) => s.tingkat_kelas === localFilters.tingkat_kelas);
  if (localFilters.gender)
    out = out.filter((s) => s.gender === localFilters.gender);
  if (localFilters.grup_halaqah)
    out = out.filter((s) => s.grup_halaqah === localFilters.grup_halaqah);
  if (localFilters.kamar)
    out = out.filter((s) => s.kamar === localFilters.kamar);
  if (localFilters.nama_lengkap) {
    const q = localFilters.nama_lengkap.toLowerCase();
    out = out.filter((s) => (s.nama_lengkap || "").toLowerCase().includes(q));
  }

  // sorting
  const col = localPagination.sort_by;
  const dir = localPagination.order === "asc" ? 1 : -1;
  out.sort((a, b) => {
    const A = (a[col] ?? "").toString().toLowerCase();
    const B = (b[col] ?? "").toString().toLowerCase();
    if (A < B) return -1 * dir;
    if (A > B) return 1 * dir;
    return 0;
  });

  // set totals for pagination controls
  localPagination.total = out.length;
  localPagination.total_pages =
    localLimit.value === "All"
      ? 1
      : Math.max(1, Math.ceil(out.length / parseInt(localLimit.value || "20")));
  if (localPagination.page > localPagination.total_pages)
    localPagination.page = localPagination.total_pages;

  return out;
});

const localLimitNumber = computed(() =>
  localLimit.value === "All" ? 9999999 : parseInt(localLimit.value || "20", 10)
);

const pagedStudents = computed(() => {
  if (localLimit.value === "All") return filteredStudents.value;
  const start = (localPagination.page - 1) * localLimitNumber.value;
  return filteredStudents.value.slice(start, start + localLimitNumber.value);
});

/* modal & form state (local only) */
const modal = reactive({ show: false, mode: "create", error: "" });
const form = reactive({
  id: null,
  nis: "",
  nama_lengkap: "",
  gender: "",
  tingkat_kelas: "",
  rombel: "",
  kamar: "",
  email: "",
  tanggal_lahir: "",
});

const confirm = reactive({ show: false, item: null });
const view = reactive({ show: false, item: {} });

/* actions (local-only) */
function openCreate() {
  modal.show = true;
  modal.mode = "create";
  modal.error = "";
  Object.assign(form, {
    id: null,
    nis: "",
    nama_lengkap: "",
    gender: "",
    tingkat_kelas: "",
    rombel: "",
    kamar: "",
    email: "",
    tanggal_lahir: "",
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
  modal.error = "";
}

function saveLocalStudent() {
  // simple client-side validation
  if (!form.nama_lengkap || !form.nis) {
    modal.error = "Nama dan NIS wajib diisi";
    return;
  }
  if (modal.mode === "create") {
    const newid = Math.max(0, ...mockStudents.value.map((s) => s.id)) + 1;
    mockStudents.value.unshift({
      id: newid,
      ...JSON.parse(JSON.stringify(form)),
    });
  } else {
    const idx = mockStudents.value.findIndex((s) => s.id === form.id);
    if (idx >= 0)
      mockStudents.value.splice(idx, 1, {
        id: form.id,
        ...JSON.parse(JSON.stringify(form)),
      });
  }
  closeModal();
}

function confirmDelete(item) {
  confirm.show = true;
  confirm.item = item;
}
function confirmCancel() {
  confirm.show = false;
  confirm.item = null;
}
function deleteLocalStudent() {
  const idx = mockStudents.value.findIndex((s) => s.id === confirm.item.id);
  if (idx >= 0) mockStudents.value.splice(idx, 1);
  confirmCancel();
}

function openView(item) {
  view.item = { ...item };
  view.show = true;
}
function viewClose() {
  view.show = false;
}

/* pagination & sort UI helpers */
function changePage(p) {
  if (p < 1) return;
  if (p > localPagination.total_pages) return;
  localPagination.page = p;
}
function changeLimit() {
  localPagination.page = 1;
}
function toggleSort(field) {
  if (localPagination.sort_by === field) {
    localPagination.order = localPagination.order === "asc" ? "desc" : "asc";
  } else {
    localPagination.sort_by = field;
    localPagination.order = "asc";
  }
}
function resetFilters() {
  Object.assign(localFilters, {
    rombel: "",
    tingkat_kelas: "",
    gender: "",
    grup_halaqah: "",
    kamar: "",
    nama_lengkap: "",
  });
  localPagination.page = 1;
}

/* small view data */
view.show = false;
</script>

<style scoped>
:root {
  --primary: #602515;
  --secondary: #f8ae19;
}

/* table vertical align */
table td,
table th {
  vertical-align: middle;
}

/* modal scroll */
[max-height] {
  max-height: 90vh;
  overflow: auto;
}
</style>

<!-- Local SortIcon component (kepraktisan: ditempatkan di bawah file) -->
<script>
export const SortIcon = {
  props: ["field", "sortBy", "order"],
  template: `
    <span class="inline-block align-middle ml-1">
      <svg v-if="sortBy !== field" xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6-6 6 6"/><path d="M6 15l6 6 6-6"/></svg>
      <svg v-else-if="order === 'asc'" xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 15l6-6 6 6"/></svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6"/></svg>
    </span>
  `,
};
</script>
