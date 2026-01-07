<script setup>
import { Icon } from "@iconify/vue";
import { ref, computed, onMounted, watch } from "vue";
import { rolesApi, usersApi } from "@/services/api";
import StatusModal from "@/components/ui/StatusModal.vue";

// Tab state
const activeTab = ref("role"); // "role" or "user"

// Role-based permissions
const selectedRole = ref("teacher");
const rolePermissions = ref([]);
const roleLoading = ref(false);

// User-based permissions
const users = ref([]);
const selectedUserId = ref(null);
const userPermissions = ref([]);
const userLoading = ref(false);
const searchQuery = ref("");

// Status modal
const statusModal = ref({
  show: false,
  type: "success",
  title: "",
  message: "",
});

// Available roles
const roles = [
  { value: "admin", label: "Admin" },
  { value: "teacher", label: "Guru" },
  { value: "student", label: "Santri" },
  { value: "parent", label: "Wali Santri" },
  { value: "staff", label: "Staff" },
  { value: "clinic", label: "Klinik" },
];

// Routes that admin must always have access to (synced with backend)
const PROTECTED_ADMIN_ROUTES = ["/security/users", "/security/roles"];

// Check if a route is protected for admin
function isProtectedForAdmin(path) {
  return (
    selectedRole.value === "admin" && PROTECTED_ADMIN_ROUTES.includes(path)
  );
}

// Group permissions by category
const groupedRolePermissions = computed(() => {
  const groups = {};
  rolePermissions.value.forEach((p) => {
    const cat = p.category || "Other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  });
  return groups;
});

const groupedUserPermissions = computed(() => {
  const groups = {};
  userPermissions.value.forEach((p) => {
    const cat = p.category || "Other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  });
  return groups;
});

// Filtered users for search
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  const q = searchQuery.value.toLowerCase();
  return users.value.filter(
    (u) =>
      u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  );
});

// Load role permissions
async function loadRolePermissions() {
  roleLoading.value = true;
  try {
    const res = await rolesApi.getRolePermissions(selectedRole.value);
    if (res.success) {
      rolePermissions.value = res.data;
    } else {
      statusModal.value = {
        show: true,
        type: "error",
        title: "Gagal Memuat",
        message: res.message || "Gagal memuat pengaturan role",
      };
    }
  } catch (e) {
    console.error("Failed to load role permissions:", e);
    statusModal.value = {
      show: true,
      type: "error",
      title: "Error",
      message: "Terjadi kesalahan saat memuat pengaturan role",
    };
  } finally {
    roleLoading.value = false;
  }
}

// Save role permissions
async function saveRolePermissions() {
  roleLoading.value = true;
  try {
    const permissions = rolePermissions.value.map((p) => ({
      path: p.path,
      isAllowed: p.isAllowed,
    }));
    const res = await rolesApi.updateRolePermissions(
      selectedRole.value,
      permissions
    );
    if (res.success) {
      statusModal.value = {
        show: true,
        type: "success",
        title: "Berhasil",
        message: "Pengaturan hak akses role berhasil disimpan",
      };
    } else {
      // Handle case when success is false
      statusModal.value = {
        show: true,
        type: "error",
        title: "Gagal",
        message: res.message || "Gagal menyimpan pengaturan",
      };
    }
  } catch (e) {
    console.error("Save role permissions error:", e);
    statusModal.value = {
      show: true,
      type: "error",
      title: "Gagal",
      message: "Terjadi kesalahan saat menyimpan pengaturan",
    };
  } finally {
    roleLoading.value = false;
  }
}

// Load users
async function loadUsers() {
  try {
    const res = await usersApi.getAll();
    if (res.success) {
      users.value = res.data;
    } else {
      statusModal.value = {
        show: true,
        type: "error",
        title: "Gagal Memuat",
        message: res.message || "Gagal memuat daftar user",
      };
    }
  } catch (e) {
    console.error("Failed to load users:", e);
    statusModal.value = {
      show: true,
      type: "error",
      title: "Error",
      message: "Terjadi kesalahan saat memuat daftar user",
    };
  }
}

// Load user permissions
async function loadUserPermissions() {
  if (!selectedUserId.value) return;
  userLoading.value = true;
  try {
    const res = await rolesApi.getUserPermissions(selectedUserId.value);
    if (res.success) {
      userPermissions.value = res.data;
    } else {
      statusModal.value = {
        show: true,
        type: "error",
        title: "Gagal Memuat",
        message: res.message || "Gagal memuat pengaturan user",
      };
    }
  } catch (e) {
    console.error("Failed to load user permissions:", e);
    statusModal.value = {
      show: true,
      type: "error",
      title: "Error",
      message: "Terjadi kesalahan saat memuat pengaturan user",
    };
  } finally {
    userLoading.value = false;
  }
}

// Toggle user permission override
function toggleUserOverride(perm) {
  if (perm.hasOverride) {
    // Remove override
    perm.hasOverride = false;
    perm.isAllowed = null;
  } else {
    // Add override with true
    perm.hasOverride = true;
    perm.isAllowed = true;
  }
}

// Save user permissions
async function saveUserPermissions() {
  if (!selectedUserId.value) return;
  userLoading.value = true;
  try {
    const permissions = userPermissions.value.map((p) => ({
      path: p.path,
      isAllowed: p.isAllowed,
      hasOverride: p.hasOverride,
    }));
    const res = await rolesApi.updateUserPermissions(
      selectedUserId.value,
      permissions
    );
    if (res.success) {
      statusModal.value = {
        show: true,
        type: "success",
        title: "Berhasil",
        message: "Pengaturan hak akses user berhasil disimpan",
      };
    }
  } catch (e) {
    statusModal.value = {
      show: true,
      type: "error",
      title: "Gagal",
      message: "Gagal menyimpan pengaturan",
    };
  } finally {
    userLoading.value = false;
  }
}

// Select all/none for role
function selectAllRole(isAllowed) {
  rolePermissions.value.forEach((p) => {
    // Skip protected routes for admin (keep them always true)
    if (isProtectedForAdmin(p.path)) {
      p.isAllowed = true;
      return;
    }
    p.isAllowed = isAllowed;
  });
}

// Select all/none for category (role)
function selectAllCategory(category, isAllowed) {
  rolePermissions.value.forEach((p) => {
    if (p.category === category) {
      // Skip protected routes for admin (keep them always true)
      if (isProtectedForAdmin(p.path)) {
        p.isAllowed = true;
        return;
      }
      p.isAllowed = isAllowed;
    }
  });
}

// Watch for role change
watch(selectedRole, () => {
  loadRolePermissions();
});

// Watch for user selection
watch(selectedUserId, () => {
  loadUserPermissions();
});

onMounted(() => {
  loadRolePermissions();
  loadUsers();
});
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Pengaturan Hak Akses</h1>
      <p class="text-sm text-slate-500">
        Atur akses fitur berdasarkan role atau per-user
      </p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-6">
      <button
        @click="activeTab = 'role'"
        class="px-4 py-2 rounded-lg font-medium transition-all"
        :class="
          activeTab === 'role'
            ? 'bg-primary-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        "
      >
        <Icon
          icon="solar:users-group-rounded-line-duotone"
          class="inline mr-2"
        />
        Berdasarkan Role
      </button>
      <button
        @click="activeTab = 'user'"
        class="px-4 py-2 rounded-lg font-medium transition-all"
        :class="
          activeTab === 'user'
            ? 'bg-primary-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        "
      >
        <Icon icon="solar:user-check-line-duotone" class="inline mr-2" />
        Berdasarkan User
      </button>
    </div>

    <!-- Role-based Tab -->
    <div
      v-if="activeTab === 'role'"
      class="bg-white rounded-xl shadow-sm border border-slate-200"
    >
      <!-- Role Selector -->
      <div
        class="p-4 border-b border-slate-100 flex items-center justify-between gap-4"
      >
        <div class="flex items-center gap-3">
          <label class="text-sm font-medium text-slate-700">Pilih Role:</label>
          <select
            v-model="selectedRole"
            class="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option v-for="role in roles" :key="role.value" :value="role.value">
              {{ role.label }}
            </option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="selectAllRole(true)"
            class="px-3 py-1.5 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
          >
            Pilih Semua
          </button>
          <button
            @click="selectAllRole(false)"
            class="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
          >
            Hapus Semua
          </button>
        </div>
      </div>

      <!-- Permissions List -->
      <div class="p-4 max-h-[60vh] overflow-y-auto" v-if="!roleLoading">
        <div
          v-for="(perms, category) in groupedRolePermissions"
          :key="category"
          class="mb-6"
        >
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-bold text-slate-700">{{ category }}</h3>
            <div class="flex items-center gap-1">
              <button
                @click="selectAllCategory(category, true)"
                class="text-xs text-green-600 hover:underline"
              >
                Semua
              </button>
              <span class="text-slate-300">|</span>
              <button
                @click="selectAllCategory(category, false)"
                class="text-xs text-red-600 hover:underline"
              >
                Tidak ada
              </button>
            </div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
            <label
              v-for="perm in perms"
              :key="perm.path"
              class="flex items-center gap-2 p-2 rounded-lg border transition-all"
              :class="[
                isProtectedForAdmin(perm.path)
                  ? 'border-blue-200 bg-blue-50 cursor-not-allowed'
                  : perm.isAllowed
                  ? 'border-green-200 bg-green-50 cursor-pointer'
                  : 'border-slate-200 bg-slate-50 cursor-pointer',
              ]"
            >
              <input
                type="checkbox"
                v-model="perm.isAllowed"
                :disabled="isProtectedForAdmin(perm.path)"
                class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 disabled:opacity-50"
              />
              <span class="text-sm text-slate-700 flex items-center gap-1">
                {{ perm.label }}
                <Icon
                  v-if="isProtectedForAdmin(perm.path)"
                  icon="solar:lock-keyhole-minimalistic-bold"
                  class="text-blue-500 text-xs"
                  title="Route ini wajib aktif untuk Admin"
                />
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-else class="p-8 flex items-center justify-center text-slate-400">
        <Icon icon="svg-spinners:ring-resize" class="text-2xl mr-2" />
        Memuat...
      </div>

      <!-- Save Button -->
      <div class="p-4 border-t border-slate-100 flex justify-end">
        <button
          @click="saveRolePermissions"
          :disabled="roleLoading"
          class="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          <Icon icon="solar:diskette-line-duotone" class="inline mr-2" />
          Simpan Pengaturan
        </button>
      </div>
    </div>

    <!-- User-based Tab -->
    <div
      v-if="activeTab === 'user'"
      class="bg-white rounded-xl shadow-sm border border-slate-200"
    >
      <!-- User Selector -->
      <div class="p-4 border-b border-slate-100">
        <div class="flex items-center gap-4 mb-3">
          <label class="text-sm font-medium text-slate-700 shrink-0"
            >Cari User:</label
          >
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Nama atau email..."
            class="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div
          class="max-h-48 overflow-y-auto border border-slate-100 rounded-lg"
        >
          <button
            v-for="user in filteredUsers"
            :key="user.id"
            @click="selectedUserId = user.id"
            class="w-full flex items-center gap-3 p-3 hover:bg-slate-50 border-b border-slate-50 last:border-b-0 text-left transition-colors"
            :class="{ 'bg-primary-50': selectedUserId === user.id }"
          >
            <div
              class="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium"
            >
              {{ user.name?.charAt(0)?.toUpperCase() || "?" }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-slate-800 truncate">
                {{ user.name }}
              </div>
              <div class="text-xs text-slate-500 truncate">
                {{ user.email }} • {{ user.role }}
              </div>
            </div>
            <Icon
              v-if="selectedUserId === user.id"
              icon="solar:check-circle-bold"
              class="text-primary-600 text-lg"
            />
          </button>
        </div>
      </div>

      <!-- User Permissions -->
      <div
        v-if="selectedUserId && !userLoading"
        class="p-4 max-h-[50vh] overflow-y-auto"
      >
        <p class="text-xs text-slate-500 mb-4">
          <Icon icon="solar:info-circle-line-duotone" class="inline mr-1" />
          Centang untuk mengaktifkan override. Jika tidak di-override, akan
          mengikuti pengaturan role.
        </p>
        <div
          v-for="(perms, category) in groupedUserPermissions"
          :key="category"
          class="mb-6"
        >
          <h3 class="text-sm font-bold text-slate-700 mb-2">{{ category }}</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div
              v-for="perm in perms"
              :key="perm.path"
              class="flex flex-col p-2 rounded-lg border transition-all"
              :class="
                perm.hasOverride
                  ? perm.isAllowed
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                  : 'border-slate-200 bg-slate-50'
              "
            >
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  :checked="perm.hasOverride"
                  @change="toggleUserOverride(perm)"
                  class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span class="text-sm text-slate-700">{{ perm.label }}</span>
              </label>
              <div v-if="perm.hasOverride" class="mt-1 pl-6 flex gap-2">
                <label class="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="radio"
                    :value="true"
                    v-model="perm.isAllowed"
                    class="w-3 h-3 text-green-600"
                  />
                  <span class="text-green-600">Boleh</span>
                </label>
                <label class="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="radio"
                    :value="false"
                    v-model="perm.isAllowed"
                    class="w-3 h-3 text-red-600"
                  />
                  <span class="text-red-600">Tidak</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No User Selected -->
      <div
        v-else-if="!selectedUserId && !userLoading"
        class="p-8 text-center text-slate-400"
      >
        <Icon icon="solar:user-search-line-duotone" class="text-4xl mb-2" />
        <p>Pilih user untuk mengatur hak akses</p>
      </div>

      <!-- Loading -->
      <div
        v-else-if="userLoading"
        class="p-8 flex items-center justify-center text-slate-400"
      >
        <Icon icon="svg-spinners:ring-resize" class="text-2xl mr-2" />
        Memuat...
      </div>

      <!-- Save Button -->
      <div
        v-if="selectedUserId"
        class="p-4 border-t border-slate-100 flex justify-end"
      >
        <button
          @click="saveUserPermissions"
          :disabled="userLoading"
          class="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          <Icon icon="solar:diskette-line-duotone" class="inline mr-2" />
          Simpan Pengaturan
        </button>
      </div>
    </div>

    <!-- Status Modal -->
    <StatusModal
      :isOpen="statusModal.show"
      :type="statusModal.type"
      :title="statusModal.title"
      :message="statusModal.message"
      @close="statusModal.show = false"
    />
  </div>
</template>
