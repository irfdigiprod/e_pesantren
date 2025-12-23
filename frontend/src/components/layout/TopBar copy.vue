<!-- src/components/layout/TopBar.vue -->
<script setup>
import { Icon } from "@iconify/vue";

const emit = defineEmits(["toggle-sidebar"]);
</script>

<template>
  <header
    class="sticky top-0 z-20 bg-white border-b border-slate-200 h-16 flex items-center px-4 lg:px-6"
  >
    <!-- Tombol sidebar untuk HP -->
    <button
      class="lg:hidden mr-3 p-2 rounded-2xl hover:bg-amber-300 hover:text-primary"
      @click="emit('toggle-sidebar')"
    >
      <Icon icon="solar:hamburger-menu-line-duotone" class="text-2xl" />
    </button>

    <div class="flex-1 flex items-center justify-between">
      <h1 class="font-semibold philosopher-bold text-primary text-base lg:text-lg">
        Minhajul Haq
      </h1>

      <!-- Area kanan: misal user / action -->
      <div class="flex items-center gap-3">
        <button class="p-2 rounded-2xl border hover:bg-amber-300 hover:text-primary border-slate-200 hover:border-amber-300">
          <Icon icon="solar:bell-bing-line-duotone" class="text-xl" />
        </button>
        <div class="flex items-center gap-2">
          <div
            class="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs"
          >
            U
          </div>
          <span class="hidden sm:inline text-sm text-slate-700">User</span>
        </div>
      </div>
    </div>
  </header>
</template>
