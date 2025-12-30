<script setup>
import { useRouter, useRoute } from "vue-router";
import { Icon } from "@iconify/vue";
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import wsClient from "@/services/websocket.js";
import {
  chatApi,
  notificationsApi,
  usersApi,
  authApi,
} from "@/services/api.js";
import UserDropdownMenu from "./layout/UserDropdownMenu.vue";

const router = useRouter();
const route = useRoute();

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  showBack: {
    type: Boolean,
    default: true,
  },
});

const goBack = () => {
  router.push("/mobile-dashboard");
};

const displayTitle = computed(() => {
  if (props.title) return props.title;
  return route.meta?.title || route.name || "Dashboard";
});

/* ======================================================
   NOTIFICATION LOGIC (Copied from TopBar.vue)
   ====================================================== */
const unreadCount = ref(0);
const unreadMessages = ref([]);
const systemNotifications = ref([]);
const showNotificationPopup = ref(false);

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

const notificationSound = new Audio("/sounds/notification.mp3");
function playNotificationSound() {
  try {
    notificationSound.currentTime = 0;
    notificationSound.play().catch(() => {});
  } catch (e) {}
}

async function loadUnreadMessages() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await chatApi.getConversations();
    if (res.data) {
      const unreadList = [];
      let totalUnread = 0;

      for (const conv of res.data) {
        if (conv.unreadCount > 0) {
          totalUnread += conv.unreadCount;
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

      const notifRes = await notificationsApi.getAll();
      if (notifRes.success) {
        systemNotifications.value = notifRes.data || [];
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

async function respondToInvitation(id, action) {
  try {
    await notificationsApi.respond(id, action);
    const prevLength = systemNotifications.value.length;
    systemNotifications.value = systemNotifications.value.filter(
      (n) => n.id !== id
    );
    if (systemNotifications.value.length < prevLength) {
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  } catch (e) {
    console.error("Failed to respond", e);
  }
}

let unsubscribeFunctions = [];
function setupNotificationListeners() {
  unsubscribeFunctions.forEach((unsub) => unsub());
  unsubscribeFunctions = [];

  const unsubNewMessage = wsClient.on("new_message", (data) => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (String(data.senderId) === String(currentUser.id)) return;

    unreadCount.value += 1;
    playNotificationSound();

    const senderName = data.senderEmail?.split("@")[0] || "Pengguna";
    const existingIndex = unreadMessages.value.findIndex(
      (m) => m.conversationId === data.conversationId
    );

    if (existingIndex >= 0) {
      unreadMessages.value[existingIndex].preview =
        data.content?.substring(0, 40) || "Pesan baru";
      unreadMessages.value[existingIndex].unreadCount += 1;
      unreadMessages.value[existingIndex].time = data.createdAt;
    } else {
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

  const unsubSystemNotif = wsClient.on("new_notification", (data) => {
    if (data && data.id) {
      systemNotifications.value.unshift(data);
      unreadCount.value += 1;
    }
    playNotificationSound();
  });
  unsubscribeFunctions.push(unsubSystemNotif);

  const unsubConnected = wsClient.on("connected", () => {
    loadUnreadMessages();
  });
  unsubscribeFunctions.push(unsubConnected);
}

function onChatMessagesRead() {
  loadUnreadMessages();
}

function toggleNotificationPopup() {
  showNotificationPopup.value = !showNotificationPopup.value;
  if (showNotificationPopup.value) showMenu.value = false;
}

function closeNotificationPopup() {
  showNotificationPopup.value = false;
}

function goToNotifications() {
  closeNotificationPopup();
  router.push("/mobile-dashboard/notifications"); // Updated route for mobile
}

function goToConversation(conversationId) {
  const msgIndex = unreadMessages.value.findIndex(
    (m) => m.conversationId === conversationId
  );
  if (msgIndex >= 0) {
    const removedMsg = unreadMessages.value[msgIndex];
    unreadCount.value = Math.max(0, unreadCount.value - removedMsg.unreadCount);
    unreadMessages.value.splice(msgIndex, 1);
  }
  closeNotificationPopup();
  router.push("/mobile-dashboard/chat"); // Just go to chat list, auto-reselect handled by user? Or use query param?
  // Mobile Chat handles activeConversation via state in Chat.vue.
  // Ideally we pass a query param ?conv=ID and Chat.vue handles it.
  // For now just /mobile-dashboard/chat
}

function goToNotificationDetail(notification) {
  if (!notification.isRead && notification.id) {
    notificationsApi.markAsRead(notification.id);
    const n = systemNotifications.value.find((x) => x.id === notification.id);
    if (n) {
      n.isRead = true;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  }

  const type = notification.notifType || notification.type;
  if (type === "permission_request" || type === "permission_approved") {
    router.push("/mobile-dashboard/permissions");
  } else if (type === "group_invite") {
    router.push("/mobile-dashboard/chat");
  } else {
    router.push("/mobile-dashboard/notifications");
  }
  closeNotificationPopup();
}

function formatNotificationTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return "Baru saja";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} mnt`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

/* ======================================================
   USER PROFILE LOGIC
   ====================================================== */
const user = ref(null);

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

const initials = computed(() => {
  if (!user.value) return "?";
  const n = user.value.name || user.value.email || "";
  if (n) return n.charAt(0).toUpperCase();
  return "?";
});

const photoUrl = computed(() => {
  const photo = user.value?.photo || user.value?.raw?.photo;
  if (!photo) return null;
  const base = import.meta.env.VITE_API_BASE_URL || "";
  if (photo.startsWith("uploads/")) return `${base}/api/${photo}`;
  return photo;
});

const username = computed(
  () => user.value?.name || user.value?.email?.split("@")[0] || "Pengguna"
);

const showMenu = ref(false);
function toggleMenu() {
  showMenu.value = !showMenu.value;
  if (showMenu.value) showNotificationPopup.value = false;
}
function closeMenu() {
  showMenu.value = false;
}

async function logout() {
  closeMenu();
  try {
    await authApi.logout();
  } catch (err) {}
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  wsClient.disconnect();
  router.push("/login");
}

function goProfile() {
  closeMenu();
  router.push("/mobile-dashboard/profile"); // Assuming a mobile profile route exists or reuse
}

onMounted(() => {
  const raw = localStorage.getItem("user");
  if (raw) user.value = JSON.parse(raw);
  fetchCurrent();

  // Listen for user updates (e.g. from profile edit)
  window.addEventListener("user-updated", (e) => {
    if (e.detail) user.value = e.detail;
  });

  window.addEventListener("chat-messages-read", onChatMessagesRead);

  const token = localStorage.getItem("token");
  if (token) {
    wsClient.connect(token);
    setupNotificationListeners();
    loadUnreadMessages();
  }
});

onUnmounted(() => {
  window.removeEventListener("chat-messages-read", onChatMessagesRead);
  unsubscribeFunctions.forEach((unsub) => unsub());
});
</script>

<template>
  <div
    class="h-14 bg-white border-b border-gray-100 flex items-center px-4 sticky top-0 z-[120] justify-between"
  >
    <!-- Left: Back & Title -->
    <div class="flex items-center flex-1 min-w-0 mr-2">
      <button v-if="showBack" @click="goBack" class="mr-3 text-[#602515]">
        <Icon icon="solar:arrow-left-line-duotone" class="text-2xl" />
      </button>
      <h1 class="text-lg font-bold text-[#602515] truncate">
        {{ displayTitle }}
      </h1>
    </div>

    <!-- Right: Notifications & Profile -->
    <div class="flex items-center gap-3">
      <!-- Notifications -->
      <div class="relative">
        <button
          @click="toggleNotificationPopup"
          class="relative p-1.5 rounded-xl hover:bg-amber-50 text-[#602515]"
        >
          <Icon icon="solar:bell-bing-line-duotone" class="text-xl" />
          <span
            v-if="unreadCount > 0"
            class="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1"
          >
            {{ unreadCount > 99 ? "99+" : unreadCount }}
          </span>
        </button>

        <!-- Notification Dropdown -->
        <transition name="fade-slide">
          <div
            v-if="showNotificationPopup"
            class="fixed inset-x-4 top-[60px] bg-white border border-slate-200 rounded-xl shadow-xl z-[110] overflow-hidden max-h-[70vh] flex flex-col"
          >
            <div
              class="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center"
            >
              <h3 class="font-semibold text-slate-800 text-sm">Notifikasi</h3>
              <span
                v-if="unreadCount > 0"
                class="text-xs text-rose-500 font-medium"
                >{{ unreadCount }} baru</span
              >
            </div>
            <div class="overflow-y-auto flex-1">
              <!-- List (simplified for mobile) -->
              <div v-if="allNotifications.length > 0">
                <div
                  v-for="item in allNotifications.slice(0, 10)"
                  :key="item.id || item.conversationId"
                  class="px-4 py-3 border-b border-slate-50 active:bg-slate-50"
                  :class="{
                    'bg-blue-50/50': item.itemType === 'system' && !item.isRead,
                  }"
                  @click="
                    item.itemType === 'chat'
                      ? goToConversation(item.conversationId)
                      : goToNotificationDetail(item)
                  "
                >
                  <div class="flex gap-3">
                    <div class="shrink-0 pt-1">
                      <div
                        v-if="item.itemType === 'chat'"
                        class="w-8 h-8 rounded-full bg-[#f8ae19] text-[#602515] flex items-center justify-center text-xs font-bold"
                      >
                        {{ item.senderInitial }}
                      </div>
                      <div
                        v-else
                        class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm"
                      >
                        <Icon
                          :icon="
                            item.notifType === 'group_invite'
                              ? 'mdi:account-group'
                              : 'mdi:bell'
                          "
                        />
                      </div>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex justify-between items-baseline mb-0.5">
                        <p
                          class="text-sm font-semibold text-slate-800 truncate pr-2"
                        >
                          {{
                            item.itemType === "chat"
                              ? item.senderName
                              : item.title
                          }}
                        </p>
                        <span class="text-[10px] text-slate-400 shrink-0">{{
                          formatNotificationTime(item.time || item.createdAt)
                        }}</span>
                      </div>
                      <p class="text-xs text-slate-500 line-clamp-2">
                        {{
                          item.itemType === "chat" ? item.preview : item.message
                        }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="py-8 text-center text-slate-400">
                <Icon
                  icon="solar:bell-off-line-duotone"
                  class="text-3xl mb-2 mx-auto"
                />
                <p class="text-xs">Tidak ada notifikasi</p>
              </div>
            </div>
          </div>
        </transition>

        <div
          v-if="showNotificationPopup"
          class="fixed inset-0 z-40"
          @click="closeNotificationPopup"
        ></div>
      </div>

      <!-- Profile -->
      <div class="relative">
        <button @click="toggleMenu" class="flex items-center gap-1.5">
          <div
            class="w-8 h-8 rounded-full bg-[#f8ae19] text-[#602515] flex items-center justify-center overflow-hidden border border-[#f8ae19]/20"
          >
            <img
              v-if="photoUrl"
              :src="photoUrl"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-xs font-bold">{{ initials }}</span>
          </div>
          <Icon
            icon="solar:alt-arrow-down-line-duotone"
            class="text-slate-400 text-sm transition-transform duration-200"
            :class="{ 'rotate-180': showMenu }"
          />
        </button>

        <UserDropdownMenu
          :show="showMenu"
          :user="user"
          position-class="fixed right-4 top-[60px]"
          @close="closeMenu"
          @profile="goProfile"
          @logout="logout"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
