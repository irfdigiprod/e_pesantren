<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 p-4">
    <div class="w-full max-w-md mx-auto">
      <div class="bg-white rounded-2xl shadow-md overflow-hidden">
        <!-- Header -->
        <div class="py-6 px-6 text-center">
          <img
            v-if="logoUrl"
            :src="logoUrl"
            alt="Logo"
            class="w-20 h-20 mx-auto mb-3 object-contain"
          />
          <img
            v-else
            src="/iconku.svg"
            alt="Logo"
            class="w-20 h-20 mx-auto mb-3 object-contain"
          />
          <h1 class="text-2xl font-semibold text-slate-800">Buat Akun Baru</h1>
          <p class="text-sm text-slate-500 mt-1">
            {{ institutionName }}
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
              <div class="relative">
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  :disabled="isLoading"
                  :class="inputClass('password')"
                  placeholder="Minimal 6 karakter"
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <Icon
                    :icon="
                      showPassword
                        ? 'solar:eye-closed-line-duotone'
                        : 'solar:eye-line-duotone'
                    "
                    class="w-5 h-5"
                  />
                </button>
              </div>
              <p v-if="fieldErrors.password" class="mt-1 text-sm text-red-600">
                {{ fieldErrors.password }}
              </p>
            </div>

            <!-- Confirm Password -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Konfirmasi Password</label
              >
              <div class="relative">
                <input
                  v-model="form.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  :disabled="isLoading"
                  :class="inputClass('confirmPassword')"
                  placeholder="Ketik ulang password"
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <Icon
                    :icon="
                      showConfirmPassword
                        ? 'solar:eye-closed-line-duotone'
                        : 'solar:eye-line-duotone'
                    "
                    class="w-5 h-5"
                  />
                </button>
              </div>
              <p
                v-if="fieldErrors.confirmPassword"
                class="mt-1 text-sm text-red-600"
              >
                {{ fieldErrors.confirmPassword }}
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
                <option v-if="!adminExists" value="admin">Admin</option>
                <option value="teacher">Guru</option>
                <option value="staff">Staff</option>
                <option value="student">Santri</option>
                <option value="parent">Orang Tua</option>
                <option value="clinic">Klinik</option>
              </select>
              <p v-if="fieldErrors.role" class="mt-1 text-sm text-red-600">
                {{ fieldErrors.role }}
              </p>
              <p v-if="adminExists" class="mt-1 text-xs text-slate-500">
                <Icon
                  icon="solar:info-circle-line-duotone"
                  class="inline mr-1"
                />
                Admin sudah terdaftar. Hubungi admin jika perlu akun admin baru.
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

    <!-- Status Modal -->
    <StatusModal
      :isOpen="statusModal.show"
      :type="statusModal.type"
      :title="statusModal.title"
      :message="statusModal.message"
      @close="handleModalClose"
    />
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { authApi, settingsApi } from "@/services/api.js";
import StatusModal from "@/components/ui/StatusModal.vue";

const router = useRouter();
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Institution info (dynamic like login page)
const institutionName = ref("Isi data berikut untuk mendaftar");
const institutionLogo = ref("");

// Show password toggles
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// Check if admin already exists
const adminExists = ref(false);

// Status Modal
const statusModal = ref({
  show: false,
  type: "success",
  title: "",
  message: "",
});

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

async function checkAdminExists() {
  try {
    const res = await authApi.checkAdminExists();
    if (res.success) {
      adminExists.value = res.data.adminExists;
      // If admin exists and current selection is admin, switch to teacher
      if (adminExists.value && form.role === "admin") {
        form.role = "teacher";
      }
    }
  } catch (e) {
    console.warn("Could not check admin status:", e);
  }
}

const form = reactive({
  email: "",
  password: "",
  confirmPassword: "",
  role: "teacher", // Default to teacher instead of admin
});

const isLoading = ref(false);
const serverError = ref("");

const fieldErrors = reactive({
  email: "",
  password: "",
  confirmPassword: "",
  role: "",
});

function inputClass(fieldName) {
  const base = "w-full px-4 py-2 rounded-lg border focus:outline-none pr-12";
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
  if (!form.confirmPassword) {
    fieldErrors.confirmPassword = "Konfirmasi password wajib diisi.";
    ok = false;
  } else if (form.password !== form.confirmPassword) {
    fieldErrors.confirmPassword = "Password tidak cocok.";
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
  serverError.value = ""; // Clear previous errors

  try {
    const response = await authApi.register(
      form.email,
      form.password,
      form.role
    );

    // Store token and auto-login (Bug #4 fix)
    if (response.data?.token) {
      localStorage.setItem("token", response.data.token);
    }

    statusModal.value = {
      show: true,
      type: "success",
      title: "Pendaftaran Berhasil!",
      message: "Akun Anda telah dibuat. Silakan login untuk melanjutkan.",
    };
  } catch (err) {
    // Bug #2 fix: Show failures in StatusModal for consistency
    statusModal.value = {
      show: true,
      type: "error",
      title: "Pendaftaran Gagal",
      message: err.message || "Terjadi kesalahan. Silakan coba lagi.",
    };
  } finally {
    isLoading.value = false;
  }
}

function handleModalClose() {
  statusModal.value.show = false;
  if (statusModal.value.type === "success") {
    router.push("/login");
  }
}

onMounted(() => {
  loadInstitutionInfo();
  checkAdminExists();
});
</script>

<style scoped>
button {
  transition: background-color 0.15s ease;
}
</style>
