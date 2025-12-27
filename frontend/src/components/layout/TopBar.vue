<!-- src/components/layout/TopBar.vue -->
<script setup>
import { Icon } from "@iconify/vue";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import wsClient from "@/services/websocket.js";
import {
  chatApi,
  notificationsApi,
  usersApi,
  settingsApi,
  authApi,
} from "@/services/api.js";

const emit = defineEmits(["toggle-sidebar"]);
const router = useRouter();

// Institution name from settings
const institutionName = ref("Minhajul Haq"); // default fallback

async function loadInstitutionName() {
  try {
    const res = await settingsApi.getAll(["institution_name"]);
    if (res.success && res.data?.institution_name) {
      institutionName.value = res.data.institution_name;
    }
  } catch (e) {
    console.warn("Could not load institution name:", e);
  }
}

/* ======================================================
   NOTIFICATION (Real-time unread messages with sound)
   ====================================================== */
const unreadCount = ref(0);
const unreadMessages = ref([]);
const systemNotifications = ref([]); // New: System notifications (invites, etc)
const showNotificationPopup = ref(false);

// Combined notifications sorted by time
const allNotifications = computed(() => {
  const combined = [
    ...unreadMessages.value.map((m) => ({ ...m, itemType: "chat" })),
    ...systemNotifications.value
      .filter((n) => n != null && !n.isRead)
      .map((n) => ({
        ...n,
        itemType: "system",
        notifType: n.type || "unknown",
      })),
  ];
  return combined.sort(
    (a, b) => new Date(b.time || b.createdAt) - new Date(a.time || a.createdAt)
  );
});

// Notification sound
const notificationSound = new Audio("/sounds/notification.mp3");

function playNotificationSound() {
  try {
    notificationSound.currentTime = 0;
    const promise = notificationSound.play();
    if (promise !== undefined) {
      promise.catch((error) => {
        // Auto-play was prevented
        console.warn(
          "Notification sound blocked due to autoplay policy:",
          error
        );
      });
    }
  } catch (e) {
    console.warn("Could not play notification sound:", e);
  }
}

async function loadUnreadMessages() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Load conversations and get unread info
    const res = await chatApi.getConversations();
    if (res.data) {
      const unreadList = [];
      let totalUnread = 0;

      for (const conv of res.data) {
        if (conv.unreadCount > 0) {
          totalUnread += conv.unreadCount;
          // Get participant name for display
          const currentUserId = JSON.parse(
            localStorage.getItem("user") || "{}"
          )?.id;
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
              conv.lastMessage?.content?.substring(0, 40) || "Pesan baru",
            unreadCount: conv.unreadCount,
            time: conv.lastMessageAt,
          });
        }
      }

      // Load System Notifications
      const notifRes = await notificationsApi.getAll();
      if (notifRes.success) {
        systemNotifications.value = notifRes.data || [];
        // Add unread system notifications to count
        const unreadSystem = systemNotifications.value.filter(
          (n) => !n.isRead
        ).length;
        totalUnread += unreadSystem;
      }

      unreadCount.value = totalUnread;
      unreadMessages.value = unreadList;
    }
  } catch (e) {
    console.error("Failed to load notifications:", e);
  }
}

// Actions for system notifications
async function markAsRead(id) {
  try {
    await notificationsApi.markAsRead(id);

    // Remove from list and decrement count
    const prevLength = systemNotifications.value.length;
    systemNotifications.value = systemNotifications.value.filter(
      (n) => n.id !== id
    );
    if (systemNotifications.value.length < prevLength) {
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  } catch (e) {
    console.error("Failed to mark as read", e);
  }
}

async function respondToInvitation(id, action) {
  try {
    await notificationsApi.respond(id, action);

    // Remove from list and decrement count
    const prevLength = systemNotifications.value.length;
    systemNotifications.value = systemNotifications.value.filter(
      (n) => n.id !== id
    );
    if (systemNotifications.value.length < prevLength) {
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  } catch (e) {
    console.error("Failed to respond to invitation", e);
    alert("Gagal memproses undangan");
  }
}

// Store unsubscribe functions
let unsubscribeFunctions = [];

function setupNotificationListeners() {
  // Clean up previous listeners first
  unsubscribeFunctions.forEach((unsub) => unsub());
  unsubscribeFunctions = [];

  // Listen for new messages
  const unsubNewMessage = wsClient.on("new_message", (data) => {
    // Get current user ID to check if this is our own message
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    // Don't notify for our own messages
    if (String(data.senderId) === String(currentUser.id)) {
      return;
    }

    unreadCount.value += 1;
    playNotificationSound();

    // Add to unread list
    const senderName = data.senderEmail?.split("@")[0] || "Pengguna";

    // Check if we already have this conversation in unread list
    const existingIndex = unreadMessages.value.findIndex(
      (m) => m.conversationId === data.conversationId
    );

    if (existingIndex >= 0) {
      // Update existing entry
      unreadMessages.value[existingIndex].preview =
        data.content?.substring(0, 40) || "Pesan baru";
      unreadMessages.value[existingIndex].unreadCount += 1;
      unreadMessages.value[existingIndex].time = data.createdAt;
    } else {
      // Add new entry
      unreadMessages.value.unshift({
        conversationId: data.conversationId,
        senderName: senderName.charAt(0).toUpperCase() + senderName.slice(1),
        senderInitial: senderName.charAt(0).toUpperCase(),
        preview: data.content?.substring(0, 40) || "Pesan baru",
        unreadCount: 1,
        time: data.createdAt,
      });
    }
  });
  unsubscribeFunctions.push(unsubNewMessage);

  // Listen for new system notifications
  const unsubSystemNotif = wsClient.on("new_notification", (data) => {
    const notif = data;

    // Add notification to list
    if (notif && notif.id) {
      systemNotifications.value.unshift(notif);
      unreadCount.value += 1;
    }

    playNotificationSound();
  });
  unsubscribeFunctions.push(unsubSystemNotif);

  // Listen for WebSocket connected event
  const unsubConnected = wsClient.on("connected", () => {
    loadUnreadMessages();
  });
  unsubscribeFunctions.push(unsubConnected);
}

// Watch route changes to reload unread when leaving chat page
import { watch } from "vue";
watch(
  () => router.currentRoute.value.path,
  (newPath, oldPath) => {
    // If user was on chat page and navigated away, or navigated to chat
    if (oldPath?.includes("/apps/chat") || newPath.includes("/apps/chat")) {
      loadUnreadMessages();
    }
  }
);

// Listen for custom event when Chat.vue marks messages as read
function onChatMessagesRead() {
  loadUnreadMessages();
}

function toggleNotificationPopup() {
  showNotificationPopup.value = !showNotificationPopup.value;
}

function closeNotificationPopup() {
  showNotificationPopup.value = false;
}

function goToChat() {
  closeNotificationPopup();
  router.push("/apps/chat");
}

function goToNotifications() {
  closeNotificationPopup();
  router.push("/apps/notifications");
}

function goToConversation(conversationId) {
  // Find and remove this notification from the list immediately
  const msgIndex = unreadMessages.value.findIndex(
    (m) => m.conversationId === conversationId
  );
  if (msgIndex >= 0) {
    const removedMsg = unreadMessages.value[msgIndex];
    unreadCount.value = Math.max(0, unreadCount.value - removedMsg.unreadCount);
    unreadMessages.value.splice(msgIndex, 1);
  }

  closeNotificationPopup();
  // Add timestamp to force route change detection even when on same page
  router.push(`/apps/chat?conv=${conversationId}&t=${Date.now()}`);
}

function goToNotificationDetail(notification) {
  // Mark as read
  if (!notification.isRead) {
    if (notification.id) {
      notificationsApi.markAsRead(notification.id);
      const n = systemNotifications.value.find((x) => x.id === notification.id);
      if (n) {
        n.isRead = true;
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    }
  }

  // Navigate based on type
  // Check virtual prop 'notifType' (mapped from 'type' in DB)
  const type = notification.notifType || notification.type;

  if (type === "permission_request") {
    router.push("/apps/attendance/approvals");
  } else if (type === "permission_status") {
    router.push("/apps/attendance/permissions");
  } else if (type === "permission_approved" || type === "permission_rejected") {
    // Handle potential legacy type naming if any
    router.push("/apps/attendance/permissions");
  } else if (type === "group_invite") {
    router.push("/apps/chat");
  } else {
    // Default fallback
    router.push("/apps/notifications");
  }

  closeNotificationPopup();
}

function formatNotificationTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return "Baru saja";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

/* ======================================================
   USER DATA (ambil dari localStorage atau API current)
   ====================================================== */
const user = ref(null);

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
    const data = res?.data || res;

    if (!data) return;

    const firstName = data.firstName || data.first_name || "";
    const lastName = data.lastName || data.last_name || "";
    const fullName = data.name || `${firstName} ${lastName}`.trim();

    user.value = {
      ...data,
      name: fullName || data.email?.split("@")[0] || "Pengguna",
    };

    localStorage.setItem("user", JSON.stringify(user.value));
  } catch (_) {}
}
function onUserUpdated(e) {
  try {
    // prefer event.detail jika ada, fallback ke localStorage
    const maybe = e && e.detail ? e.detail : null;
    if (maybe) {
      user.value = maybe;
      return;
    }
    const raw = localStorage.getItem("user");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed) user.value = parsed;
  } catch (err) {
    console.warn("onUserUpdated (TopBar) failed:", err);
  }
}

onMounted(() => {
  loadStoredUser();
  // Always fetch fresh data to sync name/avatar
  fetchCurrent();
  loadInstitutionName(); // Load institution name from settings
  window.addEventListener("user-updated", onUserUpdated);
  window.addEventListener("chat-messages-read", onChatMessagesRead);

  // Setup WebSocket for notifications
  const token = localStorage.getItem("token");
  if (token) {
    wsClient.connect(token);
    setupNotificationListeners();
    loadUnreadMessages();
  }
});
onUnmounted(() => {
  window.removeEventListener("user-updated", onUserUpdated);
  window.removeEventListener("chat-messages-read", onChatMessagesRead);
  // Clean up WebSocket listeners
  unsubscribeFunctions.forEach((unsub) => unsub());
  unsubscribeFunctions = [];
});
// Seragam dengan Sidebar.vue
const initials = computed(() => {
  if (!user.value) return "?";
  const n = user.value.name || user.value.email || "";
  if (n) {
    const parts = n.split(/[@\s]/).filter(Boolean);
    if (parts.length >= 1) return parts[0].slice(0, 2).toUpperCase();
  }
  return "?";
});

// computed photo URL
const photoUrl = computed(() => {
  const photo = user.value?.photo || user.value?.raw?.photo;
  if (!photo) return null;
  const base = import.meta.env.VITE_API_BASE_URL || "";
  if (photo.startsWith("uploads/")) {
    return `${base}/api/${photo}`;
  }
  return photo;
});

const username = computed(
  () => user.value?.name || user.value?.email?.split("@")[0] || "Pengguna"
);

/* ======================================================
   DROPDOWN MENU
   ====================================================== */
const showMenu = ref(false);
function toggleMenu() {
  showMenu.value = !showMenu.value;
}
function closeMenu() {
  showMenu.value = false;
}

/* ======================================================
   LOGOUT — CALL API
   ====================================================== */
async function logout() {
  closeMenu();
  const token = localStorage.getItem("token");

  // Jika tidak ada token, logout lokal saja
  if (!token) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return router.push("/login");
  }

  try {
    await authApi.logout();
  } catch (err) {
    console.error("Logout request failed:", err);
  }

  // Lanjut ke logout lokal
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // Disconnect WebSocket
  wsClient.disconnect();

  router.push("/login");
}

/* MENU ACTIONS */
function goProfile() {
  closeMenu();
  router.push("/apps/user-profile");
}
function goSettings() {
  closeMenu();
  router.push("/settings/general");
}
</script>

<template>
  <header
    class="sticky top-0 z-[120] bg-white border-b border-slate-200 h-16 flex items-center px-4 lg:px-6"
  >
    <!-- Tombol sidebar mobile -->
    <button
      class="lg:hidden mr-3 p-2 rounded-2xl hover:bg-amber-300 hover:text-primary"
      @click="emit('toggle-sidebar')"
    >
      <Icon icon="solar:hamburger-menu-line-duotone" class="text-2xl" />
    </button>

    <div class="flex-1 flex items-center justify-between">
      <h1
        class="font-semibold philosopher-bold text-primary text-base lg:text-lg select-none"
      >
        {{ institutionName }}
      </h1>

      <!-- KANAN -->
      <div class="relative flex items-center gap-4">
        <!-- Notifikasi with Popup -->
        <div class="relative">
          <button
            @click="toggleNotificationPopup"
            class="relative p-2 rounded-2xl border hover:bg-amber-300 hover:text-primary border-slate-200 hover:border-amber-300"
            title="Notifikasi"
          >
            <Icon icon="solar:bell-bing-line-duotone" class="text-xl" />
            <!-- Notification Badge -->
            <span
              v-if="unreadCount > 0"
              class="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
            >
              {{ unreadCount > 99 ? "99+" : unreadCount }}
            </span>
          </button>

          <!-- Notification Popup Dropdown -->
          <transition name="fade-slide">
            <div
              v-if="showNotificationPopup"
              class="fixed inset-x-4 top-[70px] sm:absolute sm:inset-auto sm:right-0 sm:mt-2 w-auto sm:w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden"
            >
              <div class="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div class="flex items-center justify-between">
                  <h3 class="font-semibold text-slate-800">Notifikasi</h3>
                  <span
                    v-if="unreadCount > 0"
                    class="text-xs text-rose-500 font-medium"
                  >
                    {{ unreadCount }} belum dibaca
                  </span>
                </div>
              </div>

              <div class="max-h-80 overflow-y-auto">
                <!-- Notifications List -->
                <div v-if="allNotifications.length > 0">
                  <div
                    v-for="item in allNotifications.slice(0, 5)"
                    :key="item.id || item.conversationId"
                    class="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 relative"
                    :class="{
                      'bg-blue-50': item.itemType === 'system' && !item.isRead,
                    }"
                  >
                    <!-- Chat Notification -->
                    <template v-if="item.itemType === 'chat'">
                      <div
                        @click="goToConversation(item.conversationId)"
                        class="cursor-pointer flex flex-1 gap-3"
                      >
                        <div
                          class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold flex-shrink-0"
                        >
                          {{ item.senderInitial }}
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between gap-2">
                            <span class="font-medium text-slate-800 truncate">{{
                              item.senderName
                            }}</span>
                            <span
                              class="text-xs text-slate-400 flex-shrink-0"
                              >{{ formatNotificationTime(item.time) }}</span
                            >
                          </div>
                          <p class="text-sm text-slate-500 truncate">
                            {{ item.preview }}
                          </p>
                          <span
                            v-if="item.unreadCount > 1"
                            class="text-xs text-rose-500"
                          >
                            +{{ item.unreadCount - 1 }} pesan lainnya
                          </span>
                        </div>
                      </div>
                    </template>

                    <!-- System Notification -->
                    <template v-else-if="item.itemType === 'system'">
                      <div
                        class="flex-1 cursor-pointer hover:bg-slate-100/50 rounded-lg p-1 transition-colors"
                        @click="goToNotificationDetail(item)"
                      >
                        <div class="flex gap-3">
                          <div
                            class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl flex-shrink-0"
                          >
                            <Icon
                              v-if="item.notifType === 'group_invite'"
                              icon="mdi:account-group-outline"
                            />
                            <Icon v-else icon="mdi:bell-outline" />
                          </div>
                          <div class="flex-1 min-w-0">
                            <div
                              class="flex items-center justify-between gap-2"
                            >
                              <span
                                class="font-medium text-slate-800 text-sm"
                                >{{ item.title }}</span
                              >
                              <span
                                class="text-xs text-slate-400 flex-shrink-0"
                                >{{
                                  formatNotificationTime(item.createdAt)
                                }}</span
                              >
                            </div>
                            <p class="text-sm text-slate-500 break-words mb-1">
                              {{ item.message }}
                            </p>

                            <!-- Actions for Invite -->
                            <div
                              v-if="item.notifType === 'group_invite'"
                              class="flex gap-2 mt-2"
                            >
                              <button
                                class="px-3 py-1 bg-primary text-white text-xs rounded-md shadow-sm hover:opacity-90"
                                @click.stop="
                                  respondToInvitation(item.id, 'accept')
                                "
                              >
                                Terima
                              </button>
                              <button
                                class="px-3 py-1 bg-white border border-slate-300 text-slate-700 text-xs rounded-md shadow-sm hover:bg-slate-50"
                                @click.stop="
                                  respondToInvitation(item.id, 'reject')
                                "
                              >
                                Tolak
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>

                <!-- Empty State -->
                <div
                  v-else
                  class="py-8 flex flex-col items-center justify-center text-center text-slate-400"
                >
                  <Icon
                    icon="solar:bell-off-line-duotone"
                    class="text-4xl mb-2"
                  />
                  <p class="text-sm">Tidak ada notifikasi baru</p>
                </div>
              </div>

              <!-- Footer -->
              <div class="px-4 py-3 border-t border-slate-100 bg-slate-50">
                <button
                  @click="goToNotifications"
                  class="w-full text-center text-sm text-primary hover:text-amber-700 font-medium"
                >
                  Lihat Semua Notifikasi
                </button>
              </div>
            </div>
          </transition>

          <!-- Click outside overlay -->
          <div
            v-if="showNotificationPopup"
            class="fixed inset-0 z-40"
            @click="closeNotificationPopup"
          ></div>
        </div>

        <!-- Avatar + Dropdown -->
        <div class="relative">
          <button
            @click="toggleMenu"
            class="flex items-center gap-2 cursor-pointer"
          >
            <div
              class="h-8 w-8 rounded-full bg-primary hover:bg-secondary text-white hover:text-primary flex items-center justify-center text-xs overflow-hidden"
            >
              <img
                v-if="photoUrl"
                :src="photoUrl"
                alt="Photo"
                class="w-full h-full object-cover"
              />
              <span v-else>{{ initials }}</span>
            </div>
            <span class="hidden sm:inline text-sm text-slate-700">{{
              username
            }}</span>

            <Icon
              icon="solar:alt-arrow-down-line-duotone"
              :class="[
                'text-xl text-slate-500 transition-transform duration-200 ease-in-out',
                showMenu ? 'rotate-180' : 'rotate-0',
              ]"
            />
          </button>

          <!-- Dropdown -->
          <transition name="fade-slide">
            <div
              v-if="showMenu"
              class="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50"
            >
              <button
                @click="goProfile"
                class="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 flex items-center gap-2 text-slate-700"
              >
                <Icon
                  icon="solar:user-circle-line-duotone"
                  class="text-lg text-slate-500"
                />
                Profile
              </button>
              <button
                @click="goSettings"
                class="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 flex items-center gap-2 text-slate-700"
              >
                <Icon
                  icon="solar:settings-line-duotone"
                  class="text-lg text-slate-500"
                />
                Settings
              </button>
              <div class="h-px bg-slate-100 my-1"></div>
              <button
                @click="logout"
                class="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <Icon icon="solar:logout-2-line-duotone" class="text-lg" />
                Logout
              </button>
            </div>
          </transition>

          <!-- klik di luar tutup menu -->
          <div
            v-if="showMenu"
            class="fixed inset-0 z-40"
            @click="closeMenu"
          ></div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: 0.15s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
