<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-slate-800">Perizinan Saya</h1>
        <p class="text-sm text-slate-500 mt-1">
          Daftar pengajuan izin dan sakit saya.
        </p>
      </div>
      <button
        @click="showModal = true"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center gap-2"
      >
        <Icon icon="solar:add-circle-bold-duotone" class="w-5 h-5" />
        Ajukan Izin
      </button>
    </div>

    <!-- Permission Table -->
    <div
      class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <table class="w-full text-sm text-left">
        <thead class="bg-slate-50 text-slate-500 border-b border-slate-100">
          <tr>
            <th class="px-6 py-3 font-medium">Jenis</th>
            <th class="px-6 py-3 font-medium">Tanggal</th>
            <th class="px-6 py-3 font-medium w-1/3">Alasan</th>
            <th class="px-6 py-3 font-medium">Status</th>
            <th class="px-6 py-3 font-medium">Dibuat</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="p in permissions" :key="p.id" class="hover:bg-slate-50/50">
            <td class="px-6 py-4">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                :class="
                  p.type === 'sick'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-blue-100 text-blue-800'
                "
              >
                {{ p.type === "sick" ? "Sakit" : "Izin" }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex flex-col">
                <span>{{ formatDate(p.startDate) }}</span>
                <span
                  v-if="p.startDate !== p.endDate"
                  class="text-slate-400 text-xs"
                >
                  s.d {{ formatDate(p.endDate) }}
                </span>
              </div>
            </td>
            <td class="px-6 py-4 max-w-xs" :title="p.reason">
              <p class="line-clamp-2 text-slate-600">{{ p.reason }}</p>
            </td>
            <td class="px-6 py-4">
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-amber-100 text-amber-800': p.status === 'pending',
                  'bg-emerald-100 text-emerald-800': p.status === 'approved',
                  'bg-slate-100 text-slate-600': p.status === 'rejected',
                }"
              >
                <Icon :icon="statusIcon(p.status)" class="w-3.5 h-3.5" />
                <span class="capitalize">{{ formatStatus(p.status) }}</span>
              </span>
            </td>
            <td class="px-6 py-4 text-slate-400 text-xs">
              {{ new Date(p.createdAt).toLocaleDateString("id-ID") }}
            </td>
          </tr>
          <tr v-if="!loading && permissions.length === 0">
            <td colspan="5" class="px-6 py-12 text-center text-slate-400">
              <Icon
                icon="solar:document-text-line-duotone"
                class="w-12 h-12 mx-auto mb-3 opacity-50"
              />
              <p>Belum ada pengajuan izin.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Submission Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        @click="showModal = false"
      ></div>

      <!-- Content -->
      <div
        class="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div
          class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50"
        >
          <h3 class="font-bold text-lg text-slate-800">Form Pengajuan Izin</h3>
          <button
            @click="showModal = false"
            class="text-slate-400 hover:text-slate-600"
          >
            <Icon icon="solar:close-circle-bold" class="w-6 h-6" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-4">
          <!-- Type -->
          <div class="grid grid-cols-2 gap-4">
            <button
              type="button"
              class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
              :class="
                form.type === 'sick'
                  ? 'border-rose-500 bg-rose-50 text-rose-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              "
              @click="form.type = 'sick'"
            >
              <Icon icon="solar:medical-kit-bold-duotone" class="w-8 h-8" />
              <span class="font-medium">Sakit</span>
            </button>
            <button
              type="button"
              class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
              :class="
                form.type === 'permit'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              "
              @click="form.type = 'permit'"
            >
              <Icon icon="solar:clipboard-list-bold-duotone" class="w-8 h-8" />
              <span class="font-medium">Izin</span>
            </button>
          </div>

          <!-- Date Range -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Tanggal Mulai - Selesai</label
            >
            <div class="grid grid-cols-2 gap-2">
              <input
                type="date"
                v-model="form.startDate"
                class="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Mulai"
              />
              <input
                type="date"
                v-model="form.endDate"
                class="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Selesai"
              />
            </div>
          </div>

          <!-- Reason -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >Alasan</label
            >
            <textarea
              v-model="form.reason"
              rows="3"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Jelaskan alasan pengajuan..."
            ></textarea>
          </div>
        </div>

        <div
          class="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3"
        >
          <button
            @click="showModal = false"
            class="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium text-sm"
          >
            Batal
          </button>
          <button
            @click="submit"
            :disabled="submitting"
            class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center gap-2"
          >
            <Icon
              v-if="submitting"
              icon="lucide:loader-2"
              class="w-4 h-4 animate-spin"
            />
            {{ submitting ? "Mengirim..." : "Kirim Pengajuan" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { permissionsApi } from "@/services/api";

const permissions = ref([]);
const loading = ref(false);
const showModal = ref(false);
const submitting = ref(false);

const form = reactive({
  type: "sick",
  startDate: "",
  endDate: "",
  reason: "",
  attachment: "",
});

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(s) {
  if (s === "all") return "Semua";
  if (s === "pending") return "Menunggu";
  if (s === "approved") return "Disetujui";
  if (s === "rejected") return "Ditolak";
  return s;
}

function statusIcon(status) {
  if (status === "approved") return "solar:check-circle-bold";
  if (status === "rejected") return "solar:close-circle-bold";
  return "solar:clock-circle-bold";
}

async function fetchPermissions() {
  loading.value = true;
  try {
    const res = await permissionsApi.getMyPermissions();
    if (res.success) {
      permissions.value = res.data;
    }
  } catch (e) {
    console.error(e);
    alert(e.message || "Gagal memuat data perizinan.");
  } finally {
    loading.value = false;
  }
}

async function submit() {
  if (!form.startDate || !form.endDate || !form.reason) {
    alert("Mohon lengkapi semua field.");
    return;
  }

  submitting.value = true;
  try {
    await permissionsApi.submitPermission({
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason,
      attachment: form.attachment,
    });

    showModal.value = false;
    Object.assign(form, {
      type: "sick",
      startDate: "",
      endDate: "",
      reason: "",
      attachment: "",
    });
    fetchPermissions();
  } catch (e) {
    console.error(e);
    alert("Gagal mengirim pengajuan.");
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  fetchPermissions();
});
</script>
