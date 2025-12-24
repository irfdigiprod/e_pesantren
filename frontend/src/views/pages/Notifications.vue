<script setup>
import { ref, onMounted, computed } from "vue";
import { Icon } from "@iconify/vue";
import { notificationsApi } from "@/services/api";
import { useRouter } from "vue-router";
import TopBar from "@/components/layout/TopBar.vue";

const router = useRouter();
const loading = ref(true);
const notifications = ref([]);
const filter = ref("all"); // 'all', 'unread', 'system', 'permission'

const filteredNotifications = computed(() => {
  let list = notifications.value;
  if (filter.value === "unread") list = list.filter((n) => !n.isRead);
  else if (filter.value !== "all")
    list = list.filter((n) => n.type.includes(filter.value));
  return list;
});

async function fetchNotifications() {
  loading.value = true;
  try {
    const res = await notificationsApi.getAll();
    if (res.success) {
      notifications.value = res.data;
    }
  } catch (e) {
    console.error("Failed to fetch notifications:", e);
  } finally {
    loading.value = false;
  }
}

async function markAsRead(id) {
  try {
    await notificationsApi.markAsRead(id);
    const n = notifications.value.find((item) => item.id === id);
    if (n) n.isRead = true;
  } catch (e) {
    console.error("Failed to mark as read:", e);
  }
}

async function markAllRead() {
  loading.value = true;
  try {
    await notificationsApi.markAllRead();
    // Update local state
    notifications.value.forEach((n) => (n.isRead = true));
  } catch (e) {
    console.error("Failed to mark all read:", e);
  } finally {
    loading.value = false;
  }
}

function getIcon(type) {
  if (type.includes("permission")) return "solar:document-text-bold-duotone";
  if (type.includes("invite")) return "mdi:account-group";
  if (type.includes("chat")) return "solar:chat-line-bold-duotone";
  return "solar:bell-bold-duotone";
}

function getColor(type) {
  if (type.includes("permission_status") || type.includes("approved"))
    return "text-emerald-600 bg-emerald-100";
  if (type.includes("rejected")) return "text-rose-600 bg-rose-100";
  if (type.includes("permission")) return "text-blue-600 bg-blue-100";
  if (type.includes("invite")) return "text-violet-600 bg-violet-100";
  return "text-slate-600 bg-slate-100";
}

function handleClick(notification) {
  if (!notification.isRead) markAsRead(notification.id);

  // Navigation logic based on type
  if (notification.type === "permission_request") {
    router.push("/apps/attendance/approvals");
  } else if (notification.type === "permission_status") {
    router.push("/apps/attendance/permissions");
  } else if (notification.type === "group_invite") {
    // Handle inline or navigate
  }
}

function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

onMounted(() => {
  fetchNotifications();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 pb-20 md:pb-6">
    <!-- TopBar (Desktop) -->
    <div class="hidden md:block sticky top-0 z-30">
      <TopBar />
    </div>

    <div class="max-w-3xl mx-auto px-4 py-4 md:py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-slate-800">Notifikasi</h1>
        <button
          @click="markAllRead"
          class="text-sm text-primary font-medium hover:text-amber-700"
        >
          Tandai semua dibaca
        </button>
      </div>

      <!-- Filters -->
      <div class="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
        <button
          v-for="f in ['all', 'unread', 'permission', 'system']"
          :key="f"
          @click="filter = f"
          class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
          :class="
            filter === f
              ? 'bg-slate-800 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          "
        >
          {{
            f === "all"
              ? "Semua"
              : f === "unread"
              ? "Belum Dibaca"
              : f.charAt(0).toUpperCase() + f.slice(1)
          }}
        </button>
      </div>

      <!-- List -->
      <div v-if="loading" class="space-y-4">
        <div
          v-for="i in 5"
          :key="i"
          class="bg-white p-4 rounded-xl border border-slate-100 animate-pulse flex gap-4"
        >
          <div class="w-12 h-12 bg-slate-200 rounded-full"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-slate-200 rounded w-1/3"></div>
            <div class="h-3 bg-slate-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>

      <div v-else-if="filteredNotifications.length > 0" class="space-y-3">
        <div
          v-for="item in filteredNotifications"
          :key="item.id"
          @click="handleClick(item)"
          class="bg-white p-4 rounded-xl border border-slate-100 hover:shadow-sm transition-shadow cursor-pointer relative"
          :class="{ 'bg-blue-50/50 border-blue-100': !item.isRead }"
        >
          <!-- Unread Dot -->
          <div
            v-if="!item.isRead"
            class="absolute top-4 right-4 w-2 h-2 rounded-full bg-rose-500"
          ></div>

          <div class="flex gap-4">
            <!-- Icon -->
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-xl"
              :class="getColor(item.type)"
            >
              <Icon :icon="getIcon(item.type)" />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <h3
                  class="font-semibold text-slate-800 text-sm md:text-base pr-4"
                >
                  {{ item.title }}
                </h3>
                <span class="text-xs text-slate-400 whitespace-nowrap">{{
                  formatTime(item.createdAt)
                }}</span>
              </div>
              <p class="text-sm text-slate-600 line-clamp-2">
                {{ item.message }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-20">
        <div
          class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400"
        >
          <Icon icon="solar:bell-off-line-duotone" class="text-4xl" />
        </div>
        <h3 class="text-lg font-medium text-slate-800">Tidak ada notifikasi</h3>
        <p class="text-slate-500 text-sm">
          Anda belum memiliki notifikasi pada kategori ini.
        </p>
      </div>
    </div>

    <!-- Mobile Bottom Nav -->
    <!-- Removed BottomNav usage as component does not exist -->
  </div>
</template>
