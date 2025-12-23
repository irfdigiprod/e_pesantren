<!-- src/components/layout/Sidebar.vue -->
<script setup>
import { Icon } from "@iconify/vue";
import { ref, computed, watch } from "vue";
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

// ===== MAIN ICON BAR (KIRI) =====
const mainMenus = [
  { id: "apps", icon: "solar:widget-3-line-duotone", label: "Apps" },
  {
    id: "analytics",
    icon: "solar:chart-square-line-duotone",
    label: "Analytics",
  },
  { id: "settings", icon: "solar:settings-line-duotone", label: "Settings" },
  {
    id: "security",
    icon: "solar:shield-check-line-duotone",
    label: "Security",
  },
];

const activeMainId = ref("apps");
const openDropdownId = ref(null);

// ===== DATA SUBMENU =====
const submenuByMain = {
  apps: {
    title: "Apps",
    items: [
      { label: "AI", icon: "solar:cpu-bolt-line-duotone", route: "/apps/ai" },
      {
        label: "Contacts",
        icon: "solar:phone-rounded-line-duotone",
        route: "/apps/contacts",
      },
      {
        label: "Ecommerce",
        icon: "solar:cart-large-4-line-duotone",
        children: [
          { label: "Products", route: "/apps/ecommerce/products" },
          { label: "Orders", route: "/apps/ecommerce/orders" },
        ],
      },
      {
        label: "Blogs",
        icon: "solar:document-add-line-duotone",
        children: [
          { label: "Blog List", route: "/apps/blogs/list" },
          { label: "Blog Detail", route: "/apps/blogs/detail" },
        ],
      },
      {
        label: "Chats",
        icon: "solar:chat-round-dots-line-duotone",
        route: "/apps/chats",
      },
      {
        label: "User Profile",
        icon: "solar:user-circle-line-duotone",
        route: "/apps/user-profile",
      },
      {
        label: "Invoice",
        icon: "solar:bill-list-line-duotone",
        children: [
          { label: "Invoice List", route: "/apps/invoice/list" },
          { label: "Invoice Details", route: "/apps/invoice/details" },
        ],
      },
      {
        label: "Notes",
        icon: "solar:notes-line-duotone",
        route: "/apps/notes",
      },
      {
        label: "Calendar",
        icon: "solar:calendar-date-line-duotone",
        route: "/apps/calendar",
      },
      {
        label: "Email",
        icon: "solar:mailbox-line-duotone",
        route: "/apps/email",
      },
      {
        label: "Tickets",
        icon: "solar:ticket-line-duotone",
        route: "/apps/tickets",
      },
      {
        label: "Kanban",
        icon: "solar:widget-5-line-duotone",
        route: "/apps/kanban",
      },
    ],
  },

  analytics: {
    title: "Analytics",
    items: [
      {
        label: "Overview",
        icon: "solar:graph-line-duotone",
        route: "/analytics/overview",
      },
      {
        label: "Reports",
        icon: "solar:diagram-up-line-duotone",
        route: "/analytics/reports",
      },
    ],
  },

  settings: {
    title: "Settings",
    items: [
      {
        label: "General",
        icon: "solar:settings-minimalistic-line-duotone",
        route: "/settings/general",
      },
      {
        label: "Billing",
        icon: "solar:wallet-line-duotone",
        route: "/settings/billing",
      },
    ],
  },

  security: {
    title: "Security",
    items: [
      {
        label: "Roles",
        icon: "solar:lock-password-line-duotone",
        route: "/security/roles",
      },
    ],
  },
};

const currentSubmenu = computed(() => submenuByMain[activeMainId.value]);

// ===== HELPER ACTIVE STATE =====
const isRouteActive = (path) => route.path === path;

const isParentActive = (item) => {
  if (!item.children) return false;
  return item.children.some((child) => isRouteActive(child.route));
};

const setActiveMain = (id) => {
  activeMainId.value = id;
  openDropdownId.value = null; // tutup dropdown saat pindah kategori
};

const toggleDropdown = (label) => {
  openDropdownId.value = openDropdownId.value === label ? null : label;
};

const navigate = (to) => {
  router.push(to);
  emit("close"); // tutup sidebar di mobile
};

// ===== AUTO SET ACTIVE MAIN + DROPDOWN BERDASARKAN URL =====
watch(
  () => route.path,
  (path) => {
    // loop semua main menu
    for (const [mainId, submenu] of Object.entries(submenuByMain)) {
      for (const item of submenu.items) {
        // item tanpa children
        if (!item.children && item.route === path) {
          activeMainId.value = mainId;
          openDropdownId.value = null;
          return;
        }
        // item dengan children
        if (item.children) {
          const foundChild = item.children.find(
            (child) => child.route === path
          );
          if (foundChild) {
            activeMainId.value = mainId;
            openDropdownId.value = item.label; // buka dropdown parent
            return;
          }
        }
      }
    }
  },
  { immediate: true }
);
</script>

<template>
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
      <!-- Close di mobile -->
      <button
        class="lg:hidden mb-3 p-2 hover:bg-amber-300 hover:text-primary rounded-2xl border border-slate-200"
        @click="emit('close')"
      >
        <Icon icon="solar:double-alt-arrow-left-line-duotone" class="text-xl" />
      </button>

      <button
        v-for="m in mainMenus"
        :key="m.id"
        class="w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-200"
        :class="
          m.id === activeMainId
            ? 'bg-primary text-white shadow-md'
            : 'text-slate-500 hover:bg-slate-200'
        "
        @click="setActiveMain(m.id)"
        :title="m.label"
      >
        <Icon :icon="m.icon" class="text-2xl" />
      </button>
    </div>

    <!-- PANEL SUBMENU KANAN -->
    <div class="w-64 bg-white h-full flex flex-col">
      <div class="px-5 py-4 border-b border-slate-100">
        <h2 class="text-sm font-semibold text-slate-700">
          {{ currentSubmenu?.title || "Menu" }}
        </h2>
      </div>

      <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        <div
          v-for="item in currentSubmenu?.items || []"
          :key="item.label"
          class="text-sm"
        >
          <!-- ITEM TANPA DROPDOWN -->
          <button
            v-if="!item.children"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-amber-300 transition-colors duration-150 text-slate-600 hover:text-amber-900"
            :class="
              isRouteActive(item.route)
                ? 'bg-amber-400 text-amber-900 font-semibold'
                : 'text-slate-600'
            "
            @click="navigate(item.route)"
          >
            <Icon :icon="item.icon" class="text-lg" />
            <span>{{ item.label }}</span>
          </button>

          <!-- ITEM DENGAN DROPDOWN -->
          <div v-else>
            <button
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-amber-300 transition-colors duration-150 hover:text-amber-900"
              :class="[
                openDropdownId === item.label || isParentActive(item)
                  ? 'bg-amber-300 text-amber-900 font-semibold'
                  : 'text-slate-600 hover:bg-amber-300 hover:text-amber-900',
              ]"
              @click="toggleDropdown(item.label)"
            >
              <Icon :icon="item.icon" class="text-lg" />
              <span class="flex-1 text-left">{{ item.label }}</span>
              <Icon
                :icon="
                  openDropdownId === item.label
                    ? 'solar:alt-arrow-up-line-duotone'
                    : 'solar:alt-arrow-down-line-duotone'
                "
                class="text-lg"
              />
            </button>

            <!-- CHILD DROPDOWN -->
            <transition name="fade">
              <div
                v-if="openDropdownId === item.label"
                class="mt-1 ml-9 space-y-1"
              >
                <button
                  v-for="child in item.children"
                  :key="child.label"
                  class="w-full text-left text-xs px-3 py-2.5 rounded-md hover:bg-amber-300 text-slate-500 hover:text-amber-900 transition-colors duration-150"
                  :class="
                    isRouteActive(child.route)
                      ? 'bg-amber-400 text-amber-950 font-semibold'
                      : 'text-slate-600 hover:bg-amber-300 hover:text-amber-900'
                  "
                  @click="navigate(child.route)"
                >
                  {{ child.label }}
                </button>
              </div>
            </transition>
          </div>
        </div>
      </nav>

      <div
        class="px-4 py-3 border-t border-slate-100 text-[11px] text-slate-400"
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
