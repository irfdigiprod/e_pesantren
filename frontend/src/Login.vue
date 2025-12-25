<!-- src/views/Login.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50">
    <div class="w-full max-w-md mx-4">
      <div class="bg-white rounded-2xl shadow-md overflow-hidden">
        <div class="py-8 px-8 flex flex-col items-center justify-center">
          <img
            v-if="logoUrl"
            :src="logoUrl"
            alt="Logo"
            class="w-28 h-28 object-contain mb-4"
          />
          <img
            v-else
            src="/iconku.svg"
            alt="Logo"
            class="w-28 h-28 object-contain mb-4"
          />
          <h1 class="text-2xl font-semibold text-slate-800">Selamat Datang</h1>
          <p class="text-sm text-slate-500 mt-1">
            {{ institutionName }}
          </p>
        </div>

        <form class="px-8 pb-8" @submit.prevent="handleLogin" novalidate>
          <div class="space-y-4">
            <!-- email -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Email</label
              >
              <input
                v-model="form.email"
                type="email"
                :class="inputClass('email')"
                placeholder="nama@mail.com"
                autocomplete="email"
              />
              <p v-if="fieldErrors.email" class="mt-1 text-sm text-red-600">
                {{ fieldErrors.email }}
              </p>
            </div>

            <!-- password -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Password</label
              >
              <input
                v-model="form.password"
                type="password"
                :class="inputClass('password')"
                placeholder="••••••••"
                autocomplete="current-password"
              />
              <p v-if="fieldErrors.password" class="mt-1 text-sm text-red-600">
                {{ fieldErrors.password }}
              </p>
            </div>
          </div>

          <p v-if="serverError" class="mt-4 text-center text-red-600 text-sm">
            {{ serverError }}
          </p>

          <div class="mt-6">
            <button
              :disabled="isLoading"
              type="submit"
              class="w-full px-4 py-2 rounded-lg bg-primary-600 text-white font-medium shadow-sm hover:bg-primary-700 disabled:opacity-60"
            >
              <span v-if="!isLoading">Masuk</span>
              <span v-else>Memproses…</span>
            </button>
          </div>

          <p class="mt-4 text-center text-sm text-slate-500">
            Belum punya akun?
            <router-link
              to="/register"
              class="text-primary-600 font-medium hover:underline"
              >Daftar</router-link
            >
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { authApi, settingsApi } from "@/services/api.js";

const router = useRouter();
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Institution info
const institutionName = ref("Silakan masuk untuk melanjutkan");
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
    const res = await settingsApi.getPublic();
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
  }
}

const form = reactive({
  email: "",
  password: "",
});

const isLoading = ref(false);
const serverError = ref("");

const fieldErrors = reactive({
  email: "",
  password: "",
});

function inputClass(field) {
  const base = "w-full px-4 py-2 rounded-lg border focus:outline-none";
  const normal = "border-slate-300 focus:ring-2 focus:ring-primary-300";
  const err = "border-red-400 focus:ring-red-200";
  return `${base} ${fieldErrors[field] ? err : normal}`;
}

function validate() {
  fieldErrors.email = "";
  fieldErrors.password = "";
  serverError.value = "";

  let ok = true;
  if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) {
    fieldErrors.email = "Email valid wajib diisi.";
    ok = false;
  }
  if (!form.password) {
    fieldErrors.password = "Password wajib diisi.";
    ok = false;
  }
  return ok;
}

async function handleLogin() {
  if (!validate()) return;

  isLoading.value = true;
  serverError.value = "";

  try {
    const data = await authApi.login(form.email, form.password);

    // Fetch current user data and store it
    try {
      const userRes = await authApi.getCurrentUser();
      if (userRes?.data) {
        localStorage.setItem("user", JSON.stringify(userRes.data));
        // Dispatch event to notify TopBar and Sidebar
        window.dispatchEvent(
          new CustomEvent("user-updated", { detail: userRes.data })
        );
      }
    } catch (e) {
      console.warn("Failed to fetch user after login:", e);
    }

    // Sukses: redirect ke dashboard
    router.push("/apps/students");
  } catch (err) {
    serverError.value = err.message || "Login gagal";
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadInstitutionInfo();
});
</script>

<style scoped>
button {
  transition: background-color 0.15s ease;
}
</style>
