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
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200',
              ]"
              :title="
                (item.occupiedBedNumbers || []).some((b) => Number(b) === n)
                  ? 'Terisi'
                  : 'Kosong'
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
                  ? 'bg-red-100 text-red-700 border border-red-200 cursor-help'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200',
              ]"
            >
              {{ n }}
              <div
                v-if="
                  (item.occupiedBedNumbers || []).some((b) => Number(b) === n)
                "
                class="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 shadow-lg"
              >
                Terisi
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
