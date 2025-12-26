<template>
  <footer class="border-t border-slate-200 mt-4">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="py-6">
        <!-- Main Footer Content -->
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <!-- Branding & Copyright -->
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl from-indigo-600 to-indigo-700 flex items-center justify-center shadow-sm overflow-hidden"
            >
              <img
                v-if="logoUrl"
                :src="logoUrl"
                alt="Logo"
                class="w-full h-full object-contain p-1"
              />
              <Icon v-else icon="lucide:book-open" class="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 class="font-bold text-slate-800">{{ institutionName }}</h3>
              <p class="text-xs text-slate-500">Sistem Manajemen Pesantren</p>
            </div>
          </div>

          <!-- Links -->
          <div class="flex flex-wrap items-center gap-6 text-sm">
            <a
              href="#"
              class="text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Tentang Kami
            </a>
            <a
              href="#"
              class="text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Bantuan
            </a>
            <a
              href="#"
              class="text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Kebijakan Privasi
            </a>
            <a
              href="#"
              class="text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Syarat & Ketentuan
            </a>
          </div>

          <!-- Social Links -->
          <div class="flex items-center gap-2">
            <a
              href="#"
              class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Facebook"
            >
              <Icon icon="lucide:facebook" class="w-5 h-5" />
            </a>
            <a
              href="#"
              class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Instagram"
            >
              <Icon icon="lucide:instagram" class="w-5 h-5" />
            </a>
            <a
              href="#"
              class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="YouTube"
            >
              <Icon icon="lucide:youtube" class="w-5 h-5" />
            </a>
            <a
              href="mailto:info@minhajulhaq.sch.id"
              class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Email"
            >
              <Icon icon="lucide:mail" class="w-5 h-5" />
            </a>
          </div>
        </div>

        <!-- Divider -->
        <div class="border-t border-slate-100 mt-6 pt-6">
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-400"
          >
            <p>
              © {{ currentYear }} {{ foundationName }}. All rights reserved.
            </p>
            <p class="flex items-center gap-1">
              Made with
              <Icon icon="lucide:heart" class="w-3.5 h-3.5 text-rose-500" />
              by
              <a href="#" class="text-indigo-600 hover:underline font-medium">
                Irfan Alkhotiri
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { ref, computed, onMounted } from "vue";
import { settingsApi } from "@/services/api.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const currentYear = new Date().getFullYear();
const institutionName = ref("Minhajul Haq");
const foundationName = ref("Yayasan Minhajul Haq");
const institutionLogo = ref("");

// Computed logo URL
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
  try {
    const res = await settingsApi.getAll([
      "institution_name",
      "foundation_name",
      "institution_logo",
    ]);
    if (res.success && res.data) {
      if (res.data.institution_name) {
        institutionName.value = res.data.institution_name;
      }
      if (res.data.foundation_name) {
        foundationName.value = res.data.foundation_name;
      }
      if (res.data.institution_logo) {
        institutionLogo.value = res.data.institution_logo;
      }
    }
  } catch (e) {
    console.warn("Could not load institution info:", e);
  }
}

onMounted(() => {
  loadInstitutionInfo();
});
</script>
