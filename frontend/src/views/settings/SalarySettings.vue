<template>
  <div class="max-w-4xl mx-auto pb-12">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Komponen Gaji Guru</h1>
      <p class="text-slate-500 mt-1">
        Kelola golongan gaji, tunjangan jabatan, masa kerja, dan tunjangan
        lainnya.
      </p>
    </div>

    <!-- TABS -->
    <div
      class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl mb-6 overflow-x-auto"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="currentTab = tab.id"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
        :class="
          currentTab === tab.id
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
        "
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- TAB CONTENT -->
    <div v-if="loading" class="flex justify-center py-12">
      <Icon
        icon="lucide:loader-2"
        class="w-8 h-8 animate-spin text-indigo-600"
      />
    </div>

    <div v-else class="space-y-6">
      <!-- 1. SALARY GRADES (GOLONGAN) -->
      <div
        v-if="currentTab === 'grades'"
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div
          class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"
        >
          <h2
            class="text-lg font-semibold text-slate-800 flex items-center gap-2"
          >
            <Icon
              icon="solar:banknote-2-line-duotone"
              class="w-5 h-5 text-indigo-600"
            />
            Daftar Golongan Gaji
          </h2>
          <button
            @click="openModal('grade')"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Icon icon="lucide:plus" class="w-4 h-4" /> Tambah Golongan
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead
              class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200"
            >
              <tr>
                <th class="px-6 py-3">Nama Golongan</th>
                <th class="px-6 py-3 text-right">Gaji Pokok</th>
                <th class="px-6 py-3 text-right">Tun. Kehadiran</th>
                <th class="px-6 py-3 text-right">Tun. Kesehatan</th>
                <th class="px-6 py-3 text-right">Tun. Lainnya</th>
                <th class="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in grades"
                :key="item.id"
                class="border-b border-slate-100 hover:bg-slate-50"
              >
                <td class="px-6 py-4 font-medium text-slate-800">
                  {{ item.name }}
                </td>
                <td
                  class="px-6 py-4 text-right font-mono text-indigo-700 font-medium"
                >
                  {{ formatCurrency(item.baseSalary) }}
                </td>
                <td class="px-6 py-4 text-right font-mono">
                  {{ formatCurrency(item.dailyAttendanceRate) }} /hari
                </td>
                <td class="px-6 py-4 text-right font-mono">
                  {{ formatCurrency(item.healthAllowance) }}
                </td>
                <td
                  class="px-6 py-4 text-right font-mono text-xs text-slate-500"
                >
                  <div>
                    Housing: {{ formatCurrency(item.housingAllowance) }}
                  </div>
                  <div>
                    Transport: {{ formatCurrency(item.transportAllowance) }}
                  </div>
                  <div>
                    KBM: {{ formatCurrency(item.teachingHourRate) }}/jam
                  </div>
                </td>
                <td class="px-6 py-4 text-right flex justify-end gap-2">
                  <button
                    @click="openModal('grade', item)"
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Icon icon="lucide:pencil" class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteItem('grade', item.id)"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <Icon icon="lucide:trash-2" class="w-4 h-4" />
                  </button>
                </td>
              </tr>
              <tr v-if="grades.length === 0">
                <td colspan="5" class="px-6 py-12 text-center text-slate-500">
                  Belum ada data golongan gaji. Silakan tambah data baru.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 2. POSITION ALLOWANCES -->
      <div
        v-if="currentTab === 'positions'"
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div
          class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"
        >
          <h2
            class="text-lg font-semibold text-slate-800 flex items-center gap-2"
          >
            <Icon icon="lucide:briefcase" class="w-5 h-5 text-indigo-600" />
            Daftar Jabatan
          </h2>
          <button
            @click="openModal('position')"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Icon icon="lucide:plus" class="w-4 h-4" /> Tambah
          </button>
        </div>
        <table class="w-full text-sm text-left">
          <thead
            class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200"
          >
            <tr>
              <th class="px-6 py-3">Nama Jabatan</th>
              <th class="px-6 py-3 text-right">Nominal Tunjangan</th>
              <th class="px-6 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in positions"
              :key="item.id"
              class="border-b border-slate-100 hover:bg-slate-50"
            >
              <td class="px-6 py-4 font-medium text-slate-800">
                {{ item.position }}
              </td>
              <td class="px-6 py-4 text-right font-mono">
                {{ formatCurrency(item.amount) }}
              </td>
              <td class="px-6 py-4 text-right flex justify-end gap-2">
                <button
                  @click="openModal('position', item)"
                  class="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Icon icon="lucide:pencil" class="w-4 h-4" />
                </button>
                <button
                  @click="deleteItem('position', item.id)"
                  class="p-1.5 text-red-600 hover:bg-red-50 rounded"
                >
                  <Icon icon="lucide:trash-2" class="w-4 h-4" />
                </button>
              </td>
            </tr>
            <tr v-if="positions.length === 0">
              <td colspan="3" class="px-6 py-8 text-center text-slate-500">
                Belum ada data jabatan
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 3. TENURE ALLOWANCES -->
      <div
        v-if="currentTab === 'tenure'"
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div
          class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"
        >
          <h2
            class="text-lg font-semibold text-slate-800 flex items-center gap-2"
          >
            <Icon icon="lucide:clock" class="w-5 h-5 text-indigo-600" />
            Masa Kerja
          </h2>
          <button
            @click="openModal('tenure')"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Icon icon="lucide:plus" class="w-4 h-4" /> Tambah
          </button>
        </div>
        <table class="w-full text-sm text-left">
          <thead
            class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200"
          >
            <tr>
              <th class="px-6 py-3">Rentang Tahun</th>
              <th class="px-6 py-3 text-right">Nominal Tunjangan</th>
              <th class="px-6 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in tenures"
              :key="item.id"
              class="border-b border-slate-100 hover:bg-slate-50"
            >
              <td class="px-6 py-4 font-medium text-slate-800">
                {{ item.minYears }} - {{ item.maxYears }} Tahun
              </td>
              <td class="px-6 py-4 text-right font-mono">
                {{ formatCurrency(item.amount) }}
              </td>
              <td class="px-6 py-4 text-right flex justify-end gap-2">
                <button
                  @click="openModal('tenure', item)"
                  class="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Icon icon="lucide:pencil" class="w-4 h-4" />
                </button>
                <button
                  @click="deleteItem('tenure', item.id)"
                  class="p-1.5 text-red-600 hover:bg-red-50 rounded"
                >
                  <Icon icon="lucide:trash-2" class="w-4 h-4" />
                </button>
              </td>
            </tr>
            <tr v-if="tenures.length === 0">
              <td colspan="3" class="px-6 py-8 text-center text-slate-500">
                Belum ada data masa kerja
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 4. CUSTOM ALLOWANCES -->
      <div
        v-if="currentTab === 'custom'"
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div
          class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"
        >
          <h2
            class="text-lg font-semibold text-slate-800 flex items-center gap-2"
          >
            <Icon icon="lucide:star" class="w-5 h-5 text-indigo-600" />
            Tunjangan Custom
          </h2>
          <button
            @click="openModal('custom')"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Icon icon="lucide:plus" class="w-4 h-4" /> Tambah
          </button>
        </div>
        <table class="w-full text-sm text-left">
          <thead
            class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200"
          >
            <tr>
              <th class="px-6 py-3">Nama Tunjangan</th>
              <th class="px-6 py-3 text-right">Nominal Default</th>
              <th class="px-6 py-3 text-center">Status</th>
              <th class="px-6 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in customs"
              :key="item.id"
              class="border-b border-slate-100 hover:bg-slate-50"
            >
              <td class="px-6 py-4 font-medium text-slate-800">
                {{ item.name }}
              </td>
              <td class="px-6 py-4 text-right font-mono">
                {{ formatCurrency(item.amount) }}
              </td>
              <td class="px-6 py-4 text-center">
                <span
                  v-if="item.isActive"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >Aktif</span
                >
                <span
                  v-else
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"
                  >Nonaktif</span
                >
              </td>
              <td class="px-6 py-4 text-right flex justify-end gap-2">
                <button
                  @click="openModal('custom', item)"
                  class="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Icon icon="lucide:pencil" class="w-4 h-4" />
                </button>
                <button
                  @click="deleteItem('custom', item.id)"
                  class="p-1.5 text-red-600 hover:bg-red-50 rounded"
                >
                  <Icon icon="lucide:trash-2" class="w-4 h-4" />
                </button>
              </td>
            </tr>
            <tr v-if="customs.length === 0">
              <td colspan="4" class="px-6 py-8 text-center text-slate-500">
                Belum ada tunjangan custom
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODALS -->

    <!-- GRADE MODAL -->
    <div
      v-if="modal.type === 'grade'"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
    >
      <div class="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative">
        <h3 class="text-lg font-bold mb-4">
          {{ modal.isEdit ? "Edit" : "Tambah" }} Golongan Gaji
        </h3>
        <form @submit.prevent="submitModal">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1"
                >Nama Golongan</label
              >
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="Contoh: Golongan IA"
                class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Gaji Pokok</label>
                <div class="relative">
                  <span class="absolute left-3 top-2 text-slate-400">Rp</span>
                  <input
                    v-model.number="form.baseSalary"
                    type="number"
                    min="0"
                    placeholder="0"
                    class="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1"
                  >Tunjangan Kehadiran (Harian)</label
                >
                <div class="relative">
                  <span class="absolute left-3 top-2 text-slate-400">Rp</span>
                  <input
                    v-model.number="form.dailyAttendanceRate"
                    type="number"
                    min="0"
                    class="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1"
                  >Tunjangan Kesehatan</label
                >
                <div class="relative">
                  <span class="absolute left-3 top-2 text-slate-400">Rp</span>
                  <input
                    v-model.number="form.healthAllowance"
                    type="number"
                    min="0"
                    class="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1"
                  >Tunjangan Tempat Tinggal</label
                >
                <div class="relative">
                  <span class="absolute left-3 top-2 text-slate-400">Rp</span>
                  <input
                    v-model.number="form.housingAllowance"
                    type="number"
                    min="0"
                    class="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1"
                  >Tunjangan Transportasi</label
                >
                <div class="relative">
                  <span class="absolute left-3 top-2 text-slate-400">Rp</span>
                  <input
                    v-model.number="form.transportAllowance"
                    type="number"
                    min="0"
                    class="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1"
                  >Tunjangan Jam KBM (per jam)</label
                >
                <div class="relative">
                  <span class="absolute left-3 top-2 text-slate-400">Rp</span>
                  <input
                    v-model.number="form.teachingHourRate"
                    type="number"
                    min="0"
                    class="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 border rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Position Modal -->
    <div
      v-if="modal.type === 'position'"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <div class="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 class="text-lg font-bold mb-4">
          {{ modal.isEdit ? "Edit" : "Tambah" }} Jabatan
        </h3>
        <form @submit.prevent="submitModal">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Nama Jabatan</label>
              <input
                v-model="form.position"
                type="text"
                required
                class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1"
                >Nominal Tunjangan</label
              >
              <input
                v-model.number="form.amount"
                type="number"
                min="0"
                required
                class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-6">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 border rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Tenure Modal -->
    <div
      v-if="modal.type === 'tenure'"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <div class="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 class="text-lg font-bold mb-4">
          {{ modal.isEdit ? "Edit" : "Tambah" }} Masa Kerja
        </h3>
        <form @submit.prevent="submitModal">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Min Tahun</label>
                <input
                  v-model.number="form.minYears"
                  type="number"
                  min="0"
                  required
                  class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Max Tahun</label>
                <input
                  v-model.number="form.maxYears"
                  type="number"
                  min="0"
                  required
                  class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1"
                >Nominal Tunjangan</label
              >
              <input
                v-model.number="form.amount"
                type="number"
                min="0"
                required
                class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-6">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 border rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Custom Modal -->
    <div
      v-if="modal.type === 'custom'"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <div class="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 class="text-lg font-bold mb-4">
          {{ modal.isEdit ? "Edit" : "Tambah" }} Custom Allowance
        </h3>
        <form @submit.prevent="submitModal">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1"
                >Nama Tunjangan</label
              >
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1"
                >Nominal Default</label
              >
              <input
                v-model.number="form.amount"
                type="number"
                min="0"
                required
                class="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div v-if="modal.isEdit" class="flex items-center gap-2">
              <input
                type="checkbox"
                v-model="form.isActive"
                id="isActive"
                class="rounded text-indigo-600"
              />
              <label for="isActive" class="text-sm">Aktif</label>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-6">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 border rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>

    <StatusModal
      :is-open="statusModal.open"
      :type="statusModal.type"
      :title="statusModal.title"
      :message="statusModal.message"
      @close="statusModal.open = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from "vue";
import { Icon } from "@iconify/vue";
import { salaryApi, salaryGradesApi } from "@/services/api";
import StatusModal from "@/components/ui/StatusModal.vue";

const tabs = [
  { id: "grades", label: "Golongan Gaji" },
  { id: "positions", label: "Jabatan" },
  { id: "tenure", label: "Masa Kerja" },
  { id: "custom", label: "Tunjangan Lain" },
];
const currentTab = ref("grades");
const loading = ref(true);

const grades = ref([]);
const positions = ref([]);
const tenures = ref([]);
const customs = ref([]);

const statusModal = reactive({
  open: false,
  type: "success",
  title: "",
  message: "",
});

const modal = reactive({
  type: null, // grade, position, tenure, custom
  isEdit: false,
  id: null,
});

const form = reactive({
  // Dynamic fields
});

function openModal(type, item = null) {
  modal.type = type;
  modal.isEdit = !!item;
  modal.id = item ? item.id : null;

  // Reset form
  Object.keys(form).forEach((k) => delete form[k]);

  if (type === "grade") {
    form.name = item ? item.name : "";
    form.baseSalary = item ? parseFloat(item.baseSalary) : 0;
    form.dailyAttendanceRate = item ? parseFloat(item.dailyAttendanceRate) : 0;
    form.healthAllowance = item ? parseFloat(item.healthAllowance) : 0;
    form.housingAllowance = item ? parseFloat(item.housingAllowance) : 0;
    form.transportAllowance = item ? parseFloat(item.transportAllowance) : 0;
    form.teachingHourRate = item ? parseFloat(item.teachingHourRate) : 0;
  } else if (type === "position") {
    form.position = item ? item.position : "";
    form.amount = item ? parseFloat(item.amount) : 0;
  } else if (type === "tenure") {
    form.minYears = item ? item.minYears : 0;
    form.maxYears = item ? item.maxYears : 0;
    form.amount = item ? parseFloat(item.amount) : 0;
  } else if (type === "custom") {
    form.name = item ? item.name : "";
    form.amount = item ? parseFloat(item.amount) : 0;
    form.isActive = item ? item.isActive : true;
  }
}

function closeModal() {
  modal.type = null;
}

// Helpers
const formatCurrency = (val) => {
  if (!val) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
};

function showStatus(type, title, message) {
  statusModal.type = type;
  statusModal.title = title;
  statusModal.message = message;
  statusModal.open = true;
}

// API Calls
async function loadData() {
  loading.value = true;
  try {
    const [resSettings, resGrades] = await Promise.all([
      salaryApi.getSettings(),
      salaryGradesApi.getAll(),
    ]);

    if (resSettings.success) {
      const data = resSettings.data;
      // We ignore global settings now (salarySettings table)
      positions.value = data.positions;
      tenures.value = data.tenures;
      customs.value = data.customs;
    }

    if (resGrades.success) {
      grades.value = resGrades.data;
    }
  } catch (err) {
    console.error(err);
    showStatus("error", "Error", "Gagal memuat data pengaturan.");
  } finally {
    loading.value = false;
  }
}

async function submitModal() {
  try {
    if (modal.type === "grade") {
      if (modal.isEdit) await salaryGradesApi.update(modal.id, form);
      else await salaryGradesApi.create(form);
    } else if (modal.type === "position") {
      if (modal.isEdit) await salaryApi.updatePosition(modal.id, form);
      else await salaryApi.createPosition(form);
    } else if (modal.type === "tenure") {
      if (modal.isEdit) await salaryApi.updateTenure(modal.id, form);
      else await salaryApi.createTenure(form);
    } else if (modal.type === "custom") {
      if (modal.isEdit) await salaryApi.updateCustom(modal.id, form);
      else await salaryApi.createCustom(form);
    }
    closeModal();
    loadData(); // Refresh list
    showStatus("success", "Berhasil", "Data berhasil disimpan.");
  } catch (err) {
    showStatus("error", "Gagal", err.message);
  }
}

async function deleteItem(type, id) {
  if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
  try {
    if (type === "grade") await salaryGradesApi.delete(id);
    else if (type === "position") await salaryApi.deletePosition(id);
    else if (type === "tenure") await salaryApi.deleteTenure(id);
    else if (type === "custom") await salaryApi.deleteCustom(id);
    loadData();
    showStatus("success", "Berhasil", "Data berhasil dihapus.");
  } catch (err) {
    showStatus("error", "Gagal", err.message);
  }
}

onMounted(() => {
  loadData();
});
</script>
