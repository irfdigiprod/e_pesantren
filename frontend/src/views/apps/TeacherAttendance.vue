<template>
  <div class="min-h-screen bg-slate-100 p-4">
    <!-- Header with Clock -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-lg font-bold text-slate-800">Absensi Guru</h1>
      <div
        class="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm text-sm text-slate-600"
      >
        <Icon icon="lucide:clock" class="w-4 h-4 text-amber-500" />
        <span class="font-semibold font-mono">{{ currentTime }}</span>
      </div>
    </div>

    <!-- Check In/Out Cards -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <!-- Masuk Card -->
      <div class="bg-white rounded-2xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          <span class="text-xs text-slate-600 font-medium">Masuk</span>
          <span class="text-xs text-slate-400 ml-auto">{{
            distance !== null ? formatDistance(distance) : "..."
          }}</span>
          <Icon
            v-if="isWithinRadius"
            icon="lucide:map-pin"
            class="w-3 h-3 text-emerald-500"
          />
        </div>

        <!-- Activity Selection -->
        <div v-if="!todayAttendance?.checkIn || newShiftAllowed" class="mb-3">
          <select
            v-model="selectedActivity"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:border-amber-500 focus:ring-1 focus:ring-amber-200 transition-all outline-none"
          >
            <option value="" disabled>Pilih Kegiatan</option>
            <option
              v-for="activity in settings.activityTypes"
              :key="activity"
              :value="activity"
            >
              {{ activity }}
            </option>
          </select>
        </div>

        <!-- Time Display -->
        <div class="text-center mb-4" v-else>
          <div
            class="text-2xl font-bold text-slate-800 tracking-wider font-mono"
          >
            {{ todayAttendance?.checkIn || "──:──" }}
          </div>
          <div class="text-xs text-slate-400 mt-1">
            {{ todayAttendance?.checkIn ? "Tercatat" : "Belum absen" }}
          </div>
        </div>

        <button
          @click="handleCheckIn"
          :disabled="
            saving ||
            !selectedActivity ||
            (!!todayAttendance?.checkIn && !newShiftAllowed) ||
            !isWithinRadius ||
            distance === null
          "
          class="w-full py-2.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2"
          :class="
            (todayAttendance?.checkIn && !newShiftAllowed) || !selectedActivity
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : isWithinRadius
              ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-md'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          "
        >
          <span
            v-if="
              !saving &&
              (!todayAttendance?.checkIn || newShiftAllowed) &&
              selectedActivity
            "
            class="w-2 h-2 rounded-full bg-white"
          ></span>
          <Icon
            v-if="saving"
            icon="lucide:loader-2"
            class="w-4 h-4 animate-spin"
          />
          <span>Masuk</span>
        </button>
      </div>

      <!-- Pulang Card -->
      <div class="bg-white rounded-2xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          <span class="text-xs text-slate-600 font-medium">Pulang</span>
          <span class="text-xs text-slate-400 ml-auto">{{
            distance !== null ? formatDistance(distance) : "..."
          }}</span>
          <Icon
            v-if="isWithinRadius"
            icon="lucide:map-pin"
            class="w-3 h-3 text-emerald-500"
          />
        </div>

        <!-- Time Display -->
        <div class="text-center mb-4">
          <div
            class="text-2xl font-bold text-slate-800 tracking-wider font-mono"
          >
            {{ todayAttendance?.checkOut || "──:──" }}
          </div>
          <div class="text-xs text-slate-400 mt-1">
            {{ todayAttendance?.checkOut ? "Tercatat" : "Belum absen" }}
          </div>
        </div>

        <button
          @click="handleCheckOut"
          :disabled="
            saving ||
            !todayAttendance?.checkIn ||
            !!todayAttendance?.checkOut ||
            !isWithinRadius ||
            distance === null
          "
          class="w-full py-2.5 rounded-full text-sm font-semibold transition-all"
          :class="
            !!todayAttendance?.checkOut
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : isWithinRadius && todayAttendance?.checkIn
              ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          "
        >
          <Icon
            v-if="saving"
            icon="lucide:loader-2"
            class="w-4 h-4 animate-spin inline mr-1"
          />
          <span>Pulang</span>
        </button>
      </div>
    </div>

    <!-- Today's Activity Section -->
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div
        class="flex items-center justify-between px-4 py-3 border-b border-slate-100"
      >
        <div class="flex items-center gap-2">
          <Icon icon="lucide:calendar" class="w-5 h-5 text-slate-400" />
          <span class="text-sm font-medium text-slate-700">
            {{ showFullHistory ? "Riwayat Absensi Saya" : "Kegiatan hari ini" }}
            <span v-if="!showFullHistory">, {{ formattedToday }}</span>
          </span>
        </div>
        <button
          @click="showFullHistory = !showFullHistory"
          class="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          :title="showFullHistory ? 'Tampilan Ringkas' : 'Lihat Semua Riwayat'"
        >
          <Icon
            :icon="
              showFullHistory ? 'lucide:layout-grid' : 'lucide:calendar-days'
            "
            class="w-5 h-5 text-amber-500"
          />
        </button>
      </div>

      <!-- Compact View (Today only) -->
      <div v-if="!showFullHistory" class="divide-y divide-slate-100">
        <div
          v-if="todayRecords.length === 0"
          class="px-4 py-8 text-center text-slate-400 text-sm"
        >
          Belum ada absensi kegiatan !
        </div>

        <div
          v-for="item in todayRecords"
          :key="item.id"
          class="px-4 py-3 flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center"
              :class="
                item.checkOut
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-amber-100 text-amber-600'
              "
            >
              <Icon
                :icon="item.checkOut ? 'lucide:check' : 'lucide:clock'"
                class="w-4 h-4"
              />
            </div>
            <div>
              <p class="text-sm font-medium text-slate-800">
                {{ item.checkIn }} - {{ item.checkOut || "..." }}
                <span v-if="item.activity" class="ml-1 text-xs text-slate-500"
                  >({{ item.activity }})</span
                >
              </p>
              <p class="text-xs text-slate-400">
                {{ item.checkOut ? "Selesai" : "Sedang berlangsung" }}
              </p>
              <p
                v-if="item.checkInLatitude || item.checkOutLatitude"
                class="text-xs text-slate-400 mt-0.5"
              >
                <span v-if="item.checkInLatitude">
                  Masuk:
                  {{
                    calculateDistanceFromCoords(
                      item.checkInLatitude,
                      item.checkInLongitude
                    )
                  }}
                </span>
                <span v-if="item.checkOutLatitude" class="ml-2">
                  Pulang:
                  {{
                    calculateDistanceFromCoords(
                      item.checkOutLatitude,
                      item.checkOutLongitude
                    )
                  }}
                </span>
              </p>
            </div>
          </div>
          <span
            class="px-2 py-1 text-xs font-medium rounded-full"
            :class="
              item.status === 'present'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            "
          >
            {{ item.status === "present" ? "Hadir" : item.status }}
          </span>
        </div>
      </div>

      <!-- Full Table View (All user's records) -->
      <div v-else>
        <!-- Mobile: Card View -->
        <div class="md:hidden divide-y divide-slate-100">
          <div
            v-for="item in myAttendances"
            :key="item.id"
            class="p-4 space-y-2"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-slate-800">{{
                formatDate(item.date)
              }}</span>
              <span
                class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-emerald-100 text-emerald-700': item.status === 'present',
                  'bg-amber-100 text-amber-700': item.status === 'late',
                  'bg-rose-100 text-rose-700': item.status === 'absent',
                }"
              >
                {{ item.status === "present" ? "Hadir" : item.status }}
              </span>
            </div>
            <div class="flex items-center gap-4 text-sm">
              <div>
                <span class="text-slate-400">Masuk:</span>
                <span class="ml-1 text-emerald-600 font-medium">{{
                  item.checkIn || "-"
                }}</span>
                <span
                  v-if="item.checkInLatitude"
                  class="text-xs text-slate-400 ml-1"
                >
                  ({{
                    calculateDistanceFromCoords(
                      item.checkInLatitude,
                      item.checkInLongitude
                    )
                  }})
                </span>
              </div>
              <div>
                <span class="text-slate-400">Pulang:</span>
                <span class="ml-1 text-rose-600 font-medium">{{
                  item.checkOut || "-"
                }}</span>
                <span
                  v-if="item.checkOutLatitude"
                  class="text-xs text-slate-400 ml-1"
                >
                  ({{
                    calculateDistanceFromCoords(
                      item.checkOutLatitude,
                      item.checkOutLongitude
                    )
                  }})
                </span>
              </div>
            </div>
          </div>
          <div
            v-if="myAttendances.length === 0"
            class="p-8 text-center text-slate-400 text-sm"
          >
            Belum ada data absensi.
          </div>
        </div>

        <!-- Desktop: Table View -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr
                class="text-left text-xs font-semibold text-slate-500 bg-slate-50 uppercase tracking-wider border-b border-slate-100"
              >
                <th class="px-4 py-3">Tanggal</th>
                <th class="px-4 py-3">Masuk</th>
                <th class="px-4 py-3">Jarak Masuk</th>
                <th class="px-4 py-3">Pulang</th>
                <th class="px-4 py-3">Jarak Pulang</th>
                <th class="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="item in myAttendances"
                :key="item.id"
                class="hover:bg-slate-50/50 transition-colors"
              >
                <td class="px-4 py-3 font-medium text-slate-900">
                  {{ formatDate(item.date) }}
                </td>
                <td class="px-4 py-3 text-emerald-600 font-medium">
                  {{ item.checkIn || "-" }}
                </td>
                <td class="px-4 py-3 text-slate-500 text-xs">
                  {{
                    item.checkInLatitude
                      ? calculateDistanceFromCoords(
                          item.checkInLatitude,
                          item.checkInLongitude
                        )
                      : "-"
                  }}
                </td>
                <td class="px-4 py-3 text-rose-600 font-medium">
                  {{ item.checkOut || "-" }}
                </td>
                <td class="px-4 py-3 text-slate-500 text-xs">
                  {{
                    item.checkOutLatitude
                      ? calculateDistanceFromCoords(
                          item.checkOutLatitude,
                          item.checkOutLongitude
                        )
                      : "-"
                  }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                    :class="{
                      'bg-emerald-100 text-emerald-800':
                        item.status === 'present',
                      'bg-amber-100 text-amber-800': item.status === 'late',
                      'bg-rose-100 text-rose-800': item.status === 'absent',
                    }"
                  >
                    {{ item.status === "present" ? "Hadir" : item.status }}
                  </span>
                </td>
              </tr>
              <tr v-if="myAttendances.length === 0">
                <td colspan="6" class="px-4 py-8 text-center text-slate-400">
                  Belum ada data absensi.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- New Session Button (when checked out) -->
    <div
      v-if="todayAttendance?.checkOut && !newShiftAllowed && isWithinRadius"
      class="mt-4 text-center"
    >
      <button
        @click="enableNewShift"
        class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium hover:bg-indigo-100 transition-colors"
      >
        <Icon icon="lucide:plus" class="w-4 h-4" />
        Mulai Shift Baru
      </button>
    </div>

    <!-- Location Error Alert -->
    <div
      v-if="locationError"
      class="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2"
    >
      <Icon
        icon="lucide:alert-circle"
        class="w-4 h-4 text-red-500 shrink-0 mt-0.5"
      />
      <p class="text-xs text-red-600">{{ locationError }}</p>
    </div>

    <!-- Status Modal -->
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
import { ref, onMounted, onUnmounted, computed, reactive } from "vue";
import { Icon } from "@iconify/vue";
import { attendanceApi, authApi, teachersApi } from "@/services/api.js";
import { useLocalStorage, useDateFormat, useNow } from "@vueuse/core";
import StatusModal from "@/components/ui/StatusModal.vue";

// State
const attendances = ref([]);
const loading = ref(false);
const saving = ref(false);
const distance = ref(null);
const locationError = ref("");
// Reactive current time (full Date object)
const now = useNow();

// Formatted time string for header clock
const currentTime = useDateFormat(now, "HH:mm:ss");

const showFullHistory = ref(false);
const selectedActivity = ref("");
const newShiftAllowed = ref(false);

// Status Modal State
const statusModal = reactive({
  open: false,
  type: "success",
  title: "",
  message: "",
});

function showStatus(type, title, message) {
  statusModal.type = type;
  statusModal.title = title;
  statusModal.message = message;
  statusModal.open = true;
}

// Settings from localStorage
const settings = useLocalStorage("attendance-settings", {
  latitude: -6.175392,
  longitude: 106.827153,
  radius: 100,
  activityTypes: ["Mengajar", "Piket", "Rapat", "Kegiatan Lainnya"],
});

// Ensure activityTypes exists for older localStorage data
if (!settings.value.activityTypes) {
  settings.value.activityTypes = [
    "Mengajar",
    "Piket",
    "Rapat",
    "Kegiatan Lainnya",
  ];
}

// Geolocation
let geoId;
const currentPos = ref({ lat: null, lng: null });

const isWithinRadius = computed(() => {
  if (distance.value === null) return false;
  return distance.value <= settings.value.radius;
});

// Formatted today's date
const formattedToday = computed(() => {
  return new Date(now.value).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

// Helper: Haversine Formula
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371e3;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function formatDistance(meters) {
  if (meters >= 1000) return (meters / 1000).toFixed(2) + " km";
  return Math.round(meters) + " m";
}

// Calculate distance from saved coordinates to settings location
function calculateDistanceFromCoords(lat, lng) {
  const dist = getDistanceFromLatLonInMeters(
    Number(lat),
    Number(lng),
    settings.value.latitude,
    settings.value.longitude
  );
  return formatDistance(dist);
}

// Get user info and teacher info
const currentUser = ref(null);
const currentTeacher = ref(null);

async function fetchUser() {
  try {
    const res = await authApi.getCurrentUser();
    currentUser.value = res.data;

    // Fetch teacher record by userId to get correct teacher.id
    if (currentUser.value?.id) {
      const teacherRes = await teachersApi.getAll({
        userId: currentUser.value.id,
      });
      if (teacherRes?.data?.length > 0) {
        currentTeacher.value = teacherRes.data[0];
      }
    }
  } catch (e) {
    console.error("Failed to get user", e);
  }
}

// Today's date string
const todayString = computed(() => {
  const currentDate = new Date(now.value); // Reactive source
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
});

// Today's records
const todayRecords = computed(() => {
  return attendances.value
    .filter((a) => a.date && String(a.date).startsWith(todayString.value))
    .sort((a, b) => b.id - a.id);
});

// Today attendance (latest)
const todayAttendance = computed(() => {
  if (todayRecords.value.length === 0) return null;
  return todayRecords.value[0];
});

// All user's attendances (sorted by date desc)
const myAttendances = computed(() => {
  return attendances.value.slice().sort((a, b) => {
    // Sort by date descending, then by id descending
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateB - dateA !== 0) return dateB - dateA;
    return b.id - a.id;
  });
});

// Format date for display
function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function fetchData() {
  loading.value = true;
  try {
    // Only fetch attendance for the logged-in teacher
    const teacherId = currentTeacher.value?.id;
    const params = teacherId ? { teacherId } : {};
    const res = await attendanceApi.getTeacherAttendance(params);
    attendances.value = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function handleCheckIn() {
  if (!isWithinRadius.value) {
    showStatus("error", "Gagal", "Anda berada di luar radius absensi.");
    return;
  }

  if (!selectedActivity.value) {
    showStatus("error", "Gagal", "Pilih jenis kegiatan terlebih dahulu.");
    return;
  }

  saving.value = true;
  try {
    const payload = {
      teacherId: currentTeacher.value?.id,
      checkInTime: new Date().toTimeString().slice(0, 5),
      latitude: currentPos.value.lat,
      longitude: currentPos.value.lng,
      distance: distance.value,
      activity: selectedActivity.value,
    };
    await attendanceApi.teacherCheckIn(payload);
    showStatus("success", "Berhasil", "Check In berhasil!");
    // Reset states after successful check-in
    newShiftAllowed.value = false;
    selectedActivity.value = "";
    await fetchData();
  } catch (e) {
    showStatus("error", "Error", e.message || "Gagal Check In");
  } finally {
    saving.value = false;
  }
}

// Enable new shift (just sets the flag, doesn't auto check-in)
function enableNewShift() {
  newShiftAllowed.value = true;
  selectedActivity.value = "";
}

async function handleCheckOut() {
  if (!isWithinRadius.value) {
    showStatus("error", "Gagal", "Anda berada di luar radius absensi.");
    return;
  }

  saving.value = true;
  try {
    const payload = {
      teacherId: currentTeacher.value?.id,
      checkOutTime: new Date().toTimeString().slice(0, 5),
      latitude: currentPos.value.lat,
      longitude: currentPos.value.lng,
      distance: distance.value,
    };
    await attendanceApi.teacherCheckOut(payload);
    showStatus("success", "Berhasil", "Check Out berhasil!");
    await fetchData();
  } catch (e) {
    showStatus("error", "Error", e.message || "Gagal Check Out");
  } finally {
    saving.value = false;
  }
}

async function startNewSession() {
  await handleCheckIn();
}

function startGeolocation() {
  if (!navigator.geolocation) {
    locationError.value = "Browser tidak mendukung Geolocation.";
    return;
  }

  geoId = navigator.geolocation.watchPosition(
    (pos) => {
      currentPos.value = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      distance.value = getDistanceFromLatLonInMeters(
        pos.coords.latitude,
        pos.coords.longitude,
        settings.value.latitude,
        settings.value.longitude
      );
      locationError.value = "";
    },
    (err) => {
      console.error(err);
      locationError.value = "Gagal memantau lokasi: " + err.message;
      distance.value = null;
    },
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
  );
}

onMounted(async () => {
  await fetchUser();
  await fetchData();
  startGeolocation();
});

onUnmounted(() => {
  if (geoId) navigator.geolocation.clearWatch(geoId);
});
</script>
