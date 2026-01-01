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
  fetchInfoBoard();
  window.addEventListener("user-updated", onUserUpdated);

  // Real-time updates for slider
  sliderUnsubscribe = wsClient.on("information_board_updated", () => {
    fetchInfoBoard();
  });
});

onUnmounted(() => {
  window.removeEventListener("user-updated", onUserUpdated);
  if (slideInterval) clearInterval(slideInterval);
  if (sliderUnsubscribe) sliderUnsubscribe();
});

/* ============================
   INFO BOARD SLIDER
   ============================ */
// Import useSwipe from vueuse
import { useSwipe } from "@vueuse/core";
import { wsClient } from "@/services/websocket";

const slides = ref([]);
const activeSlide = ref(0);
let slideInterval = null;
const sliderRef = ref(null); // Reference for swipe container
let sliderUnsubscribe = null;

const { direction, isSwiping } = useSwipe(sliderRef, {
  threshold: 30, // threshold for swipe detection
  onSwipeEnd: (e, direction) => {
    if (direction === "LEFT") nextSlide();
    if (direction === "RIGHT") prevSlide();
  },
});

const getImageUrl = (path) => {
  if (!path) return "";
  const base = import.meta.env.VITE_API_BASE_URL || "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("uploads/")) return `${base}/api/${path}`;
  return path;
};

async function fetchInfoBoard() {
  try {
    const token = localStorage.getItem("token");
    const base = import.meta.env.VITE_API_BASE_URL || "";
    const res = await fetch(`${base}/api/information-board`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (json.success) {
      slides.value = json.data;
      startSlider();
    }
  } catch (e) {
    console.error("Failed to fetch info board:", e);
  }
}

function startSlider() {
  if (slideInterval) clearInterval(slideInterval);
  if (slides.value.length > 1) {
    slideInterval = setInterval(() => {
      nextSlide(false); // false = not manual
    }, 5000);
  }
}

function nextSlide(manual = true) {
  if (slides.value.length < 2) return;
  activeSlide.value = (activeSlide.value + 1) % slides.value.length;
  if (manual) resetInterval();
}

function prevSlide(manual = true) {
  if (slides.value.length < 2) return;
  activeSlide.value =
    (activeSlide.value - 1 + slides.value.length) % slides.value.length;
  if (manual) resetInterval();
}

function resetInterval() {
  if (slideInterval) clearInterval(slideInterval);
  startSlider();
}

// Menu items grouped by category (matching Sidebar.vue structure)
const groupedMenuItems = [
  {
    title: "Apps - Guru",
    items: [
      {
        label: "Absensi Guru",
        icon: "solar:map-point-school-line-duotone",
        route: "/mobile-dashboard/attendance",
      },
      {
        label: "Data Guru",
        icon: "solar:users-group-rounded-line-duotone",
        route: "/mobile-dashboard/teachers",
      },
      {
        label: "Lapor Gaji",
        icon: "solar:banknote-2-line-duotone",
        route: "/mobile-dashboard/salary",
      },
      {
        label: "Divisi",
        icon: "solar:floor-lamp-line-duotone",
        route: "/mobile-dashboard/divisions",
      },
      {
        label: "Rekap Absen",
        icon: "solar:clipboard-list-line-duotone",
        route: "/mobile-dashboard/attendance-recap",
        adminOnly: true,
      },
      {
        label: "Izin Saya",
        icon: "solar:user-hand-up-line-duotone",
        route: "/mobile-dashboard/permissions",
      },
      {
        label: "Setuju Izin",
        icon: "solar:bill-check-line-duotone",
        route: "/mobile-dashboard/approvals",
        adminOnly: true,
      },
    ],
  },
  {
    title: "Apps - Santri",
    items: [
      {
        label: "Data Santri",
        icon: "solar:user-circle-line-duotone",
        route: "/mobile-dashboard/students",
      },
      {
        label: "Kamar",
        icon: "solar:sleeping-line-duotone",
        route: "/mobile-dashboard/rooms",
      },
      {
        label: "Prestasi",
        icon: "solar:cup-star-line-duotone",
        route: "/mobile-dashboard/rewards",
      },
      {
        label: "Absen Santri",
        icon: "solar:user-check-line-duotone",
        route: "/mobile-dashboard/student-attendance",
      },
    ],
  },
  {
    title: "Akademik",
    items: [
      {
        label: "Kelas",
        icon: "solar:ruler-pen-line-duotone",
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
      {
        label: "Cetak Rapor",
        icon: "solar:printer-line-duotone",
        route: "/mobile-dashboard/report-card",
      },
    ],
  },
  {
    title: "Tahfidz",
    items: [
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
        icon: "solar:revote-line-duotone",
        route: "/mobile-dashboard/tahfidz-exams",
      },
      {
        label: "Rapor",
        icon: "solar:document-text-line-duotone",
        route: "/mobile-dashboard/tahfidz-reports",
      },
      {
        label: "Mading",
        icon: "solar:presentation-graph-line-duotone",
        route: "/mobile-dashboard/tahfidz-mading",
      },
      {
        label: "Pengaturan",
        icon: "solar:settings-minimalistic-line-duotone",
        route: "/mobile-dashboard/tahfidz-settings",
      },
    ],
  },
  {
    title: "Klinik",
    items: [
      {
        label: "Obat",
        icon: "solar:pill-line-duotone",
        route: "/mobile-dashboard/clinic-medicines",
      },
      {
        label: "Rawat Inap",
        icon: "solar:hospital-line-duotone",
        route: "/mobile-dashboard/clinic-inpatients",
      },
      {
        label: "Periksa",
        icon: "solar:stethoscope-line-duotone",
        route: "/mobile-dashboard/clinic-examinations",
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        label: "Overview",
        icon: "solar:graph-line-duotone",
        route: "/mobile-dashboard/analytics",
      },
      {
        label: "Reports",
        icon: "solar:diagram-up-line-duotone",
        route: "/mobile-dashboard/analytics-reports",
      },
    ],
  },
  {
    title: "Pengaturan",
    items: [
      {
        label: "Umum",
        icon: "solar:settings-line-duotone",
        route: "/mobile-dashboard/settings",
      },
      {
        label: "Kehadiran",
        icon: "solar:watch-square-minimalistic-line-duotone",
        route: "/mobile-dashboard/settings-attendance",
      },
      {
        label: "Gaji",
        icon: "solar:banknote-2-line-duotone",
        route: "/mobile-dashboard/settings-salary",
      },
      {
        label: "Komp. Gaji",
        icon: "solar:wallet-money-line-duotone",
        route: "/mobile-dashboard/settings-salary-grading",
      },
      {
        label: "Lembaga",
        icon: "solar:buildings-2-line-duotone",
        route: "/mobile-dashboard/settings-institution",
      },
      {
        label: "Info Board",
        icon: "solar:gallery-wide-line-duotone",
        route: "/mobile-dashboard/settings-information-board",
      },
      {
        label: "Akademik",
        icon: "solar:calendar-line-duotone",
        route: "/mobile-dashboard/settings-academic",
      },
    ],
  },
  {
    title: "Lainnya",
    items: [
      {
        label: "Chat",
        icon: "solar:chat-round-dots-line-duotone",
        route: "/mobile-dashboard/chat",
      },
      {
        label: "Roles",
        icon: "solar:lock-password-line-duotone",
        route: "/mobile-dashboard/security-roles",
      },
      {
        label: "Tentang",
        icon: "solar:info-circle-line-duotone",
        route: "/mobile-dashboard/about",
      },
    ],
  },
];

const navigate = (path) => {
  router.push(path);
};
</script>

<template>
  <div class="p-4 min-h-full">
    <!-- Slider / Header -->
    <div
      v-if="slides.length > 0"
      ref="sliderRef"
      class="mb-6 relative w-full aspect-[3/1] rounded-2xl overflow-hidden shadow-md group touch-pan-y"
    >
      <!-- Slides -->
      <div
        v-for="(slide, index) in slides"
        :key="slide.id"
        class="absolute inset-0 transition-opacity duration-700 ease-in-out"
        :class="index === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'"
      >
        <img
          :src="getImageUrl(slide.imageUrl)"
          class="w-full h-full object-cover select-none pointer-events-none"
          alt="Info Board"
        />
        <!-- Gradient Overlay -->
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
        ></div>
      </div>

      <!-- Indicators -->
      <div
        class="absolute bottom-3 right-4 z-20 flex gap-1.5 pointer-events-none"
      >
        <div
          v-for="(_, idx) in slides"
          :key="idx"
          class="w-1.5 h-1.5 rounded-full transition-all duration-300"
          :class="idx === activeSlide ? 'bg-white w-4' : 'bg-white/50'"
        ></div>
      </div>

      <!-- Navigation Buttons (Always visible or hover only? Based on user image, always visible but subtle) -->
      <!-- Left Button -->
      <button
        v-if="slides.length > 1"
        @click.stop="prevSlide()"
        class="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/40 active:scale-95 transition-all"
      >
        <Icon icon="solar:alt-arrow-left-linear" class="text-xl" />
      </button>

      <!-- Right Button -->
      <button
        v-if="slides.length > 1"
        @click.stop="nextSlide()"
        class="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/40 active:scale-95 transition-all"
      >
        <Icon icon="solar:alt-arrow-right-linear" class="text-xl" />
      </button>
    </div>

    <!-- Default Header (Fallback) -->
    <div v-else class="mb-6 flex justify-between items-center">
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
    <!-- Groups -->
    <div v-for="group in groupedMenuItems" :key="group.title" class="mb-6">
      <h3
        class="text-sm font-bold text-slate-400 mb-3 px-1 tracking-wider text-[10px]"
      >
        {{ group.title }}
      </h3>
      <div class="grid grid-cols-5 gap-y-4 gap-x-2">
        <button
          v-for="(item, index) in group.items"
          :key="index"
          @click="navigate(item.route)"
          class="flex flex-col items-center gap-1.5 group w-full"
        >
          <div
            class="w-11 h-11 rounded-xl border border-slate-100 shadow-sm flex items-center justify-center text-xl transition-all duration-200 group-active:scale-95"
            :class="
              item.isLogout
                ? 'bg-red-50 text-red-500 border-red-100 group-active:bg-red-500 group-active:text-white'
                : 'bg-white text-[#602515] group-active:bg-[#f8ae19] group-active:text-white group-active:border-[#f8ae19]'
            "
          >
            <Icon :icon="item.icon" />
          </div>
          <span
            class="text-[9px] text-center text-slate-600 font-medium leading-tight line-clamp-2 px-0.5"
          >
            {{ item.label }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
