<!-- src/views/Login.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50">
    <div class="w-full max-w-md mx-4">
      <div class="bg-white rounded-2xl shadow-md overflow-hidden">
        <div class="py-8 px-8 flex flex-col items-center justify-center">
          <img
            src="/iconku.svg"
            alt="Logo"
            class="w-28 h-28 object-contain mb-4"
          />
          <h1 class="text-2xl font-semibold text-slate-800">Selamat Datang</h1>
          <p class="text-sm text-slate-500 mt-1">
            Silakan masuk untuk melanjutkan
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
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { authApi } from "@/services/api.js";

const router = useRouter();

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
</script>

<style scoped>
button {
  transition: background-color 0.15s ease;
}
</style>
