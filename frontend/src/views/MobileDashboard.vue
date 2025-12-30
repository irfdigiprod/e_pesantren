<script setup>
import { Icon } from "@iconify/vue";
import { useRouter } from "vue-router";

const router = useRouter();

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
        class="w-10 h-10 rounded-full bg-[#f8ae19] flex items-center justify-center text-white"
      >
        <Icon icon="solar:user-line-duotone" class="text-xl" />
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
