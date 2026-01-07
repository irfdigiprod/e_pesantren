<template>
  <div class="p-6 space-y-6">
    <DataTable
      title="Data Pasien Klinik"
      description="Database seluruh pasien yang pernah berobat."
      icon="solar:users-group-two-rounded-bold-duotone"
      :items="paginatedPatients"
      :columns="columns"
      :loading="loading"
      v-model:search="search"
      v-model:viewMode="viewMode"
      :pagination="pagination"
      @page-change="onPageChange"
      @update:limit="onLimitChange"
    >
      <template #filters="{ close }">
        <div class="space-y-4">
          <h4 class="font-bold text-sm text-slate-700">Filter Data</h4>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1"
              >Tipe Pasien</label
            >
            <select
              v-model="filters.type"
              class="w-full border border-slate-200 rounded-lg text-sm px-3 py-2"
            >
              <option value="">Semua</option>
              <option value="student">Santri</option>
              <option value="teacher">Guru</option>
              <option value="external">Umum/Eksternal</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1"
              >Jenis Kelamin</label
            >
            <select
              v-model="filters.gender"
              class="w-full border border-slate-200 rounded-lg text-sm px-3 py-2"
            >
              <option value="">Semua</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
          <div class="pt-2 flex justify-end">
            <button
              @click="resetFilters"
              class="text-xs text-red-600 font-medium hover:underline"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </template>

      <template #cell-type="{ item }">
        <span
          v-if="item.type === 'student'"
          class="px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
        >
          Santri
        </span>
        <span
          v-else-if="item.type === 'teacher'"
          class="px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100"
        >
          Guru
        </span>
        <span
          v-else
          class="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200"
        >
          Umum/Eksternal
        </span>
      </template>

      <template #cell-actions="{ item }">
        <div class="flex justify-end gap-2">
          <!-- Only allow edit for External patients or adding clinical details to others -->
          <button
            @click="openEdit(item)"
            class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Edit Data Klinis"
          >
            <Icon icon="solar:pen-new-square-linear" class="text-lg" />
          </button>
          <button
            @click="confirmDelete(item)"
            class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Hapus Data Pasien"
          >
            <Icon icon="solar:trash-bin-trash-linear" class="text-lg" />
          </button>
        </div>
      </template>

      <!-- Card View Template -->
      <template #card-item="{ item }">
        <div
          class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all flex flex-col gap-4 h-full relative group"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div
                class="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold"
                :class="
                  item.gender === 'P'
                    ? 'bg-pink-50 text-pink-600'
                    : 'bg-blue-50 text-blue-600'
                "
              >
                {{ item.name.charAt(0) }}
              </div>
              <div class="flex-1 min-w-0">
                <h3
                  class="font-bold text-slate-800 text-sm leading-tight line-clamp-2"
                  :title="item.name"
                >
                  {{ item.name }}
                </h3>
                <div class="text-[10px] text-slate-500 mt-0.5">
                  {{ item.age && item.age !== "-" ? `${item.age} Tahun` : "-" }}
                </div>
              </div>
            </div>
          </div>

          <div
            class="grid grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100"
          >
            <div>
              <span
                class="block text-[9px] uppercase tracking-wider text-slate-400 mb-1"
                >Tipe Pasien</span
              >
              <span
                v-if="item.type === 'student'"
                class="font-semibold text-blue-600"
                >Santri</span
              >
              <span
                v-else-if="item.type === 'teacher'"
                class="font-semibold text-amber-600"
                >Guru</span
              >
              <span v-else class="font-semibold text-slate-600">Umum</span>
            </div>
            <div>
              <span
                class="block text-[9px] uppercase tracking-wider text-slate-400 mb-1"
                >Gol. Darah</span
              >
              <span class="font-semibold">{{ item.bloodType || "-" }}</span>
            </div>
          </div>

          <div
            class="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-3"
          >
            <!-- Address -->
            <div
              class="flex flex-1 items-center gap-1.5 text-xs text-slate-500 min-w-0"
            >
              <Icon
                icon="solar:map-point-linear"
                class="shrink-0 text-slate-400"
              />
              <span
                class="truncate"
                :title="item.fullAddress || item.address"
                >{{ item.fullAddress || item.address || "Alamat -" }}</span
              >
            </div>

            <!-- Actions -->
            <div
              class="flex gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            >
              <button
                @click.stop="openEdit(item)"
                class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Edit"
              >
                <Icon icon="solar:pen-new-square-linear" class="text-base" />
              </button>
              <button
                @click.stop="confirmDelete(item)"
                class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Hapus"
              >
                <Icon icon="solar:trash-bin-trash-linear" class="text-base" />
              </button>
            </div>
          </div>
        </div>
      </template>
    </DataTable>

    <!-- Patient Edit Modal -->
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
          class="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-fade-in-up relative z-10 flex flex-col max-h-[90vh]"
        >
          <div
            class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"
          >
            <h3 class="font-bold text-slate-800">Edit Data Pasien</h3>
            <button
              @click="closeModal"
              class="text-slate-400 hover:text-slate-600"
            >
              <Icon icon="solar:close-circle-bold" class="text-xl" />
            </button>
          </div>

          <div class="p-6 overflow-y-auto custom-scrollbar">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1"
                  >Nama Lengkap</label
                >
                <input
                  v-model="form.name"
                  :disabled="form.type !== 'external'"
                  class="w-full border rounded-lg px-4 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1"
                  >Jenis Layanan (Tipe)</label
                >
                <input
                  :value="form.type.toUpperCase()"
                  disabled
                  class="w-full border rounded-lg px-4 py-2 text-sm bg-slate-100 text-slate-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1"
                  >No. Telepon/HP</label
                >
                <input
                  v-model="form.phone"
                  class="w-full border rounded-lg px-4 py-2 text-sm"
                  placeholder="08..."
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1"
                  >Jenis Kelamin</label
                >
                <select
                  v-model="form.gender"
                  class="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1"
                  >Gol. Darah</label
                >
                <select
                  v-model="form.bloodType"
                  class="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm"
                >
                  <option value="">-</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1"
                  >Tempat Lahir</label
                >
                <input
                  v-model="form.birthPlace"
                  :disabled="form.type !== 'external'"
                  class="w-full border rounded-lg px-4 py-2 text-sm disabled:bg-slate-100"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1"
                  >Tanggal Lahir</label
                >
                <input
                  type="date"
                  v-model="form.dob"
                  :disabled="form.type !== 'external'"
                  class="w-full border rounded-lg px-4 py-2 text-sm disabled:bg-slate-100"
                />
              </div>
            </div>

            <!-- Address (External Only or View Only for others) -->
            <div v-if="form.type === 'external'">
              <h4 class="text-sm font-bold text-slate-700 border-b pb-2 mb-3">
                Alamat Domisili
              </h4>
              <AddressSelector
                v-model="addressModel"
                label="Alamat Lengkap"
                @update:modelValue="onAddressUpdate"
              />
            </div>
            <div v-else>
              <label class="block text-xs font-semibold text-slate-500 mb-1"
                >Alamat</label
              >
              <textarea
                :value="form.address"
                disabled
                rows="2"
                class="w-full border rounded-lg px-4 py-2 text-sm bg-slate-100"
              ></textarea>
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
              {{ saving ? "Menyimpan..." : "Simpan Perubahan" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <ConfirmModal
      :isOpen="confirm.show"
      :loading="saving"
      title="Hapus Pasien?"
      message="Yakin ingin menghapus data pasien ini? Data tidak bisa dikembalikan."
      type="danger"
      @confirm="deleteItem"
      @cancel="confirmCancel"
    />

    <StatusModal
      :isOpen="statusModal.open"
      :type="statusModal.status"
      :title="statusModal.title"
      :message="statusModal.message"
      @close="statusModal.open = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import DataTable from "@/components/ui/DataTable.vue";
import AddressSelector from "@/components/ui/AddressSelector.vue";
import StatusModal from "@/components/ui/StatusModal.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import { request } from "@/services/api";

const patients = ref([]);
const loading = ref(false);
const saving = ref(false);
const search = ref("");
const viewMode = ref("table");

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

const filters = reactive({
  type: "",
  gender: "",
});

const statusModal = reactive({
  open: false,
  status: "success",
  title: "",
  message: "",
});

const modal = reactive({ show: false });
const addressModel = ref(null);

const form = reactive({
  id: null,
  type: "external",
  name: "",
  gender: "L",
  dob: null,
  birthPlace: "",
  bloodType: "",
  address: "",
  // Structured Address
  province: null,
  regency: null,
  district: null,
  village: null,
  addressDetail: "",
  postalCode: "",
  village: null,
  addressDetail: "",
  postalCode: "",
  phone: "",
});

const confirm = reactive({ show: false, item: null });

const columns = [
  { label: "Nama Pasien", field: "name", sortable: true },
  { label: "Tipe", field: "type", sortable: true },
  { label: "L/P", field: "gender" },
  { label: "No. HP", field: "phone" },
  { label: "Usia", field: "age" }, // Derived
  { label: "Gol. Darah", field: "bloodType" },
  { label: "Alamat", field: "address" },
  { label: "Aksi", field: "actions", align: "right" },
];

const filteredPatients = computed(() => {
  let result = patients.value;

  // Search
  if (search.value) {
    const q = search.value.toLowerCase();
    result = result.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.address?.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q)
    );
  }

  // Filters
  if (filters.type) {
    result = result.filter((r) => r.type === filters.type);
  }
  if (filters.gender) {
    result = result.filter((r) => r.gender === filters.gender);
  }

  return result;
});

const paginatedPatients = computed(() => {
  const start = (pagination.page - 1) * pagination.limit;
  const end = start + pagination.limit;
  return filteredPatients.value.slice(start, end);
});

// Update pagination total when filter changes
watch(filteredPatients, (newVal) => {
  pagination.total = newVal.length;
  pagination.totalPages = Math.ceil(newVal.length / pagination.limit);
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

function resetFilters() {
  filters.type = "";
  filters.gender = "";
}

async function fetchPatients() {
  loading.value = true;
  try {
    const res = await request("/api/clinic/patients/all");
    patients.value = (res.data || []).map((p) => {
      // Construct full address from structured data if available
      let fullAddress = p.address;
      if (!fullAddress) {
        const parts = [];
        if (p.addressDetail) parts.push(p.addressDetail);

        // Try parse JSON fields if string
        try {
          if (p.village) {
            const v =
              typeof p.village === "string" ? JSON.parse(p.village) : p.village;
            if (v?.name) parts.push(v.name);
          }
          if (p.district) {
            const d =
              typeof p.district === "string"
                ? JSON.parse(p.district)
                : p.district;
            if (d?.name) parts.push(d.name);
          }
          if (p.regency) {
            const r =
              typeof p.regency === "string" ? JSON.parse(p.regency) : p.regency;
            if (r?.name) parts.push(r.name);
          }
        } catch (e) {
          /* ignore parse error */
        }

        if (parts.length > 0) fullAddress = parts.join(", ");
      }

      return {
        ...p,
        fullAddress,
        age: calculateAge(p.dob),
      };
    });

    // Init Pagination
    pagination.total = patients.value.length;
    pagination.totalPages = Math.ceil(patients.value.length / pagination.limit);
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function calculateAge(dob) {
  if (!dob) return "-";
  const diff = Date.now() - new Date(dob).getTime();
  const ageDt = new Date(diff);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}

function openEdit(item) {
  modal.show = true;
  Object.assign(form, { ...item });

  // Setup Address Selector model
  if (item.province) {
    addressModel.value = {
      province:
        typeof item.province === "string"
          ? JSON.parse(item.province)
          : item.province,
      regency:
        typeof item.regency === "string"
          ? JSON.parse(item.regency)
          : item.regency,
      district:
        typeof item.district === "string"
          ? JSON.parse(item.district)
          : item.district,
      village:
        typeof item.village === "string"
          ? JSON.parse(item.village)
          : item.village,
      detail: item.addressDetail,
    };
  } else {
    addressModel.value = null;
  }
}

function onAddressUpdate(val) {
  if (!val) return;
  form.province = val.province;
  form.regency = val.regency;
  form.district = val.district;
  form.village = val.village;
  form.addressDetail = val.detail;
  form.postalCode = val.postalCode; // If available
}

function closeModal() {
  modal.show = false;
}

async function submitForm() {
  saving.value = true;
  try {
    await request(`/api/clinic/patients/${form.id}`, {
      method: "PUT",
      body: form,
    });
    await fetchPatients();
    closeModal();

    statusModal.status = "success";
    statusModal.title = "Berhasil";
    statusModal.message = "Data pasien berhasil diperbarui.";
    statusModal.open = true;
  } catch (e) {
    statusModal.status = "error";
    statusModal.title = "Gagal";
    statusModal.message = e.message || "Gagal menyimpan data.";
    statusModal.open = true;
  } finally {
    saving.value = false;
  }
}

function confirmDelete(item) {
  confirm.show = true;
  confirm.item = item;
}

function confirmCancel() {
  confirm.show = false;
  confirm.item = null;
}

async function deleteItem() {
  saving.value = true;
  try {
    await request(`/api/clinic/patients/${confirm.item.id}`, {
      method: "DELETE",
    });
    await fetchPatients();
    confirmCancel();

    statusModal.status = "success";
    statusModal.title = "Berhasil";
    statusModal.message = "Data pasien berhasil dihapus.";
    statusModal.open = true;
  } catch (e) {
    statusModal.status = "error";
    statusModal.title = "Gagal";
    statusModal.message = e.message || "Gagal menghapus data.";
    statusModal.open = true;
  } finally {
    saving.value = false;
  }
}

onMounted(fetchPatients);
</script>
