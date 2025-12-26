<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
    <!-- Header / Breadcrumb could go here -->

    <!-- FEEDBACK MODAL -->
    <StatusModal
      :is-open="modalState.open"
      :type="modalState.type"
      :title="modalState.title"
      :message="modalState.message"
      @close="closeModal"
    />

    <div
      v-if="loading"
      class="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse"
    >
      <!-- LEFT COL SKELETON -->
      <aside class="lg:col-span-4 space-y-6">
        <div class="bg-white rounded-3xl shadow-xl overflow-hidden relative">
          <div class="h-32 bg-slate-200"></div>
          <div
            class="px-6 pb-8 text-center -mt-16 relative z-10 flex flex-col items-center"
          >
            <div
              class="w-32 h-32 rounded-full border-4 border-white bg-slate-300 mb-4"
            ></div>
            <div class="h-6 bg-slate-200 rounded w-1/2 mb-2"></div>
            <div class="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div class="flex gap-2 justify-center mb-8 w-full">
              <div class="h-6 w-16 bg-slate-200 rounded"></div>
              <div class="h-6 w-16 bg-slate-200 rounded"></div>
            </div>
            <div class="w-full space-y-3">
              <div class="h-10 bg-slate-200 rounded-xl w-full"></div>
              <div class="h-10 bg-slate-200 rounded-xl w-full"></div>
            </div>
          </div>
        </div>
      </aside>

      <!-- RIGHT COL SKELETON -->
      <main class="lg:col-span-8 space-y-8">
        <div class="bg-white rounded-3xl shadow-xl p-8">
          <div class="flex items-center gap-3 mb-8">
            <div class="w-1 h-8 bg-slate-200 rounded-full"></div>
            <div class="h-6 w-1/3 bg-slate-200 rounded"></div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div class="h-14 bg-slate-100 rounded-lg"></div>
            <div class="h-14 bg-slate-100 rounded-lg"></div>
            <div class="h-14 bg-slate-100 rounded-lg"></div>
            <div class="h-14 bg-slate-100 rounded-lg"></div>
            <div class="h-14 bg-slate-100 rounded-lg col-span-2"></div>
          </div>
        </div>
        <div
          class="bg-slate-800 rounded-3xl shadow-xl p-8 h-40 opacity-50"
        ></div>
      </main>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- LEFT COL: IDENTITY CARD -->
      <aside class="lg:col-span-4 space-y-6">
        <div
          class="bg-white rounded-3xl shadow-xl overflow-hidden relative group transition-all hover:shadow-2xl"
        >
          <!-- Gradient Header -->
          <div class="h-32 bg-gradient-to-r from-[#602515] to-[#8B4513]"></div>

          <!-- Profile Content -->
          <div class="px-6 pb-8 text-center -mt-16 relative z-10">
            <!-- Avatar -->
            <div class="relative inline-block mx-auto mb-4">
              <div
                class="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400 relative"
              >
                <img
                  v-if="photoUrl"
                  :src="photoUrl"
                  alt="Profile"
                  class="w-full h-full object-cover"
                />
                <span v-else>{{ initials }}</span>

                <!-- Upload Overlay -->
                <div
                  class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]"
                  @click="triggerPhotoUpload"
                >
                  <Icon
                    icon="solar:camera-add-bold"
                    class="text-white text-3xl"
                  />
                </div>

                <!-- Loading Overlay -->
                <div
                  v-if="uploadingPhoto"
                  class="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-20"
                >
                  <Icon
                    icon="line-md:loading-loop"
                    class="text-white text-3xl"
                  />
                </div>
              </div>
              <input
                ref="photoInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handlePhotoUpload"
              />
            </div>

            <!-- Name & Meta -->
            <h2 class="text-2xl font-bold text-slate-800 mb-1">
              {{ user.name || "User" }}
            </h2>
            <p
              class="text-slate-500 text-sm mb-4 bg-slate-100 py-1 px-3 rounded-full inline-block"
            >
              {{ user.email || "No Email" }}
            </p>

            <div class="flex justify-center flex-wrap gap-2 mt-2">
              <span
                class="text-xs font-semibold px-3 py-1 rounded-md bg-[#602515]/10 text-[#602515] capitalize"
              >
                {{ user.role || "Member" }}
              </span>
              <span
                class="text-xs font-semibold px-3 py-1 rounded-md bg-green-100 text-green-700 items-center flex gap-1"
              >
                <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                Active
              </span>
            </div>

            <!-- Actions -->
            <div class="flex flex-col gap-3 mt-8">
              <button
                @click="toggleEdit"
                class="py-2.5 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                :class="
                  editing
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-[#602515] text-white hover:bg-[#7e3c2f]'
                "
              >
                <Icon
                  :icon="
                    editing
                      ? 'solar:close-circle-bold'
                      : 'solar:pen-new-square-bold'
                  "
                  width="20"
                />
                {{ editing ? "Batal" : "Edit Profil" }}
              </button>

              <button
                v-if="editing"
                @click="saveLocal"
                :disabled="updating"
                class="py-2.5 px-4 rounded-xl text-sm font-medium text-white shadow-sm flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <Icon v-if="updating" icon="line-md:loading-loop" width="20" />
                <Icon v-else icon="solar:disk-bold" width="20" />
                Simpan
              </button>

              <button
                v-else
                @click="scrollToPassword"
                class="py-2.5 px-4 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
              >
                <Icon icon="solar:shield-keyhole-bold" width="20" />
                Security
              </button>
            </div>
          </div>
        </div>

        <!-- QUICK STATS CARD (Mobile/All) -->
        <div class="bg-white rounded-3xl shadow-lg p-6 flex flex-col gap-4">
          <div
            class="flex items-center justify-between p-3 rounded-2xl bg-slate-50"
          >
            <div class="flex items-center gap-3">
              <div class="p-2 bg-blue-100 text-blue-600 rounded-xl">
                <Icon icon="solar:calendar-date-bold-duotone" width="20" />
              </div>
              <div class="flex flex-col">
                <span class="text-xs text-slate-500">Bergabung</span>
                <span class="text-sm font-bold text-slate-700">{{
                  formatDDMMYYYY(new Date(user.createdAt || Date.now()))
                }}</span>
              </div>
            </div>
          </div>

          <!-- More stats placeholders could go here -->
        </div>
      </aside>

      <!-- RIGHT COL: DETAILS & SETTINGS -->
      <main class="lg:col-span-8 space-y-8">
        <!-- 1. PERSONAL DETAILS CARD -->
        <div
          class="bg-white rounded-3xl shadow-xl p-8 relative overflow-hidden"
        >
          <!-- Decorative -->
          <div class="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Icon icon="solar:user-id-bold" width="120" />
          </div>

          <div class="flex items-center gap-3 mb-8">
            <div class="w-1 h-8 bg-[#f8ae19] rounded-full"></div>
            <h3 class="text-xl font-bold text-slate-800">Informasi Pribadi</h3>
          </div>

          <!-- Grid Form -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <!-- Named Slots for Form Fields -->
            <!-- Field: First Name -->
            <div class="group">
              <label
                class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                >Nama Depan</label
              >
              <div
                v-if="!editing"
                class="text-slate-800 font-medium text-lg border-b border-transparent py-1"
              >
                {{ user.firstName || "-" }}
              </div>
              <input
                v-else
                v-model="draft.firstName"
                type="text"
                class="w-full bg-slate-50 border-b-2 border-slate-200 focus:border-[#602515] px-3 py-2 rounded-t-lg transition-colors outline-none font-medium text-slate-800"
              />
            </div>

            <!-- Field: Last Name -->
            <div class="group">
              <label
                class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                >Nama Belakang</label
              >
              <div
                v-if="!editing"
                class="text-slate-800 font-medium text-lg border-b border-transparent py-1"
              >
                {{ user.lastName || "-" }}
              </div>
              <input
                v-else
                v-model="draft.lastName"
                type="text"
                class="w-full bg-slate-50 border-b-2 border-slate-200 focus:border-[#602515] px-3 py-2 rounded-t-lg transition-colors outline-none font-medium text-slate-800"
              />
            </div>

            <!-- Field: Gender -->
            <div class="group">
              <label
                class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                >Jenis Kelamin</label
              >
              <div v-if="!editing" class="flex items-center gap-2 py-1">
                <Icon
                  :icon="
                    user.gender === 'female'
                      ? 'solar:women-bold'
                      : 'solar:men-bold'
                  "
                  class="text-slate-400"
                  width="24"
                />
                <span class="text-slate-800 font-medium text-lg">{{
                  displayGender
                }}</span>
              </div>
              <div v-else class="flex gap-4 pt-2">
                <label
                  class="flex items-center gap-2 cursor-pointer p-2 rounded-lg border hover:bg-slate-50 transition-colors"
                  :class="
                    draft.gender === 'male'
                      ? 'border-[#602515] bg-[#602515]/5'
                      : 'border-slate-200'
                  "
                >
                  <input
                    type="radio"
                    value="male"
                    v-model="draft.gender"
                    class="accent-[#602515]"
                  />
                  <span class="text-sm font-medium">Laki-laki</span>
                </label>
                <label
                  class="flex items-center gap-2 cursor-pointer p-2 rounded-lg border hover:bg-slate-50 transition-colors"
                  :class="
                    draft.gender === 'female'
                      ? 'border-[#602515] bg-[#602515]/5'
                      : 'border-slate-200'
                  "
                >
                  <input
                    type="radio"
                    value="female"
                    v-model="draft.gender"
                    class="accent-[#602515]"
                  />
                  <span class="text-sm font-medium">Perempuan</span>
                </label>
              </div>
            </div>

            <!-- Field: Phone -->
            <div class="group">
              <label
                class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                >No. Telepon</label
              >
              <div
                v-if="!editing"
                class="text-slate-800 font-medium text-lg border-b border-transparent py-1"
              >
                {{ user.phone || "-" }}
              </div>
              <input
                v-else
                v-model="draft.phone"
                type="tel"
                class="w-full bg-slate-50 border-b-2 border-slate-200 focus:border-[#602515] px-3 py-2 rounded-t-lg transition-colors outline-none font-medium text-slate-800"
                placeholder="08..."
              />
            </div>

            <!-- Field: Birth Place -->
            <div class="group">
              <label
                class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                >Tempat Lahir</label
              >
              <div
                v-if="!editing"
                class="text-slate-800 font-medium text-lg border-b border-transparent py-1"
              >
                {{ user.birthPlace || "-" }}
              </div>
              <input
                v-else
                v-model="draft.birthPlace"
                type="text"
                class="w-full bg-slate-50 border-b-2 border-slate-200 focus:border-[#602515] px-3 py-2 rounded-t-lg transition-colors outline-none font-medium text-slate-800"
              />
            </div>

            <!-- Field: Birth Date -->
            <div class="group">
              <label
                class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                >Tanggal Lahir</label
              >
              <div
                v-if="!editing"
                class="text-slate-800 font-medium text-lg border-b border-transparent py-1 flex items-center gap-2"
              >
                <Icon
                  icon="solar:calendar-date-bold"
                  class="text-slate-400"
                  width="20"
                />
                {{ displayTanggal }}
              </div>
              <div v-else class="datepicker-modern">
                <VueDatePicker
                  v-model="draft.birthDateObj"
                  :enable-time="false"
                  format="dd/MM/yyyy"
                  auto-apply
                  teleport="body"
                  input-class-name="bg-slate-50 border-b-2 border-slate-200 focus:border-[#602515] !rounded-none !rounded-t-lg font-medium"
                />
              </div>
            </div>

            <!-- Field: Address (Full Width) -->
            <div class="md:col-span-2 group">
              <label
                class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                >Alamat Lengkap</label
              >
              <div
                v-if="!editing"
                class="text-slate-800 font-medium text-lg border-b border-transparent py-1"
              >
                {{ user.address || "-" }}
              </div>
              <textarea
                v-else
                v-model="draft.address"
                rows="2"
                class="w-full bg-slate-50 border-b-2 border-slate-200 focus:border-[#602515] px-3 py-2 rounded-t-lg transition-colors outline-none font-medium text-slate-800 resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- 2. SECURITY CARD -->
        <div
          id="password-section"
          class="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden"
        >
          <div class="relative z-10">
            <div class="flex flex-wrap items-center justify-between mb-8 gap-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm"
                >
                  <Icon
                    icon="solar:shield-keyhole-bold-duotone"
                    class="text-[#f8ae19]"
                    width="24"
                  />
                </div>
                <div>
                  <h3 class="text-xl font-bold">Keamanan Akun</h3>
                  <p class="text-slate-400 text-sm">
                    Update password anda secara berkala
                  </p>
                </div>
              </div>

              <button
                v-if="!showPassword"
                @click="showPassword = true"
                class="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium border border-white/10 whitespace-nowrap"
              >
                Ubah Password
              </button>
            </div>

            <transition
              enter-active-class="transition duration-300 ease-out"
              enter-from-class="transform -translate-y-4 opacity-0"
              enter-to-class="transform translate-y-0 opacity-100"
              leave-active-class="transition duration-200 ease-in"
              leave-from-class="transform translate-y-0 opacity-100"
              leave-to-class="transform -translate-y-4 opacity-0"
            >
              <div
                v-if="showPassword"
                class="bg-white/5 rounded-2xl p-6 border border-white/10"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-4">
                    <!-- Current Pwd -->
                    <div class="group">
                      <label
                        class="text-xs text-slate-400 uppercase tracking-wider mb-1 block"
                        >Password Saat Ini</label
                      >
                      <div class="relative">
                        <input
                          :type="pwdShow.current ? 'text' : 'password'"
                          v-model="pwd.current"
                          class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:border-[#f8ae19] outline-none transition-colors"
                          placeholder="••••••"
                        />
                        <button
                          @click="togglePwd('current')"
                          class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10"
                        >
                          <Icon
                            :icon="
                              pwdShow.current
                                ? 'solar:eye-bold'
                                : 'solar:eye-closed-bold'
                            "
                            width="20"
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="space-y-4">
                    <!-- New Pwd -->
                    <div class="group">
                      <label
                        class="text-xs text-slate-400 uppercase tracking-wider mb-1 block"
                        >Password Baru</label
                      >
                      <div class="relative">
                        <input
                          :type="pwdShow.new ? 'text' : 'password'"
                          v-model="pwd.new"
                          class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:border-[#f8ae19] outline-none transition-colors"
                          placeholder="••••••"
                        />
                        <button
                          @click="togglePwd('new')"
                          class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10"
                        >
                          <Icon
                            :icon="
                              pwdShow.new
                                ? 'solar:eye-bold'
                                : 'solar:eye-closed-bold'
                            "
                            width="20"
                          />
                        </button>
                      </div>
                    </div>

                    <!-- Confirm Pwd -->
                    <div class="group">
                      <label
                        class="text-xs text-slate-400 uppercase tracking-wider mb-1 block"
                        >Konfirmasi Password Baru</label
                      >
                      <div class="relative">
                        <input
                          :type="pwdShow.confirm ? 'text' : 'password'"
                          v-model="pwd.confirm"
                          class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:border-[#f8ae19] outline-none transition-colors"
                          placeholder="••••••"
                        />
                        <button
                          @click="togglePwd('confirm')"
                          class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10"
                        >
                          <Icon
                            :icon="
                              pwdShow.confirm
                                ? 'solar:eye-bold'
                                : 'solar:eye-closed-bold'
                            "
                            width="20"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  class="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10"
                >
                  <button
                    @click="showPassword = false"
                    class="px-5 py-2 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    @click="submitPassword"
                    :disabled="pwdLoading"
                    class="px-5 py-2 rounded-xl text-sm font-bold bg-[#f8ae19] text-[#602515] hover:bg-[#ffc145] transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-70 flex items-center gap-2"
                  >
                    <Icon v-if="pwdLoading" icon="line-md:loading-loop" />
                    Simpan Password
                  </button>
                </div>

                <!-- Feedback -->
                <div
                  v-if="pwdError"
                  class="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm flex items-center gap-2"
                >
                  <Icon icon="solar:danger-circle-bold" /> {{ pwdError }}
                </div>
                <div
                  v-if="pwdSuccess"
                  class="mt-4 p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-200 text-sm flex items-center gap-2"
                >
                  <Icon icon="solar:check-circle-bold" /> {{ pwdSuccess }}
                </div>
              </div>
            </transition>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import StatusModal from "@/components/ui/StatusModal.vue";

// static import datepicker (already installed)
import { VueDatePicker } from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

const router = useRouter();
const user = ref({});
const loading = ref(true);
const error = ref("");
const editing = ref(false);
const draft = ref({});
const updating = ref(false);

// password form
const showPassword = ref(false);
const pwd = ref({ current: "", new: "", confirm: "" });
const pwdLoading = ref(false);
const pwdError = ref("");
const pwdSuccess = ref("");
const pwdShow = ref({ current: false, new: false, confirm: false });

// feedback modal state
const modalState = ref({
  open: false,
  type: "success",
  title: "",
  message: "",
});

function openModal(type, title, message) {
  modalState.value = { open: true, type, title, message };
}

function closeModal() {
  modalState.value.open = false;
  // If success, maybe we want to refresh or close edit mode?
  // Logic is already handled in saveLocal/submitPassword
}

// photo upload
const photoInput = ref(null);
const uploadingPhoto = ref(false);

// theme colors
const primaryColor = "#602515";
const secondaryColor = "#f8ae19";
const primaryGradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;

// computed photo URL
const photoUrl = computed(() => {
  if (!user.value?.photo) return null;
  const base = import.meta.env.VITE_API_BASE_URL || "";
  // If photo is relative path, prepend API base URL
  if (user.value.photo.startsWith("uploads/")) {
    return `${base}/api/${user.value.photo}`;
  }
  return user.value.photo;
});

// Trigger file input
function triggerPhotoUpload() {
  photoInput.value?.click();
}

// Handle photo upload
async function handlePhotoUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith("image/")) {
    alert("Hanya file gambar yang diperbolehkan");
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert("Ukuran file maksimal 5MB");
    return;
  }

  uploadingPhoto.value = true;
  error.value = "";

  try {
    const token = localStorage.getItem("token");
    const base = import.meta.env.VITE_API_BASE_URL || "";

    // Upload file
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch(`${base}/api/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(err.message || "Gagal upload foto");
    }

    const uploadData = await uploadRes.json();
    const photoPath = uploadData.data?.filePath;

    // Update user profile with new photo
    const updateRes = await fetch(`${base}/api/users/current`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ photo: photoPath }),
    });

    if (!updateRes.ok) {
      throw new Error("Gagal menyimpan foto profil");
    }

    const updateData = await updateRes.json();
    user.value = {
      ...updateData.data,
      name: `${updateData.data.firstName || ""} ${
        updateData.data.lastName || ""
      }`.trim(),
    };

    // Persist to localStorage and dispatch event for other components
    try {
      localStorage.setItem("user", JSON.stringify(user.value));
      window.dispatchEvent(
        new CustomEvent("user-updated", { detail: user.value })
      );
    } catch (e) {
      console.warn("Failed to persist user update", e);
    }

    // Clear file input
    event.target.value = "";
  } catch (err) {
    error.value = err.message || "Gagal upload foto";
    console.error("Photo upload error:", err);
  } finally {
    uploadingPhoto.value = false;
  }
}

const initials = computed(() => {
  const name =
    (user.value &&
      (user.value.name ||
        `${user.value.firstName || ""} ${user.value.lastName || ""}`)) ||
    "";
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "U"
  );
});

// displayTanggal: show formatted tanggal from birthDate
const displayTanggal = computed(() => {
  if (user.value?.birthDate) {
    const d = new Date(user.value.birthDate);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  }
  return "-";
});

// displayGender: convert male/female to Indonesian
const displayGender = computed(() => {
  if (user.value?.gender === "male") return "Laki-laki";
  if (user.value?.gender === "female") return "Perempuan";
  return user.value?.gender || "-";
});

// helpers parse/format
function parseDDMMYYYY(str) {
  if (!str) return null;
  const parts = String(str).split("/");
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

function formatDDMMYYYY(date) {
  if (!date) return "";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function scrollToPassword() {
  user.value.gender; // no-op to ensure reactivity if needed, but not needed here.
  const el = document.getElementById("password-section");
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
    showPassword.value = true;
  }
}

onMounted(() => {
  // initial fetch
  fetchCurrent();
});

async function fetchCurrent() {
  loading.value = true;
  error.value = "";
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Unauthorized");

    const base = import.meta.env.VITE_API_BASE_URL || "";
    const res = await fetch(`${base}/api/users/current`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.errors || res.statusText || "Gagal memuat data");
    }

    const data = await res.json();
    user.value = {
      ...data.data,
      name: `${data.data.firstName || ""} ${data.data.lastName || ""}`.trim(),
    };

    // prepare draft and convert birthDate string -> Date object for datepicker
    draft.value = { ...data.data };
    if (data.data.birthDate) {
      draft.value.birthDateObj = new Date(data.data.birthDate);
    }
  } catch (err) {
    error.value = err.message || "Terjadi kesalahan";
    if (error.value.toLowerCase().includes("unauthorized")) {
      localStorage.removeItem("token");
      router.push("/login");
    }
  } finally {
    loading.value = false;
  }
}

function toggleEdit() {
  editing.value = !editing.value;
  if (!editing.value) {
    // cancelling edit -> revert draft to user state
    draft.value = { ...user.value };
    if (user.value?.birthDate) {
      draft.value.birthDateObj = new Date(user.value.birthDate);
    }
  } else {
    // entering edit -> ensure draft is fresh
    draft.value = { ...user.value };
    if (user.value?.birthDate) {
      draft.value.birthDateObj = new Date(user.value.birthDate);
    }
  }
}

async function saveLocal() {
  error.value = "";
  updating.value = true;
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Unauthorized");

    const base = import.meta.env.VITE_API_BASE_URL || "";

    // prepare payload from draft
    const payloadObj = { ...draft.value };

    // convert Date -> YYYY-MM-DD string for backend
    if (payloadObj.birthDateObj instanceof Date) {
      const d = payloadObj.birthDateObj;
      payloadObj.birthDate = `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    // remove helper field
    delete payloadObj.birthDateObj;
    delete payloadObj.name; // computed field, don't send

    // remove empty values
    Object.keys(payloadObj).forEach((k) => {
      if (payloadObj[k] === "" || payloadObj[k] == null) delete payloadObj[k];
    });

    const res = await fetch(`${base}/api/users/current`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloadObj),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.errors || body?.message || "Gagal update profil");
    }

    const data = await res.json();
    user.value = {
      ...data.data,
      name: `${data.data.firstName || ""} ${data.data.lastName || ""}`.trim(),
    };

    // Persist to localStorage and dispatch event
    try {
      localStorage.setItem("user", JSON.stringify(user.value));
      window.dispatchEvent(
        new CustomEvent("user-updated", { detail: user.value })
      );
    } catch (e) {
      console.warn("Failed to persist user update", e);
    }

    // sync draft
    draft.value = { ...data.data };
    if (data.data.birthDate) {
      draft.value.birthDateObj = new Date(data.data.birthDate);
    }
    editing.value = false;

    // Show Success Modal
    openModal(
      "success",
      "Profil Diperbarui",
      "Data profil anda berhasil disimpan."
    );
  } catch (err) {
    const msg = err.message || "Gagal update profil";
    error.value = msg;
    openModal("error", "Gagal Menyimpan", msg);

    if (msg.toLowerCase().includes("unauthorized")) {
      localStorage.removeItem("token");
      router.push("/login");
    }
  } finally {
    updating.value = false;
  }
}

// submit password change via same PATCH endpoint (send only password field)
async function submitPassword() {
  pwdError.value = "";
  pwdSuccess.value = "";
  if (!pwd.value.current || !pwd.value.new) {
    pwdError.value = "Lengkapi password lama dan baru.";
    return;
  }
  if (pwd.value.new !== pwd.value.confirm) {
    pwdError.value = "Password baru dan konfirmasi tidak cocok.";
    return;
  }

  pwdLoading.value = true;
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Unauthorized");
    const base = import.meta.env.VITE_API_BASE_URL || "";

    const res = await fetch(`${base}/api/users/current/password`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPassword: pwd.value.current,
        newPassword: pwd.value.new,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.errors || "Gagal mengubah password");
    }

    pwdSuccess.value = "Password berhasil diubah.";
    // clear form
    pwd.value = { current: "", new: "", confirm: "" };
    showPassword.value = false;

    openModal(
      "success",
      "Password Diubah",
      "Password anda berhasil diperbarui. Silakan login ulang jika diperlukan."
    );
  } catch (err) {
    const msg = err.message || "Gagal mengubah password";
    pwdError.value = msg;
    openModal("error", "Gagal Mengubah Password", msg);
  } finally {
    pwdLoading.value = false;
  }
}

function togglePwd(field) {
  if (!["current", "new", "confirm"].includes(field)) return;
  pwdShow.value[field] = !pwdShow.value[field];
}
</script>

<style scoped>
:root {
  --primary: #602515;
  --secondary: #f8ae19;
}

/* DATEPICKER THEME OVERRIDES - keep specificity but safe */
.datepicker-wrapper {
  max-width: 100%;
}

/* Make the root of datepicker fit container and not overflow on mobile */
.vp__container,
.vp__calendar,
.vp__input,
.dp__container,
.dp__calendar {
  max-width: 100% !important;
  box-sizing: border-box;
}

/* override primary / accent colors (broad selectors) */
.dp__active_date,
.dp__active,
.dp__cell--selected,
.dp__day--selected,
.vp__day--selected {
  background-color: var(--primary) !important;
  color: white !important;
  border-color: var(--primary) !important;
}
.dp__action_select,
.dp__action--select,
.dp__action_button,
.dp__btn--primary,
.vp__action,
.vp__button--primary {
  background-color: var(--primary) !important;
  border-color: var(--primary) !important;
  color: #fff !important;
}
.dp__today,
.vp__today {
  border-color: var(--primary) !important;
  color: var(--primary) !important;
}
.dp__input:focus,
.vp__input:focus {
  border-color: var(--primary) !important;
  box-shadow: 0 0 0 3px rgba(96, 33, 21, 0.08) !important;
}

/* responsive fixes */
@media (max-width: 640px) {
  .p-6 {
    padding: 1rem;
  }
  .w-28 {
    width: 64px;
    height: 64px;
  }
  .datepicker-wrapper,
  .vp__container,
  .dp__container {
    width: 100% !important;
    left: 0 !important;
    transform: none !important;
    margin: 0 !important;
  }
}

.relative input {
  padding-right: 3rem;
}
</style>
