<script setup>
import { RouterView, useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { computed, watch } from "vue";
import HeaderMobile from "@/components/HeaderMobile.vue";
import { useMobileLayout } from "@/composables/useMobileLayout";

const route = useRoute();
const router = useRouter();
const { showHeader, showBottomNav, resetLayout } = useMobileLayout();

// Reset layout state on route change to ensure other pages have defaults
watch(
  () => route.path,
  () => {
    resetLayout();
  }
);

// Bottom Navigation Items
const navItems = [
  {
    label: "Home",
    icon: "solar:home-smile-line-duotone",
    route: "/mobile-dashboard",
  },
  {
    label: "Chat",
    icon: "solar:chat-round-dots-line-duotone",
    route: "/mobile-dashboard/chat",
  },
  {
    label: "Absensi",
    icon: "solar:map-point-school-line-duotone",
    route: "/mobile-dashboard/attendance",
  },
  {
    label: "Izin",
    icon: "solar:user-hand-up-line-duotone",
    route: "/mobile-dashboard/permissions",
  },
  {
    label: "Tahfidz",
    icon: "solar:book-bookmark-line-duotone",
    route: "/mobile-dashboard/tahfidz-input", // Or regular tahfidz dashboard? user said 'tahfidz'
  },
  {
    label: "Tentang",
    icon: "solar:info-circle-line-duotone",
    route: "/mobile-dashboard/about",
  },
];

const isActive = (path) => {
  if (path === "/mobile-dashboard" && route.path === "/mobile-dashboard")
    return true;
  if (path !== "/mobile-dashboard" && route.path.startsWith(path)) return true;
  return false;
};

const isRoot = computed(() => route.path === "/mobile-dashboard");

// Title logic
const currentTitle = computed(() => {
  if (route.meta?.title) return route.meta.title;

  const path = route.path;
  if (path.includes("/chat")) return "Chat";
  if (path.includes("/students")) return "Data Santri";
  if (path.includes("/tahfidz")) return "Tahfidz";
  if (path.includes("/attendance")) return "Absensi Guru";
  if (path.includes("/permissions")) return "Perizinan Saya";

  return "Dashboard";
});

// Colors
const primaryColor = "#602515";
const secondaryColor = "#f8ae19";
</script>

<template>
  <div class="flex flex-col h-screen bg-neutral-50 font-jakarta">
    <!-- Mobile Header -->
    <HeaderMobile
      v-if="showHeader"
      :title="currentTitle"
      :show-back="!isRoot"
      class="flex-none"
    />

    <!-- Main Content Area -->
    <div
      class="pt-2 flex-1 overflow-y-auto overflow-x-hidden"
      :class="showBottomNav ? 'pb-20' : ''"
    >
      <RouterView />
    </div>

    <!-- Bottom Navigation Bar -->
    <div
      v-if="showBottomNav"
      class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex justify-around items-center z-[100] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
      style="height: 70px"
    >
      <router-link
        v-for="(item, index) in navItems"
        :key="index"
        :to="item.route"
        class="flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-200"
        :class="isActive(item.route) ? 'text-[#f8ae19]' : 'text-[#602515]'"
      >
        <Icon
          :icon="item.icon"
          class="text-2xl"
          :class="isActive(item.route) ? 'scale-110' : ''"
        />
        <span class="text-[10px] font-medium text-center leading-tight">
          {{ item.label }}
        </span>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
/* Optional: Hide scrollbar for cleaner look */
::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}
</style>
