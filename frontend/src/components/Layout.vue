<!-- src/components/Layout.vue -->
<template>
  <div class="min-h-screen bg-slate-100 flex">
    <Sidebar
      :is-open="isSidebarOpen"
      @close="isSidebarOpen = false"
      class="z-[999]"
    />

    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 bg-black/40 lg:hidden z-[900]"
      @click="isSidebarOpen = false"
    ></div>

    <div class="flex-1 flex flex-col min-h-screen overflow-hidden">
      <!-- PENTING: beri TopBar fixed height agar kalkulasi main konsisten -->
      <TopBar @toggle-sidebar="toggleSidebar" class="h-16 flex-shrink-0" />

      <!-- main: batasi tinggi dan buat scroll sendiri -->
      <main
        class="flex-1 overflow-y-auto overflow-x-auto p-4 lg:p-6"
        :style="{ maxHeight: 'calc(100vh - 4rem)' }"
      >
        <LoadingSkeleton v-if="isRouteLoadingVal" />

        <div v-else>
          <slot>
            <router-view />
          </slot>
        </div>
        <Footer />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import Sidebar from "@/components/layout/Sidebar.vue";
import TopBar from "@/components/layout/TopBar.vue";
import LoadingSkeleton from "@/components/layout/LoadingSkeleton.vue";
import { isRouteLoading } from "@/composables/routeLoading";
import Footer from "@/components/layout/Footer.vue";

const isSidebarOpen = ref(false);
function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
}

const isRouteLoadingVal = isRouteLoading;
</script>
