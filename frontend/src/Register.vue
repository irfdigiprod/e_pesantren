<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 p-4">
    <div class="w-full max-w-md mx-auto">
      <div class="bg-white rounded-2xl shadow-md overflow-hidden">
        <!-- Header -->
        <div class="py-6 px-6 text-center">
          <img
            src="/iconku.svg"
            alt="Logo"
            class="w-20 h-20 mx-auto mb-3 object-contain"
          />
          <h1 class="text-2xl font-semibold text-slate-800">Buat Akun Baru</h1>
          <p class="text-sm text-slate-500 mt-1">
            Isi data berikut untuk mendaftar
          </p>
        </div>

        <!-- Form -->
        <form class="px-6 pb-8" @submit.prevent="handleRegister" novalidate>
          <div class="space-y-4">
            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Email</label
              >
              <input
                v-model="form.email"
                type="email"
                :disabled="isLoading"
                :class="inputClass('email')"
                placeholder="nama@mail.com"
                autocomplete="email"
              />
              <p v-if="fieldErrors.email" class="mt-1 text-sm text-red-600">
                {{ fieldErrors.email }}
              </p>
            </div>

            <!-- Password -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Password</label
              >
              <input
                v-model="form.password"
                type="password"
                :disabled="isLoading"
                :class="inputClass('password')"
                placeholder="Minimal 6 karakter"
                autocomplete="new-password"
              />
              <p v-if="fieldErrors.password" class="mt-1 text-sm text-red-600">
                {{ fieldErrors.password }}
              </p>
            </div>

            <!-- Role -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Role</label
              >
              <select
                v-model="form.role"
                :disabled="isLoading"
                :class="inputClass('role')"
              >
                <option value="admin">Admin</option>
                <option value="teacher">Guru</option>
                <option value="parent">Orang Tua</option>
                <option value="student">Santri</option>
              </select>
              <p v-if="fieldErrors.role" class="mt-1 text-sm text-red-600">
                {{ fieldErrors.role }}
              </p>
            </div>
          </div>

          <!-- server general error -->
          <p v-if="serverError" class="mt-4 text-sm text-red-600 text-center">
            {{ serverError }}
          </p>

          <!-- actions -->
          <div class="mt-6 flex flex-col gap-3">
            <button
              :disabled="isLoading"
              type="submit"
              class="w-full px-4 py-2 rounded-lg bg-primary-600 text-white font-medium shadow-sm hover:bg-primary-700 disabled:opacity-60"
            >
              <span v-if="!isLoading">Daftar</span>
              <span v-else>Memproses…</span>
            </button>

            <router-link
              to="/login"
              class="text-center text-sm text-primary-600 hover:underline"
            >
              Sudah punya akun? Masuk
            </router-link>
          </div>
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
  role: "admin",
});

const isLoading = ref(false);
const serverError = ref("");

const fieldErrors = reactive({
  email: "",
  password: "",
  role: "",
});

function inputClass(fieldName) {
  const base = "w-full px-4 py-2 rounded-lg border focus:outline-none";
  const normal =
    "border-slate-200 focus:ring-2 focus:ring-primary-300 focus:border-primary-600";
  const err = "border-red-400 focus:ring-red-200";
  return `${base} ${fieldErrors[fieldName] ? err : normal}`;
}

function clearErrors() {
  serverError.value = "";
  Object.keys(fieldErrors).forEach((k) => (fieldErrors[k] = ""));
}

function validate() {
  clearErrors();

  let ok = true;

  if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) {
    fieldErrors.email = "Email tidak valid.";
    ok = false;
  }
  if (!form.password || form.password.length < 6) {
    fieldErrors.password = "Password minimal 6 karakter.";
    ok = false;
  }
  if (!form.role) {
    fieldErrors.role = "Role wajib dipilih.";
    ok = false;
  }

  return ok;
}

async function handleRegister() {
  if (!validate()) return;

  isLoading.value = true;

  try {
    await authApi.register(form.email, form.password, form.role);

    alert("Pendaftaran berhasil! Silakan login.");
    router.push("/login");
  } catch (err) {
    serverError.value = err.message || "Gagal mendaftar";
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
