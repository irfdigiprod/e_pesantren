<!-- src/components/layout/Sidebar.vue -->
<script setup>
import { Icon } from "@iconify/vue";
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);

const route = useRoute();
const router = useRouter();

// ========== MAIN ICON (BAR KIRI) ==========
const mainMenus = [
  { id: "apps", icon: "mdi:apps", label: "Apps" },
  { id: "analytics", icon: "mdi:chart-line", label: "Analytics" },
  { id: "settings", icon: "mdi:tune-variant", label: "Settings" },
  { id: "security", icon: "mdi:shield-check-outline", label: "Security" },
];

const activeMainId = ref("apps");

const setActiveMain = (id) => {
  activeMainId.value = id;
};

// ========== DATA SUB MENU ==========

const submenuByMain = {
  apps: {
    title: "Apps",
    items: [
      {
        id: "ai",
        label: "AI",
        icon: "mdi:star-circle-outline",
        route: "/apps/ai",
        hasDropdown: false,
      },
      {
        id: "contacts",
        label: "Contacts",
        icon: "mdi:phone-outline",
        route: "/apps/contacts",
        hasDropdown: false,
      },
      {
        id: "ecommerce",
        label: "Ecommerce",
        icon: "mdi:cart-outline",
        hasDropdown: true,
        children: [
          { label: "Products", route: "/apps/ecommerce/products" },
          { label: "Orders", route: "/apps/ecommerce/orders" },
        ],
      },
      {
        id: "blogs",
        label: "Blogs",
        icon: "mdi:post-outline",
        hasDropdown: true,
        children: [
          { label: "Blog List", route: "/apps/blogs/list" },
          { label: "Blog Detail", route: "/apps/blogs/detail" },
        ],
      },
      {
        id: "chats",
        label: "Chats",
        icon: "mdi:chat-outline",
        route: "/apps/chats",
        hasDropdown: false,
      },
      {
        id: "user-profile",
        label: "User Profile",
        icon: "mdi:account-circle-outline",
        route: "/apps/user-profile",
        hasDropdown: false,
      },
      {
        id: "invoice",
        label: "Invoice",
        icon: "mdi:receipt-text-outline",
        hasDropdown: true,
        children: [
          { label: "Invoice List", route: "/apps/invoice/list" },
          { label: "Invoice Details", route: "/apps/invoice/details" },
        ],
      },
      {
        id: "notes",
        label: "Notes",
        icon: "mdi:notebook-outline",
        route: "/apps/notes",
        hasDropdown: false,
      },
      {
        id: "calendar",
        label: "Calendar",
        icon: "mdi:calendar-month-outline",
        route: "/apps/calendar",
        hasDropdown: false,
      },
      {
        id: "email",
        label: "Email",
        icon: "mdi:email-outline",
        route: "/apps/email",
        hasDropdown: false,
      },
      {
        id: "tickets",
        label: "Tickets",
        icon: "mdi:ticket-outline",
        route: "/apps/tickets",
        hasDropdown: false,
      },
      {
        id: "kanban",
        label: "Kanban",
        icon: "mdi:view-column-outline",
        route: "/apps/kanban",
        hasDropdown: false,
      },
    ],
  },

  analytics: {
    title: "Analytics",
    items: [
      {
        id: "overview",
        label: "Overview",
        icon: "mdi:chart-box-outline",
        route: "/analytics/overview",
      },
      {
        id: "reports",
        label: "Reports",
        icon: "mdi:file-chart-outline",
        route: "/analytics/reports",
      },
    ],
  },

  settings: {
    title: "Settings",
    items: [
      {
        id: "general",
        label: "General",
        icon: "mdi:tune",
        route: "/settings/general",
      },
      {
        id: "billing",
        label: "Billing",
        icon: "mdi:credit-card-outline",
        route: "/settings/billing",
      },
    ],
  },

  security: {
    title: "Security",
    items: [
      {
        id: "roles",
        label: "Roles",
        icon: "mdi:account-key-outline",
        route: "/security/roles",
      },
    ],
  },
};

const currentSubmenu = computed(() => submenuByMain[activeMainId.value]);

// Dropdown yang terbuka
const openDropdownId = ref(null);

const toggleDropdown = (id) => {
  openDropdownId.value = openDropdownId.value === id ? null : id;
};

const isRouteActive = (routePath) => route.path === routePath;

const isParentActive = (item) => {
  if (!item.children) return false;
  return item.children.some((child) => isRouteActive(child.route));
};

const navigateTo = (routePath) => {
  if (!routePath) return;
  router.push(routePath);
  emit("close"); // tutup sidebar di mobile
};
</script>

<template>
  <!-- SIDEBAR WRAPPER -->
  <aside
    class="fixed inset-y-0 left-0 bg-slate-50 border-r border-slate-200 shadow-sm transform transition-transform duration-200 lg:translate-x-0 flex flex-row z-30"
    :class="[
      isOpen ? 'translate-x-0' : '-translate-x-full',
      'lg:static lg:inset-auto',
    ]"
  >
    <!-- BAR ICON KIRI -->
    <div
      class="w-16 bg-slate-50 border-r border-slate-200 flex flex-col items-center py-4 gap-4"
    >
      <!-- Tombol close (mobile) -->
      <button
        class="lg:hidden mb-4 p-2 rounded-md border border-slate-200"
        @click="emit('close')"
      >
        <Icon icon="mdi:close" class="text-xl" />
      </button>

      <!-- Icon utama -->
      <button
        v-for="main in mainMenus"
        :key="main.id"
        class="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors duration-150 hover:bg-indigo-100"
        :class="
          activeMainId === main.id
            ? 'bg-indigo-500 text-white shadow-md'
            : 'text-slate-500'
        "
        @click="setActiveMain(main.id)"
        :title="main.label"
      >
        <Icon :icon="main.icon" class="text-2xl" />
      </button>
    </div>

    <!-- PANEL KANAN (SUB MENU) -->
    <div class="w-64 bg-white h-full flex flex-col">
      <!-- Title -->
      <div class="px-5 py-4 border-b border-slate-100">
        <h2 class="text-sm font-semibold text-slate-700">
          {{ currentSubmenu?.title || "Menu" }}
        </h2>
      </div>

      <!-- Submenu -->
      <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        <div
          v-for="item in currentSubmenu?.items || []"
          :key="item.id"
          class="text-sm"
        >
          <!-- Item tanpa dropdown -->
          <button
            v-if="!item.hasDropdown"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors duration-150 text-slate-600"
            :class="
              isRouteActive(item.route)
                ? 'bg-indigo-50 text-indigo-600 font-semibold'
                : ''
            "
            @click="navigateTo(item.route)"
          >
            <Icon :icon="item.icon" class="text-lg" />
            <span>{{ item.label }}</span>
          </button>

          <!-- Item dengan dropdown -->
          <div v-else>
            <button
              class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors duration-150 text-slate-600"
              :class="[
                openDropdownId === item.id || isParentActive(item)
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : '',
              ]"
              @click="toggleDropdown(item.id)"
            >
              <Icon :icon="item.icon" class="text-lg" />
              <span class="flex-1 text-left">{{ item.label }}</span>
              <Icon
                :icon="
                  openDropdownId === item.id
                    ? 'mdi:chevron-up'
                    : 'mdi:chevron-down'
                "
                class="text-lg"
              />
            </button>

            <!-- Child submenu -->
            <transition name="fade">
              <div
                v-if="openDropdownId === item.id"
                class="mt-1 ml-9 space-y-1"
              >
                <button
                  v-for="child in item.children"
                  :key="child.label"
                  class="w-full text-left text-xs px-2 py-1.5 rounded-md hover:bg-slate-50 text-slate-500 transition-colors duration-150"
                  :class="
                    isRouteActive(child.route)
                      ? 'bg-indigo-50 text-indigo-600 font-semibold'
                      : ''
                  "
                  @click="navigateTo(child.route)"
                >
                  {{ child.label }}
                </button>
              </div>
            </transition>
          </div>
        </div>
      </nav>

      <!-- Footer -->
      <div
        class="px-4 py-3 border-top border-slate-100 text-[11px] text-slate-400"
      >
        © {{ new Date().getFullYear() }} STAIMH
      </div>
    </div>
  </aside>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
