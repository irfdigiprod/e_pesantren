<template>
  <div class="max-w-4xl mx-auto pb-12">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Pengaturan Tahfidz</h1>
      <p class="text-slate-500">Kelola target hafalan dan kops laporan rapor</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-6 border-b border-slate-200">
      <button
        @click="activeTab = 'targets'"
        :class="[
          'px-4 py-2 font-medium text-sm transition-colors border-b-2',
          activeTab === 'targets'
            ? 'border-[#602515] text-[#602515]'
            : 'border-transparent text-slate-500 hover:text-slate-700',
        ]"
      >
        Target Hafalan
      </button>
      <button
        @click="activeTab = 'header'"
        :class="[
          'px-4 py-2 font-medium text-sm transition-colors border-b-2',
          activeTab === 'header'
            ? 'border-[#602515] text-[#602515]'
            : 'border-transparent text-slate-500 hover:text-slate-700',
        ]"
      >
        Kops & Laporan
      </button>
    </div>

    <!-- TAB: TARGETS -->
    <div v-if="activeTab === 'targets'">
      <!-- Add Button -->
      <div class="mb-4">
        <button
          @click="openModal()"
          class="px-4 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1c10] flex items-center gap-2"
        >
          <Icon icon="solar:add-circle-bold" />
          Tambah Target Baru
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="h-32 flex items-center justify-center">
        <span class="text-slate-500 animate-pulse">Memuat data...</span>
      </div>

      <!-- Targets Table -->
      <div
        v-else
        class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <table class="w-full text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="p-3 text-left font-medium text-slate-700">Level</th>
              <th class="p-3 text-center font-medium text-slate-700">
                Target (Halaman/Bulan)
              </th>
              <th class="p-3 text-left font-medium text-slate-700">
                Keterangan
              </th>
              <th class="p-3 text-center font-medium text-slate-700">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="t in targets" :key="t.id" class="hover:bg-slate-50">
              <td class="p-3 font-medium text-slate-800">{{ t.level }}</td>
              <td class="p-3 text-center">
                <span
                  class="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-bold"
                >
                  {{ t.targetPages }}
                </span>
              </td>
              <td class="p-3 text-slate-600">{{ t.description || "-" }}</td>
              <td class="p-3 text-center">
                <div class="flex justify-center gap-2">
                  <button
                    @click="openModal(t)"
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit"
                  >
                    <Icon icon="solar:pen-bold" />
                  </button>
                  <button
                    @click="confirmDelete(t)"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Hapus"
                  >
                    <Icon icon="solar:trash-bin-minimalistic-bold" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!targets.length">
              <td colspan="4" class="p-6 text-center text-slate-500 italic">
                Belum ada data target. Klik "Tambah Target Baru" untuk
                menambahkan.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB: HEADER SETTINGS -->
    <div v-else-if="activeTab === 'header'">
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 class="font-bold text-slate-800 mb-4 border-b pb-2">
          Kops Surat & Tanda Tangan
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Left Column -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Nama Institusi / Yayasan</label
              >
              <input
                v-model="headerForm.institutionName"
                type="text"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                placeholder="Contoh: Markaz Syariah Minhajul Haq"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Alamat Lengkap (Kops)</label
              >
              <textarea
                v-model="headerForm.institutionAddress"
                rows="3"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                placeholder="Alamat lengkap, Telepon, Email, Website..."
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >URL Logo (Absolute URL)</label
              >
              <input
                v-model="headerForm.institutionLogo"
                type="text"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                placeholder="https://..."
              />
              <p class="text-xs text-slate-500 mt-1">
                Masukkan URL gambar logo yang valid.
              </p>
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Kota Tanggal (Default)</label
              >
              <input
                v-model="headerForm.cityDate"
                type="text"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                placeholder="Contoh: Purwakarta"
              />
              <p class="text-xs text-slate-500 mt-1">
                Format tanggal raport akan mengikuti: [Kota], [Tanggal]
              </p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Nama Kepala Bagian Tahfidz</label
                >
                <input
                  v-model="headerForm.tahfidzHeadName"
                  type="text"
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                  placeholder="Nama lengkap + Gelar"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Nama Wali Kelas (Default)</label
                >
                <input
                  type="text"
                  disabled
                  class="w-full px-3 py-2 border rounded-lg bg-slate-50 text-slate-500"
                  placeholder="(Otomatis dari Data)"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Nama Kepala Sekolah / Mudir (Optional)</label
              >
              <input
                v-model="headerForm.headmasterName"
                type="text"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
                placeholder="Nama lengkap + Gelar"
              />
            </div>
          </div>
        </div>

        <div class="mt-8 flex justify-end">
          <button
            @click="saveHeader"
            :disabled="savingHeader"
            class="px-6 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1c10] disabled:opacity-50 flex items-center gap-2"
          >
            <Icon
              v-if="savingHeader"
              icon="solar:spinner-bold"
              class="animate-spin"
            />
            <Icon v-else icon="solar:diskette-bold-duotone" />
            {{ savingHeader ? "Menyimpan..." : "Simpan Pengaturan" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal (Targets) -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
      @click.self="showModal = false"
    >
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-bold text-slate-800 mb-4">
          {{ form.id ? "Edit Target" : "Tambah Target Baru" }}
        </h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Level</label
            >
            <input
              v-model="form.level"
              type="text"
              placeholder="misal: SD, SMP, SMA, Tahfidz"
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
              :disabled="!!form.id"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Target (Halaman per Bulan)
            </label>
            <input
              v-model.number="form.targetPages"
              type="number"
              min="1"
              placeholder="misal: 6"
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Keterangan (Opsional)</label
            >
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="Deskripsi target..."
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 ring-[#602515]/20 outline-none"
            ></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button
            @click="showModal = false"
            class="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            @click="saveTarget"
            :disabled="saving"
            class="px-4 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#4a1c10] disabled:opacity-50"
          >
            {{ saving ? "Menyimpan..." : "Simpan" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div
      v-if="deleteConfirm.show"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
      @click.self="deleteConfirm.show = false"
    >
      <div
        class="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl text-center"
      >
        <Icon
          icon="solar:trash-bin-minimalistic-bold-duotone"
          class="text-5xl text-red-500 mb-4 mx-auto"
        />
        <h3 class="text-lg font-bold text-slate-800 mb-2">Hapus Target?</h3>
        <p class="text-slate-600 mb-6">
          Target level <strong>{{ deleteConfirm.item?.level }}</strong> akan
          dihapus.
        </p>
        <div class="flex justify-center gap-3">
          <button
            @click="deleteConfirm.show = false"
            class="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            @click="doDelete"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import { Icon } from "@iconify/vue";
import { tahfidzApi } from "@/services/api";

const activeTab = ref("targets");
const loading = ref(false);
const saving = ref(false);
const savingHeader = ref(false);
const targets = ref([]);
const showModal = ref(false);

const form = reactive({
  id: null,
  level: "",
  targetPages: 6,
  description: "",
});

const headerForm = reactive({
  institutionName: "",
  institutionAddress: "",
  institutionLogo: "",
  contactInfo: "",
  headmasterName: "",
  tahfidzHeadName: "",
  cityDate: "Purwakarta",
});

const deleteConfirm = reactive({
  show: false,
  item: null,
});

// --- TARGETS LOGIC ---
async function loadTargets() {
  loading.value = true;
  try {
    const res = await tahfidzApi.getTargets();
    if (res.success) {
      targets.value = res.data || [];
    }
  } catch (e) {
    console.error("Failed to load targets:", e);
  } finally {
    loading.value = false;
  }
}

function openModal(item = null) {
  if (item) {
    form.id = item.id;
    form.level = item.level;
    form.targetPages = item.targetPages;
    form.description = item.description || "";
  } else {
    form.id = null;
    form.level = "";
    form.targetPages = 6;
    form.description = "";
  }
  showModal.value = true;
}

async function saveTarget() {
  if (!form.level || !form.targetPages) {
    alert("Level dan Target harus diisi!");
    return;
  }

  saving.value = true;
  try {
    const payload = {
      level: form.level,
      targetPages: form.targetPages,
      description: form.description || null,
    };

    if (form.id) {
      await tahfidzApi.updateTarget(form.id, payload);
    } else {
      await tahfidzApi.createTarget(payload);
    }

    showModal.value = false;
    loadTargets();
  } catch (e) {
    console.error("Failed to save target:", e);
    alert("Gagal menyimpan target");
  } finally {
    saving.value = false;
  }
}

function confirmDelete(item) {
  deleteConfirm.item = item;
  deleteConfirm.show = true;
}

async function doDelete() {
  try {
    await tahfidzApi.deleteTarget(deleteConfirm.item.id);
    deleteConfirm.show = false;
    loadTargets();
  } catch (e) {
    console.error("Failed to delete target:", e);
    alert("Gagal menghapus target");
  }
}

// --- HEADER SETTINGS LOGIC ---
async function loadSettings() {
  try {
    const res = await tahfidzApi.getSettings();
    if (res.success && res.data) {
      Object.assign(headerForm, res.data);
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
}

async function saveHeader() {
  if (!headerForm.institutionName) {
    alert("Nama Institusi wajib diisi");
    return;
  }
  savingHeader.value = true;
  try {
    await tahfidzApi.updateSettings(headerForm);
    alert("Pengaturan header berhasil disimpan!");
  } catch (e) {
    console.error(e);
    alert("Gagal menyimpan pengaturan");
  } finally {
    savingHeader.value = false;
  }
}

// Watch tab to load data logic
watch(activeTab, (val) => {
  if (val === "targets" && targets.value.length === 0) loadTargets();
  if (val === "header") loadSettings();
});

onMounted(() => {
  loadTargets();
});
</script>
