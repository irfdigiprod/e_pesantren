<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { Icon } from "@iconify/vue";
import { notificationsApi, chatApi } from "@/services/api";
import { useRouter } from "vue-router";

const router = useRouter();
const loading = ref(true);
const loadingMore = ref(false);
const systemNotifications = ref([]);
const chatNotifications = ref([]);
const filter = ref("all"); // 'all', 'unread', 'chat', 'permission', 'system'
const selectionMode = ref(false);
const selectedIds = ref(new Set());
const markingSelected = ref(false);

// Pagination (for system notifications)
const currentPage = ref(1);
const totalPages = ref(1);
const totalSystemNotifications = ref(0);
const PAGE_LIMIT = 30;

// Combined list of all notifications (system + chat) sorted by time
const allNotifications = computed(() => {
  const systemItems = systemNotifications.value.map((n) => ({
    ...n,
    itemType: "system",
    sortTime: new Date(n.createdAt),
  }));

  const chatItems = chatNotifications.value.map((c) => ({
    id: `chat-${c.conversationId}`,
    title: c.senderName,
    message: c.preview,
    type: "chat",
    itemType: "chat",
    isRead: false,
    createdAt: c.time,
    sortTime: new Date(c.time),
    conversationId: c.conversationId,
    senderInitial: c.senderInitial,
    unreadCount: c.unreadCount,
  }));

  return [...systemItems, ...chatItems].sort(
    (a, b) => b.sortTime - a.sortTime
  );
});

const filteredNotifications = computed(() => {
  let list = allNotifications.value;
  if (filter.value === "unread") list = list.filter((n) => !n.isRead);
  else if (filter.value === "chat")
    list = list.filter((n) => n.itemType === "chat");
  else if (filter.value !== "all")
    list = list.filter(
      (n) => n.itemType === "system" && n.type.includes(filter.value)
    );
  return list;
});

const unreadCount = computed(
  () => allNotifications.value.filter((n) => !n.isRead).length
);

const chatCount = computed(() => chatNotifications.value.length);

const selectedCount = computed(() => selectedIds.value.size);

const allVisibleSelected = computed(() => {
  // Only system notifications can be selected (chat ones can't be "marked read" via our API)
  const selectableUnread = filteredNotifications.value.filter(
    (n) => !n.isRead && n.itemType === "system"
  );
  return (
    selectableUnread.length > 0 &&
    selectableUnread.every((n) => selectedIds.value.has(n.id))
  );
});

const hasMore = computed(() => currentPage.value < totalPages.value);

const totalDisplayCount = computed(
  () => totalSystemNotifications.value + chatNotifications.value.length
);

async function fetchAll() {
  loading.value = true;
  try {
    await Promise.all([fetchSystemNotifications(1), fetchChatNotifications()]);
  } finally {
    loading.value = false;
  }
}

async function fetchSystemNotifications(page = 1, append = false) {
  if (page > 1) loadingMore.value = true;

  try {
    const res = await notificationsApi.getAll({
      page: page.toString(),
      limit: PAGE_LIMIT.toString(),
    });
    if (res.success) {
      if (append) {
        systemNotifications.value = [
          ...systemNotifications.value,
          ...res.data,
        ];
      } else {
        systemNotifications.value = res.data;
      }
      if (res.pagination) {
        currentPage.value = res.pagination.page;
        totalPages.value = res.pagination.totalPages;
        totalSystemNotifications.value = res.pagination.total;
      }
    }
  } catch (e) {
    console.error("Failed to fetch notifications:", e);
  } finally {
    loadingMore.value = false;
  }
}

async function fetchChatNotifications() {
  try {
    const res = await chatApi.getConversations();
    if (res.data) {
      const unreadList = [];
      const currentUserId = JSON.parse(
        localStorage.getItem("user") || "{}"
      )?.id;

      for (const conv of res.data) {
        if (conv.unreadCount > 0) {
          const other = conv.participants?.find(
            (p) => String(p.userId) !== String(currentUserId)
          );
          const senderName = other?.email?.split("@")[0] || "Pengguna";

          unreadList.push({
            conversationId: conv.id,
            senderName:
              senderName.charAt(0).toUpperCase() + senderName.slice(1),
            senderInitial: senderName.charAt(0).toUpperCase(),
            preview:
              conv.lastMessage?.content?.substring(0, 60) || "Pesan baru",
            unreadCount: conv.unreadCount,
            time: conv.lastMessageAt,
          });
        }
      }

      chatNotifications.value = unreadList;
    }
  } catch (e) {
    console.error("Failed to fetch chat notifications:", e);
  }
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return;
  await fetchSystemNotifications(currentPage.value + 1, true);
}

async function markAsRead(id) {
  try {
    await notificationsApi.markAsRead(id);
    const n = systemNotifications.value.find((item) => item.id === id);
    if (n) {
      n.isRead = true;
      window.dispatchEvent(new CustomEvent("notifications-read"));
    }
  } catch (e) {
    console.error("Failed to mark as read:", e);
  }
}

async function markAllRead() {
  loading.value = true;
  try {
    await notificationsApi.markAllRead();
    systemNotifications.value.forEach((n) => (n.isRead = true));
    selectedIds.value.clear();
    window.dispatchEvent(new CustomEvent("notifications-read"));
  } catch (e) {
    console.error("Failed to mark all read:", e);
  } finally {
    loading.value = false;
  }
}

async function markSelectedRead() {
  if (selectedIds.value.size === 0) return;
  markingSelected.value = true;
  try {
    const ids = Array.from(selectedIds.value);
    await notificationsApi.markSelectedRead(ids);
    systemNotifications.value.forEach((n) => {
      if (selectedIds.value.has(n.id)) {
        n.isRead = true;
      }
    });
    selectedIds.value.clear();
    selectionMode.value = false;
    window.dispatchEvent(new CustomEvent("notifications-read"));
  } catch (e) {
    console.error("Failed to mark selected read:", e);
  } finally {
    markingSelected.value = false;
  }
}

function toggleSelection(id) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }
  selectedIds.value = new Set(selectedIds.value);
}

function toggleSelectAll() {
  const selectableUnread = filteredNotifications.value.filter(
    (n) => !n.isRead && n.itemType === "system"
  );
  if (allVisibleSelected.value) {
    selectableUnread.forEach((n) => selectedIds.value.delete(n.id));
  } else {
    selectableUnread.forEach((n) => selectedIds.value.add(n.id));
  }
  selectedIds.value = new Set(selectedIds.value);
}

function toggleSelectionMode() {
  selectionMode.value = !selectionMode.value;
  if (!selectionMode.value) {
    selectedIds.value.clear();
    selectedIds.value = new Set();
  }
}

function getIcon(item) {
  if (item.itemType === "chat") return "solar:chat-line-bold-duotone";
  const type = item.type || "";
  if (type.includes("permission")) return "solar:document-text-bold-duotone";
  if (type.includes("invite")) return "mdi:account-group";
  return "solar:bell-bold-duotone";
}

function getColor(item) {
  if (item.itemType === "chat") return "text-amber-600 bg-amber-100";
  const type = item.type || "";
  if (type.includes("permission_status") || type.includes("approved"))
    return "text-emerald-600 bg-emerald-100";
  if (type.includes("rejected")) return "text-rose-600 bg-rose-100";
  if (type.includes("permission")) return "text-blue-600 bg-blue-100";
  if (type.includes("invite")) return "text-violet-600 bg-violet-100";
  return "text-slate-600 bg-slate-100";
}

// Detect if we're currently in mobile-dashboard context
const isMobileContext = computed(() => {
  return router.currentRoute.value.path.startsWith("/mobile-dashboard");
});

function handleClick(item) {
  if (selectionMode.value) {
    // Only system notifications can be selected
    if (!item.isRead && item.itemType === "system") {
      toggleSelection(item.id);
    }
    return;
  }

  const mobile = isMobileContext.value;

  // Chat notification → navigate to chat
  if (item.itemType === "chat") {
    // Remove from local list
    chatNotifications.value = chatNotifications.value.filter(
      (c) => c.conversationId !== item.conversationId
    );
    window.dispatchEvent(new CustomEvent("notifications-read"));
    const chatPath = mobile
      ? `/mobile-dashboard/chat?conv=${item.conversationId}&t=${Date.now()}`
      : `/apps/chat?conv=${item.conversationId}&t=${Date.now()}`;
    router.push(chatPath);
    return;
  }

  // System notification → mark as read and navigate
  if (!item.isRead) markAsRead(item.id);

  if (item.type === "permission_request") {
    router.push(mobile ? "/mobile-dashboard/approvals" : "/apps/attendance/approvals");
  } else if (item.type === "permission_status") {
    router.push(mobile ? "/mobile-dashboard/permissions" : "/apps/attendance/permissions");
  } else if (
    item.type === "permission_approved" ||
    item.type === "permission_rejected"
  ) {
    router.push(mobile ? "/mobile-dashboard/permissions" : "/apps/attendance/permissions");
  } else if (item.type === "group_invite") {
    router.push(mobile ? "/mobile-dashboard/chat" : "/apps/chat");
  }
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return "Baru saja";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} hari lalu`;

  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFilterLabel(f) {
  const labels = {
    all: "Semua",
    unread: "Belum Dibaca",
    chat: "Chat",
    permission: "Permission",
    system: "System",
  };
  return labels[f] || f;
}

// Listen for external notifications-read events (from TopBar/HeaderMobile)
function onExternalNotificationsRead() {
  fetchAll();
}

onMounted(() => {
  fetchAll();
  window.addEventListener("notifications-read", onExternalNotificationsRead);
});

onUnmounted(() => {
  window.removeEventListener(
    "notifications-read",
    onExternalNotificationsRead
  );
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 pb-20 md:pb-6">
    <div class="max-w-3xl mx-auto px-4 py-4 md:py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Notifikasi</h1>
          <p
            v-if="totalDisplayCount > 0"
            class="text-sm text-slate-500 mt-0.5"
          >
            {{ totalDisplayCount }} notifikasi ·
            <span v-if="unreadCount > 0" class="text-rose-500 font-medium"
              >{{ unreadCount }} belum dibaca</span
            >
            <span v-else class="text-emerald-600">Semua telah dibaca</span>
          </p>
        </div>
        <!-- Action Buttons -->
        <div class="flex items-center gap-2">
          <!-- Selection Mode Toggle -->
          <button
            @click="toggleSelectionMode"
            class="p-2 rounded-lg text-sm transition-colors"
            :class="
              selectionMode
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            "
            :title="selectionMode ? 'Batal pilih' : 'Pilih notifikasi'"
          >
            <Icon
              :icon="
                selectionMode
                  ? 'mdi:close'
                  : 'mdi:checkbox-multiple-marked-outline'
              "
              class="text-xl"
            />
          </button>
        </div>
      </div>

      <!-- Selection Actions Bar -->
      <transition name="slide-down">
        <div
          v-if="selectionMode"
          class="mb-4 p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-3"
        >
          <div class="flex items-center gap-3">
            <!-- Select All Checkbox -->
            <button
              @click="toggleSelectAll"
              class="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 transition-colors"
            >
              <div
                class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200"
                :class="
                  allVisibleSelected
                    ? 'bg-primary border-primary text-white'
                    : 'border-slate-300 hover:border-primary'
                "
              >
                <Icon
                  v-if="allVisibleSelected"
                  icon="mdi:check"
                  class="text-sm"
                />
              </div>
              <span class="font-medium">Pilih Semua Belum Dibaca</span>
            </button>
            <span
              v-if="selectedCount > 0"
              class="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full"
            >
              {{ selectedCount }} dipilih
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="markSelectedRead"
              :disabled="selectedCount === 0 || markingSelected"
              class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg shadow-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            >
              <Icon
                v-if="markingSelected"
                icon="svg-spinners:ring-resize"
                class="text-base"
              />
              <Icon v-else icon="mdi:check-all" class="text-base" />
              <span class="hidden sm:inline">Tandai Dibaca</span>
            </button>
          </div>
        </div>
      </transition>

      <!-- Quick Actions Bar (non-selection mode) -->
      <div v-if="!selectionMode" class="flex items-center justify-between mb-2">
        <!-- Filters -->
        <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            v-for="f in ['all', 'unread', 'chat', 'permission', 'system']"
            :key="f"
            @click="filter = f"
            class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
            :class="
              filter === f
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            "
          >
            {{ getFilterLabel(f) }}
            <span
              v-if="f === 'unread' && unreadCount > 0"
              class="ml-1 px-1.5 py-0.5 text-xs rounded-full"
              :class="
                filter === f
                  ? 'bg-white/20'
                  : 'bg-rose-100 text-rose-600'
              "
            >
              {{ unreadCount }}
            </span>
            <span
              v-if="f === 'chat' && chatCount > 0"
              class="ml-1 px-1.5 py-0.5 text-xs rounded-full"
              :class="
                filter === f
                  ? 'bg-white/20'
                  : 'bg-amber-100 text-amber-600'
              "
            >
              {{ chatCount }}
            </span>
          </button>
        </div>

        <!-- Mark All Read Button -->
        <button
          v-if="unreadCount > 0"
          @click="markAllRead"
          class="text-sm text-primary font-medium hover:text-amber-700 whitespace-nowrap ml-2 flex items-center gap-1"
        >
          <Icon icon="mdi:check-all" class="text-lg" />
          <span class="hidden sm:inline">Tandai semua dibaca</span>
        </button>
      </div>

      <!-- List - Loading Skeleton -->
      <div v-if="loading" class="space-y-3 mt-4">
        <div
          v-for="i in 6"
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

      <!-- List - Content -->
      <div
        v-else-if="filteredNotifications.length > 0"
        class="space-y-2 mt-4"
      >
        <div
          v-for="item in filteredNotifications"
          :key="item.id"
          @click="handleClick(item)"
          class="bg-white p-4 rounded-xl border border-slate-100 hover:shadow-sm transition-all duration-200 cursor-pointer relative group"
          :class="{
            'bg-blue-50/50 border-blue-100': !item.isRead && item.itemType === 'system',
            'bg-amber-50/50 border-amber-100': item.itemType === 'chat',
            'ring-2 ring-primary/30 border-primary/40':
              selectionMode && selectedIds.has(item.id),
          }"
        >
          <!-- Unread Dot -->
          <div
            v-if="!item.isRead && !selectionMode"
            class="absolute top-4 right-4 w-2.5 h-2.5 rounded-full animate-pulse"
            :class="item.itemType === 'chat' ? 'bg-amber-500' : 'bg-rose-500'"
          ></div>

          <div class="flex gap-3 sm:gap-4">
            <!-- Selection Checkbox (system only) -->
            <div
              v-if="selectionMode && item.itemType === 'system'"
              class="flex items-center pr-1"
            >
              <div
                class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 shrink-0"
                :class="
                  selectedIds.has(item.id)
                    ? 'bg-primary border-primary text-white scale-110'
                    : item.isRead
                    ? 'border-slate-200 bg-slate-50'
                    : 'border-slate-300 hover:border-primary group-hover:border-primary/50'
                "
              >
                <Icon
                  v-if="selectedIds.has(item.id)"
                  icon="mdi:check"
                  class="text-sm"
                />
                <Icon
                  v-else-if="item.isRead"
                  icon="mdi:check"
                  class="text-xs text-slate-300"
                />
              </div>
            </div>

            <!-- Icon / Avatar -->
            <div
              v-if="item.itemType === 'chat'"
              class="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 text-sm font-semibold"
            >
              {{ item.senderInitial }}
            </div>
            <div
              v-else
              class="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 text-xl"
              :class="getColor(item)"
            >
              <Icon :icon="getIcon(item)" />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <h3
                  class="font-semibold text-sm md:text-base pr-4 truncate"
                  :class="item.isRead ? 'text-slate-500' : 'text-slate-800'"
                >
                  {{ item.title }}
                </h3>
                <span
                  class="text-xs text-slate-400 whitespace-nowrap shrink-0"
                  >{{ formatTime(item.createdAt) }}</span
                >
              </div>
              <p
                class="text-sm line-clamp-2"
                :class="item.isRead ? 'text-slate-400' : 'text-slate-600'"
              >
                {{ item.message }}
              </p>
              <!-- Chat badge -->
              <span
                v-if="item.itemType === 'chat' && item.unreadCount > 1"
                class="inline-flex items-center gap-1 mt-1.5 text-xs text-amber-600"
              >
                <Icon icon="solar:chat-line-bold-duotone" class="text-sm" />
                {{ item.unreadCount }} pesan belum dibaca
              </span>
              <!-- Read badge -->
              <span
                v-if="item.isRead && !selectionMode && item.itemType === 'system'"
                class="inline-flex items-center gap-1 mt-1.5 text-xs text-emerald-600"
              >
                <Icon icon="mdi:check-circle" class="text-sm" />
                Dibaca
              </span>
            </div>
          </div>
        </div>

        <!-- Load More -->
        <div
          v-if="hasMore && (filter === 'all' || filter === 'system' || filter === 'permission')"
          class="pt-4 pb-2 flex justify-center"
        >
          <button
            @click="loadMore"
            :disabled="loadingMore"
            class="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <Icon
              v-if="loadingMore"
              icon="svg-spinners:ring-resize"
              class="text-lg"
            />
            <Icon v-else icon="mdi:chevron-down" class="text-lg" />
            {{ loadingMore ? "Memuat..." : "Muat Lebih Banyak" }}
          </button>
        </div>

        <!-- Pagination Info -->
        <p
          v-if="totalDisplayCount > 0 && filter === 'all'"
          class="text-center text-xs text-slate-400 pt-1 pb-4"
        >
          Menampilkan {{ filteredNotifications.length }} dari
          {{ totalDisplayCount }} notifikasi
        </p>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-20">
        <div
          class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400"
        >
          <Icon icon="solar:bell-off-line-duotone" class="text-4xl" />
        </div>
        <h3 class="text-lg font-medium text-slate-800">
          Tidak ada notifikasi
        </h3>
        <p class="text-slate-500 text-sm">
          {{
            filter === "unread"
              ? "Semua notifikasi sudah dibaca. 🎉"
              : filter === "chat"
              ? "Tidak ada pesan chat yang belum dibaca."
              : "Anda belum memiliki notifikasi pada kategori ini."
          }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}
</style>
