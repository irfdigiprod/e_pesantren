<!-- src/views/About.vue -->
<template>
  <div class="max-w-4xl mx-auto pb-12">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-800">Tentang Aplikasi</h1>
      <p class="text-slate-500 mt-1">
        Informasi lengkap tentang sistem manajemen pesantren
      </p>
    </div>

    <!-- SKELETON LOADING -->
    <div v-if="isLoading" class="animate-pulse space-y-6">
      <!-- App Info Card Skeleton -->
      <div
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div class="p-6 border-b border-slate-100 h-32 bg-slate-200"></div>
        <div class="p-6 space-y-4">
          <div class="h-4 bg-slate-200 rounded w-1/4"></div>
          <div class="h-4 bg-slate-200 rounded w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-3/4"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
            <div
              v-for="i in 6"
              :key="i"
              class="h-16 bg-slate-200 rounded-lg"
            ></div>
          </div>
        </div>
      </div>

      <!-- Tech Stack Skeleton -->
      <div
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-64"
      >
        <div class="p-6 border-b border-slate-100 h-14 bg-slate-100"></div>
        <div class="p-6 space-y-4">
          <div class="h-8 bg-slate-200 rounded w-full"></div>
          <div class="h-8 bg-slate-200 rounded w-3/4"></div>
        </div>
      </div>
    </div>

    <!-- REAL CONTENT -->
    <div v-else>
      <!-- App Info Card -->
      <div
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6"
      >
        <div
          class="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-purple-600"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-16 h-16 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden"
            >
              <img
                v-if="logoUrl"
                :src="logoUrl"
                alt="Logo"
                class="w-full h-full object-contain p-2"
              />
              <Icon v-else icon="lucide:book-open" class="w-8 h-8 text-white" />
            </div>
            <div class="text-white">
              <h2 class="text-xl font-bold">{{ institutionName }}</h2>
              <p class="text-white/80 text-sm">Sistem Manajemen Pesantren</p>
              <p class="text-white/60 text-xs mt-1">Versi 1.0.0</p>
            </div>
          </div>
        </div>

        <div class="p-6">
          <h3 class="font-semibold text-slate-800 mb-3">Deskripsi</h3>
          <p class="text-slate-600 text-sm leading-relaxed mb-6">
            Sistem Manajemen Pesantren adalah aplikasi terintegrasi yang
            dirancang khusus untuk membantu pengelolaan operasional pesantren
            secara digital. Aplikasi ini mencakup berbagai modul untuk manajemen
            santri, guru, akademik, keuangan, absensi, dan komunikasi.
          </p>

          <h3 class="font-semibold text-slate-800 mb-3">Fitur Utama</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div
                class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"
              >
                <Icon icon="lucide:users" class="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p class="font-medium text-slate-700 text-sm">
                  Manajemen Santri
                </p>
                <p class="text-xs text-slate-500">Data santri lengkap</p>
              </div>
            </div>
            <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div
                class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"
              >
                <Icon
                  icon="lucide:graduation-cap"
                  class="w-5 h-5 text-green-600"
                />
              </div>
              <div>
                <p class="font-medium text-slate-700 text-sm">Manajemen Guru</p>
                <p class="text-xs text-slate-500">Data tenaga pengajar</p>
              </div>
            </div>
            <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div
                class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"
              >
                <Icon
                  icon="lucide:calendar-check"
                  class="w-5 h-5 text-amber-600"
                />
              </div>
              <div>
                <p class="font-medium text-slate-700 text-sm">Sistem Absensi</p>
                <p class="text-xs text-slate-500">Kehadiran real-time</p>
              </div>
            </div>
            <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div
                class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"
              >
                <Icon icon="lucide:wallet" class="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p class="font-medium text-slate-700 text-sm">
                  Manajemen Keuangan
                </p>
                <p class="text-xs text-slate-500">Penggajian & laporan</p>
              </div>
            </div>
            <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div
                class="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center"
              >
                <Icon
                  icon="lucide:message-circle"
                  class="w-5 h-5 text-rose-600"
                />
              </div>
              <div>
                <p class="font-medium text-slate-700 text-sm">
                  Chat & Komunikasi
                </p>
                <p class="text-xs text-slate-500">Pesan real-time</p>
              </div>
            </div>
            <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div
                class="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center"
              >
                <Icon icon="lucide:file-text" class="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p class="font-medium text-slate-700 text-sm">
                  Laporan & Export
                </p>
                <p class="text-xs text-slate-500">Export ke Excel</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tech Stack -->
      <div
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6"
      >
        <div class="p-6 border-b border-slate-100">
          <h2 class="font-semibold text-slate-800 flex items-center gap-2">
            <Icon icon="lucide:code-2" class="w-5 h-5 text-indigo-600" />
            Teknologi yang Digunakan
          </h2>
        </div>
        <div class="p-6">
          <!-- Frontend -->
          <div class="mb-6">
            <h3
              class="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3"
            >
              Frontend
            </h3>
            <div class="flex flex-wrap gap-2">
              <span
                class="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium flex items-center gap-1.5"
              >
                <Icon icon="logos:vue" class="w-4 h-4" />
                Vue.js 3
              </span>
              <span
                class="px-3 py-1.5 bg-sky-50 text-sky-700 rounded-lg text-sm font-medium flex items-center gap-1.5"
              >
                <Icon icon="logos:tailwindcss-icon" class="w-4 h-4" />
                Tailwind CSS
              </span>
              <span
                class="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium flex items-center gap-1.5"
              >
                <Icon icon="logos:vitejs" class="w-4 h-4" />
                Vite
              </span>
              <span
                class="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium flex items-center gap-1.5"
              >
                <Icon icon="logos:pinia" class="w-4 h-4" />
                Pinia
              </span>
              <span
                class="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-1.5"
              >
                <Icon icon="simple-icons:iconify" class="w-4 h-4" />
                Iconify
              </span>
            </div>
          </div>

          <!-- Backend -->
          <div class="mb-6">
            <h3
              class="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3"
            >
              Backend
            </h3>
            <div class="flex flex-wrap gap-2">
              <span
                class="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium flex items-center gap-1.5"
              >
                <Icon icon="logos:hono" class="w-4 h-4" />
                Hono.js
              </span>
              <span
                class="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium flex items-center gap-1.5"
              >
                <Icon icon="logos:bun" class="w-4 h-4" />
                Bun Runtime
              </span>
              <span
                class="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-1.5"
              >
                <Icon icon="simple-icons:drizzle" class="w-4 h-4" />
                Drizzle ORM
              </span>
              <span
                class="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-1.5"
              >
                <Icon icon="logos:mysql" class="w-4 h-4" />
                MySQL
              </span>
              <span
                class="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium flex items-center gap-1.5"
              >
                <Icon icon="simple-icons:zod" class="w-4 h-4" />
                Zod Validation
              </span>
            </div>
          </div>

          <!-- Real-time & Other -->
          <div>
            <h3
              class="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3"
            >
              Real-time & Lainnya
            </h3>
            <div class="flex flex-wrap gap-2">
              <span
                class="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-1.5"
              >
                <Icon icon="simple-icons:websocket" class="w-4 h-4" />
                WebSocket
              </span>
              <span
                class="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-1.5"
              >
                <Icon icon="simple-icons:microsoftexcel" class="w-4 h-4" />
                ExcelJS
              </span>
              <span
                class="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-1.5"
              >
                <Icon icon="logos:jwt-icon" class="w-4 h-4" />
                JWT Auth
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Developer Info -->
      <div
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div class="p-6 border-b border-slate-100">
          <h2 class="font-semibold text-slate-800 flex items-center gap-2">
            <Icon icon="lucide:user-circle" class="w-5 h-5 text-indigo-600" />
            Pengembang
          </h2>
        </div>
        <div class="p-6">
          <div class="flex items-center gap-4">
            <div
              class="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg"
            >
              IA
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-lg">Irfan Alkhotiri</h3>
              <p class="text-slate-500 text-sm">Full Stack Developer</p>
              <div class="flex items-center gap-3 mt-2">
                <a
                  href="#"
                  class="text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <Icon icon="lucide:github" class="w-5 h-5" />
                </a>
                <a
                  href="#"
                  class="text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <Icon icon="lucide:linkedin" class="w-5 h-5" />
                </a>
                <a
                  href="#"
                  class="text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <Icon icon="lucide:mail" class="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          <div class="mt-6 p-4 bg-slate-50 rounded-lg">
            <p class="text-sm text-slate-600 italic">
              "Aplikasi ini dikembangkan dengan dedikasi tinggi untuk membantu
              pesantren dalam mengelola operasional sehari-hari secara modern
              dan efisien."
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-8 text-center text-sm text-slate-400">
        <p>© {{ currentYear }} {{ institutionName }}. All rights reserved.</p>
        <p class="mt-1">Made with ❤️ by Irfan Alkhotiri</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { ref, computed, onMounted } from "vue";
import { settingsApi } from "@/services/api.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const isLoading = ref(true);
const currentYear = new Date().getFullYear();
const institutionName = ref("Sistem Manajemen Pesantren");
const institutionLogo = ref("");

const logoUrl = computed(() => {
  if (!institutionLogo.value) return null;
  if (institutionLogo.value.startsWith("uploads/")) {
    return `${BASE_URL}/api/${institutionLogo.value}`;
  }
  if (institutionLogo.value.startsWith("/api/uploads")) {
    return `${BASE_URL}${institutionLogo.value}`;
  }
  return institutionLogo.value;
});

async function loadInstitutionInfo() {
  isLoading.value = true;
  try {
    const res = await settingsApi.getAll([
      "institution_name",
      "institution_logo",
    ]);
    if (res.success && res.data) {
      if (res.data.institution_name) {
        institutionName.value = res.data.institution_name;
      }
      if (res.data.institution_logo) {
        institutionLogo.value = res.data.institution_logo;
      }
    }
  } catch (e) {
    console.warn("Could not load institution info:", e);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadInstitutionInfo();
});
</script>
