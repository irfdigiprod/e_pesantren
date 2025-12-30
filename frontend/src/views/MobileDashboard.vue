<script setup>
import { Icon } from "@iconify/vue";
import { useRouter } from "vue-router";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { usersApi } from "@/services/api";

const router = useRouter();
const user = ref(null);

const photoUrl = computed(() => {
  const photo = user.value?.photo || user.value?.raw?.photo;
  if (!photo) return null;
  const base = import.meta.env.VITE_API_BASE_URL || "";
  if (photo.startsWith("uploads/")) {
    return `${base}/api/${photo}`;
  }
  return photo;
});

const initials = computed(() => {
  if (!user.value) return "?";
  const n = user.value.name || user.value.email || "";
  if (n) {
    const parts = n.split(/[@\s]/).filter(Boolean);
    if (parts.length >= 1) return parts[0].slice(0, 2).toUpperCase();
  }
  return "?";
});

function loadStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    if (raw) user.value = JSON.parse(raw);
  } catch (_) {}
}

async function fetchCurrent() {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const res = await usersApi.getCurrent();
    user.value = res.data || res;
    localStorage.setItem("user", JSON.stringify(user.value));
  } catch (_) {}
}

function onUserUpdated(e) {
  const maybe = e && e.detail ? e.detail : null;
  if (maybe) {
    user.value = maybe;
  } else {
    loadStoredUser();
  }
}

onMounted(() => {
  loadStoredUser();
  fetchCurrent();
  window.addEventListener("user-updated", onUserUpdated);
});

onUnmounted(() => {
  window.removeEventListener("user-updated", onUserUpdated);
});

// Replicating/Flattening items from Sidebar.vue for the grid
const menuItems = [
  // Apps
  {
    label: "Chat",
    icon: "solar:chat-round-dots-line-duotone",
    route: "/mobile-dashboard/chat",
  },
  {
    label: "Profil",
    icon: "solar:user-circle-line-duotone",
    route: "/mobile-dashboard/profile",
  },

  // Guru
  {
    label: "Absensi",
    icon: "solar:square-academic-cap-line-duotone",
    route: "/mobile-dashboard/attendance",
  },
  {
    label: "Data Guru",
    icon: "solar:users-group-rounded-line-duotone",
    route: "/mobile-dashboard/teachers",
  },
  {
    label: "Gaji",
    icon: "solar:banknote-2-line-duotone",
    route: "/mobile-dashboard/salary",
  },
  {
    label: "Divisi",
    icon: "solar:sitemap-line-duotone",
    route: "/mobile-dashboard/divisions",
  },
  {
    label: "Perizinan",
    icon: "solar:clipboard-check-line-duotone",
    route: "/mobile-dashboard/permissions",
  },

  // Santri
  {
    label: "Santri",
    icon: "solar:user-id-line-duotone",
    route: "/mobile-dashboard/students",
  },
  {
    label: "Kamar",
    icon: "solar:bed-line-duotone",
    route: "/mobile-dashboard/rooms",
  },
  {
    label: "Prestasi",
    icon: "solar:star-circle-line-duotone",
    route: "/mobile-dashboard/rewards",
  },

  // Akademik
  {
    label: "Kelas",
    icon: "solar:blackboard-line-duotone",
    route: "/mobile-dashboard/classes",
  },
  {
    label: "Mapel",
    icon: "solar:book-2-line-duotone",
    route: "/mobile-dashboard/subjects",
  },
  {
    label: "Jadwal",
    icon: "solar:calendar-date-line-duotone",
    route: "/mobile-dashboard/schedules",
  },
  {
    label: "Nilai",
    icon: "solar:diploma-verified-line-duotone",
    route: "/mobile-dashboard/grades",
  },
  {
    label: "Rapor",
    icon: "solar:document-text-line-duotone",
    route: "/mobile-dashboard/academic-reports",
  },

  // Tahfidz
  {
    label: "Halaqah",
    icon: "solar:users-group-two-rounded-line-duotone",
    route: "/mobile-dashboard/halaqah",
  },
  {
    label: "Mutaba'ah",
    icon: "solar:book-bookmark-line-duotone",
    route: "/mobile-dashboard/tahfidz",
  },
  {
    label: "Input",
    icon: "solar:pen-new-square-line-duotone",
    route: "/mobile-dashboard/tahfidz-input",
  },
  {
    label: "Ujian",
    icon: "solar:test-tube-minimalistic-line-duotone",
    route: "/mobile-dashboard/tahfidz-exams",
  },
  {
    label: "Laporan",
    icon: "solar:file-check-line-duotone",
    route: "/mobile-dashboard/tahfidz-reports",
  },

  // Others
  {
    label: "Klinik",
    icon: "solar:stethoscope-line-duotone",
    route: "/mobile-dashboard/clinic",
  },
  {
    label: "Analytics",
    icon: "solar:chart-square-line-duotone",
    route: "/mobile-dashboard/analytics",
  },

  // Settings
  {
    label: "Settings",
    icon: "solar:settings-line-duotone",
    route: "/mobile-dashboard/settings",
  },
];

const navigate = (path) => {
  router.push(path);
};
</script>

<template>
  <div class="p-4 min-h-full">
    <!-- Header -->
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-xl font-bold text-[#602515]">Dashboard</h1>
        <p class="text-xs text-slate-500">Selamat datang kembali!</p>
      </div>
      <div
        class="w-10 h-10 rounded-full bg-[#f8ae19] flex items-center justify-center text-white overflow-hidden shadow-sm"
      >
        <img
          v-if="photoUrl"
          :src="photoUrl"
          class="w-full h-full object-cover"
        />
        <span v-else-if="user?.name" class="font-bold text-sm">{{
          initials
        }}</span>
        <Icon v-else icon="solar:user-line-duotone" class="text-xl" />
      </div>
    </div>

    <!-- Grid Menu -->
    <!-- Grid 5 columns as requested -->
    <div class="grid grid-cols-5 gap-y-6 gap-x-2">
      <button
        v-for="(item, index) in menuItems"
        :key="index"
        @click="navigate(item.route)"
        class="flex flex-col items-center gap-2 group"
      >
        <div
          class="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-[#602515] group-active:scale-95 transition-all duration-200 group-active:bg-[#f8ae19] group-active:text-white group-active:border-[#f8ae19]"
        >
          <Icon :icon="item.icon" class="text-2xl" />
        </div>
        <span
          class="text-[10px] text-center text-slate-600 font-medium leading-tight line-clamp-2 px-1"
        >
          {{ item.label }}
        </span>
      </button>
    </div>
  </div>
</template>
