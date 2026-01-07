<script setup>
import { onMounted } from "vue";
import {
  registerServiceWorker,
  requestPermission,
  checkPermission,
} from "@/services/pushService";
import { authApi } from "@/services/api";

onMounted(async () => {
  // Register Service Worker
  await registerServiceWorker();

  // If user is logged in, check permission and subscribe if granted
  const token = localStorage.getItem("token");
  if (token) {
    const permission = await checkPermission();
    if (permission === "granted") {
      // Logic to ensure subscription is active
      // requestPermission() handles subscription internally if granted
      await requestPermission();
    } else if (permission === "default") {
      // Optionally ask for permission immediately, or wait for user action
      // For now, let's ask immediately if logged in
      try {
        await requestPermission();
      } catch (e) {
        console.warn("Permission request dismissed/failed", e);
      }
    }
  }
});
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
