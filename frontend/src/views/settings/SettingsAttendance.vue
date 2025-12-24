<template>
  <div class="max-w-4xl mx-auto">
    <div
      class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
    >
      <!-- Header -->
      <div
        class="px-4 md:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between"
      >
        <div>
          <h1 class="text-xl font-semibold text-slate-800">
            Pengaturan Lokasi Absensi
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Tentukan titik koordinat pusat untuk validasi lokasi absensi guru.
          </p>
        </div>
        <div class="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <Icon icon="lucide:map-pin" class="w-6 h-6" />
        </div>
      </div>

      <!-- Content -->
      <div class="p-4 md:p-6">
        <form @submit.prevent="saveSettings" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Latitude -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700"
                >Latitude (Garis Lintang)</label
              >
              <div class="relative">
                <input
                  v-model.number="settings.latitude"
                  type="number"
                  step="any"
                  inputmode="decimal"
                  placeholder="-6.123456"
                  class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                />
                <Icon
                  icon="lucide:globe"
                  class="absolute left-3 top-3 w-4 h-4 text-slate-400"
                />
              </div>
              <p class="text-xs text-slate-500">Contoh: -6.9175</p>
            </div>

            <!-- Longitude -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700"
                >Longitude (Garis Bujur)</label
              >
              <div class="relative">
                <input
                  v-model.number="settings.longitude"
                  type="number"
                  step="any"
                  inputmode="decimal"
                  placeholder="106.123456"
                  class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                />
                <Icon
                  icon="lucide:globe"
                  class="absolute left-3 top-3 w-4 h-4 text-slate-400"
                />
              </div>
              <p class="text-xs text-slate-500">Contoh: 107.6191</p>
            </div>

            <!-- Radius -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700"
                >Maksimal Jarak (Meter)</label
              >
              <div class="relative">
                <input
                  v-model.number="settings.radius"
                  type="number"
                  min="0"
                  inputmode="numeric"
                  placeholder="100"
                  class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                />
                <Icon
                  icon="lucide:circle-dashed"
                  class="absolute left-3 top-3 w-4 h-4 text-slate-400"
                />
              </div>
              <p class="text-xs text-slate-500">
                Jarak toleransi absensi dari titik pusat.
              </p>
            </div>
          </div>

          <!-- Current Location Helper -->
          <div
            class="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3"
          >
            <Icon
              icon="lucide:info"
              class="w-5 h-5 text-blue-600 shrink-0 mt-0.5"
            />
            <div class="flex-1">
              <h4 class="text-sm font-medium text-blue-800">
                Bantuan Penetapan Lokasi
              </h4>
              <p class="text-sm text-blue-600 mt-1 mb-3">
                Anda dapat menggunakan lokasi perangkat Anda saat ini sebagai
                titik pusat absensi.
              </p>
              <button
                type="button"
                @click="useCurrentLocation"
                class="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm font-medium transition-colors"
              >
                <Icon
                  v-if="loadingLoc"
                  icon="lucide:loader-2"
                  class="w-4 h-4 animate-spin"
                />
                <Icon v-else icon="lucide:crosshair" class="w-4 h-4" />
                Ambil Lokasi Saat Ini
              </button>
              <p v-if="locError" class="text-xs text-red-600 mt-2">
                {{ locError }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div
            class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100"
          >
            <div
              v-if="saved"
              class="flex items-center gap-2 text-green-600 text-sm font-medium mr-auto transition-all"
            >
              <Icon icon="lucide:check-circle" class="w-5 h-5" />
              Pengaturan berhasil disimpan
            </div>

            <button
              type="submit"
              class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-all flex items-center gap-2"
            >
              <Icon icon="lucide:save" class="w-4 h-4" />
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Activity Types Section -->
    <div
      class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6"
    >
      <div
        class="px-4 md:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between"
      >
        <div>
          <h2 class="text-xl font-semibold text-slate-800">Jenis Kegiatan</h2>
          <p class="text-sm text-slate-500 mt-1">
            Daftar jenis kegiatan yang dapat dipilih saat absensi masuk.
          </p>
        </div>
        <div class="p-2 bg-amber-50 text-amber-600 rounded-lg">
          <Icon icon="lucide:list-checks" class="w-6 h-6" />
        </div>
      </div>

      <div class="p-4 md:p-6">
        <!-- Add new activity -->
        <div class="flex gap-2 mb-4">
          <input
            v-model="newActivity"
            type="text"
            placeholder="Nama kegiatan baru..."
            @keyup.enter="addActivity"
            class="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none"
          />
          <button
            type="button"
            @click="addActivity"
            :disabled="!newActivity.trim()"
            class="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Icon icon="lucide:plus" class="w-4 h-4" />
            Tambah
          </button>
        </div>

        <!-- Activity list -->
        <div class="space-y-2">
          <div
            v-for="(activity, index) in settings.activityTypes"
            :key="index"
            class="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg border border-slate-200"
          >
            <span class="text-sm font-medium text-slate-700">{{
              activity
            }}</span>
            <button
              type="button"
              @click="removeActivity(index)"
              class="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            >
              <Icon icon="lucide:trash-2" class="w-4 h-4" />
            </button>
          </div>
          <div
            v-if="settings.activityTypes.length === 0"
            class="text-center py-6 text-slate-400 text-sm"
          >
            Belum ada jenis kegiatan. Tambahkan kegiatan baru di atas.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { Icon } from "@iconify/vue";

// Use local storage for now to persist settings
const settings = useLocalStorage("attendance-settings", {
  latitude: -6.175392, // Monas default
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

const loadingLoc = ref(false);
const locError = ref("");
const saved = ref(false);
const newActivity = ref("");

function useCurrentLocation() {
  loadingLoc.value = true;
  locError.value = "";

  if (!navigator.geolocation) {
    locError.value = "Browser tidak mendukung geolocation.";
    loadingLoc.value = false;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      settings.value.latitude = position.coords.latitude;
      settings.value.longitude = position.coords.longitude;
      loadingLoc.value = false;
    },
    (err) => {
      console.error(err);
      locError.value = "Gagal mengambil lokasi: " + err.message;
      loadingLoc.value = false;
    },
    { enableHighAccuracy: true }
  );
}

function addActivity() {
  const name = newActivity.value.trim();
  if (name && !settings.value.activityTypes.includes(name)) {
    settings.value.activityTypes.push(name);
    newActivity.value = "";
  }
}

function removeActivity(index) {
  settings.value.activityTypes.splice(index, 1);
}

function saveSettings() {
  // Trigger save specific logic if needed (localStorage auto-saves, but we might want to show feedback)
  saved.value = true;
  setTimeout(() => (saved.value = false), 3000);
}
</script>
