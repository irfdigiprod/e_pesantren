<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-slate-800">Persetujuan Izin</h1>
        <p class="text-sm text-slate-500 mt-1">
          Kelola pengajuan izin dari guru.
        </p>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2">
      <button
        v-for="flt in ['all', 'pending', 'approved', 'rejected']"
        :key="flt"
        @click="filterStatus = flt"
        class="px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
        :class="
          filterStatus === flt
            ? 'bg-slate-800 text-white shadow'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
        "
      >
        <span class="capitalize">{{ formatStatus(flt) }}</span>
        <span
          v-if="flt !== 'all'"
          class="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20"
        >
          {{ permissions.filter((p) => p.status === flt).length }}
        </span>
      </button>
    </div>

    <!-- Permission Table -->
    <div
      class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <table class="w-full text-sm text-left">
        <thead class="bg-slate-50 text-slate-500 border-b border-slate-100">
          <tr>
            <th class="px-6 py-3 font-medium">Nama Guru</th>
            <th class="px-6 py-3 font-medium">Jenis</th>
            <th class="px-6 py-3 font-medium">Tanggal</th>
            <th class="px-6 py-3 font-medium w-1/3">Alasan</th>
            <th class="px-6 py-3 font-medium">Status</th>
            <th class="px-6 py-3 font-medium text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="p in filteredPermissions"
            :key="p.id"
            class="hover:bg-slate-50/50"
          >
            <td class="px-6 py-4 font-medium text-slate-800">
              {{ p.teacherName || "-" }}
              <div
                v-if="p.teacherNip || p.teacherDivision"
                class="text-xs text-slate-400 font-normal"
              >
                <span v-if="p.teacherNip">{{ p.teacherNip }}</span>
                <span v-if="p.teacherNip && p.teacherDivision"> · </span>
                <span v-if="p.teacherDivision">{{ p.teacherDivision }}</span>
              </div>
            </td>
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
              <p class="text-xs text-slate-400 mt-1">
                {{ new Date(p.createdAt).toLocaleDateString("id-ID") }}
              </p>
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
            <td class="px-6 py-4 text-right">
              <div
                v-if="p.status === 'pending'"
                class="flex items-center justify-end gap-2"
              >
                <button
                  @click="updateStatus(p.id, 'approved')"
                  :disabled="processing === p.id"
                  class="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                  title="Setujui"
                >
                  <Icon
                    v-if="processing === p.id"
                    icon="lucide:loader-2"
                    class="w-4 h-4 animate-spin"
                  />
                  <Icon v-else icon="solar:check-circle-bold" class="w-4 h-4" />
                </button>
                <button
                  @click="updateStatus(p.id, 'rejected')"
                  :disabled="processing === p.id"
                  class="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                  title="Tolak"
                >
                  <Icon
                    v-if="processing !== p.id"
                    icon="solar:close-circle-bold"
                    class="w-4 h-4"
                  />
                </button>
              </div>
              <div v-else class="text-xs text-slate-400 italic">Selesai</div>
            </td>
          </tr>
          <tr v-if="!loading && filteredPermissions.length === 0">
            <td colspan="6" class="px-6 py-12 text-center text-slate-400">
              <Icon
                icon="solar:document-text-line-duotone"
                class="w-12 h-12 mx-auto mb-3 opacity-50"
              />
              <p>Tidak ada data pengajuan.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Approval Modal with Salary Toggle -->
    <Teleport to="body">
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="approvalModal.show"
          class="fixed inset-0 z-[9999] flex items-center justify-center px-4"
        >
          <div
            class="absolute inset-0 bg-black/40 backdrop-blur-sm"
            @click="approvalModal.show = false"
          ></div>

          <div
            class="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative z-10 text-center"
          >
            <!-- Icon -->
            <div
              class="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6"
              :class="
                approvalModal.isApprove
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-red-100 text-red-600'
              "
            >
              <Icon
                :icon="
                  approvalModal.isApprove
                    ? 'solar:check-circle-bold'
                    : 'solar:close-circle-bold'
                "
                width="48"
              />
            </div>

            <h3 class="text-xl font-bold text-slate-800 mb-2">
              {{
                approvalModal.isApprove
                  ? "Setujui Pengajuan?"
                  : "Tolak Pengajuan?"
              }}
            </h3>
            <p class="text-slate-500 text-sm mb-6">
              {{
                approvalModal.isApprove
                  ? "Pengajuan izin akan disetujui dan record absensi otomatis dibuat."
                  : "Pengajuan izin ini akan ditolak."
              }}
            </p>

            <!-- Salary Deduction Toggle (Only for Approve) -->
            <div
              v-if="approvalModal.isApprove"
              class="bg-slate-50 rounded-xl p-4 mb-6 text-left"
            >
              <p class="text-sm font-medium text-slate-700 mb-3">
                Potong Gaji?
              </p>
              <div class="flex gap-3">
                <button
                  @click="approvalModal.deductSalary = true"
                  class="flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all border-2"
                  :class="
                    approvalModal.deductSalary
                      ? 'border-rose-500 bg-rose-50 text-rose-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  "
                >
                  <Icon
                    icon="solar:minus-circle-bold"
                    class="w-5 h-5 inline mr-2"
                  />
                  Ya, Potong
                </button>
                <button
                  @click="approvalModal.deductSalary = false"
                  class="flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all border-2"
                  :class="
                    !approvalModal.deductSalary
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  "
                >
                  <Icon
                    icon="solar:check-circle-bold"
                    class="w-5 h-5 inline mr-2"
                  />
                  Tidak Potong
                </button>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <button
                @click="approvalModal.show = false"
                class="flex-1 py-3 px-6 rounded-xl font-bold transition-all border-2 border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                @click="executeAction"
                :disabled="processing !== null"
                class="flex-1 py-3 px-6 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50"
                :class="
                  approvalModal.isApprove
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                "
              >
                <span
                  v-if="processing"
                  class="flex items-center justify-center gap-2"
                >
                  <Icon
                    icon="solar:spinner-line-duotone"
                    class="animate-spin"
                    width="20"
                  />
                  Memproses...
                </span>
                <span v-else>
                  {{ approvalModal.isApprove ? "Ya, Setujui" : "Ya, Tolak" }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { Icon } from "@iconify/vue";
import { permissionsApi } from "@/services/api";

const permissions = ref([]);
const loading = ref(false);
const processing = ref(null);
const filterStatus = ref("all");

// Approval Modal State
const approvalModal = reactive({
  show: false,
  isApprove: true,
  deductSalary: true, // Default: potong gaji
  actionId: null,
});

const filteredPermissions = computed(() => {
  if (filterStatus.value === "all") return permissions.value;
  return permissions.value.filter((p) => p.status === filterStatus.value);
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
  } finally {
    loading.value = false;
  }
}

function updateStatus(id, status) {
  approvalModal.isApprove = status === "approved";
  approvalModal.deductSalary = true; // Reset to default
  approvalModal.actionId = id;
  approvalModal.show = true;
}

async function executeAction() {
  if (!approvalModal.actionId) return;

  const id = approvalModal.actionId;
  const status = approvalModal.isApprove ? "approved" : "rejected";
  processing.value = id;

  try {
    await permissionsApi.updateStatus(id, status, approvalModal.deductSalary);
    // Optimistic update
    const idx = permissions.value.findIndex((p) => p.id === id);
    if (idx !== -1) {
      permissions.value[idx].status = status;
    }
  } catch (e) {
    console.error(e);
  } finally {
    processing.value = null;
    approvalModal.show = false;
    approvalModal.actionId = null;
  }
}

onMounted(() => {
  fetchPermissions();
});
</script>
