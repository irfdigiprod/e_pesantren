<!-- src/components/layout/NotFound.vue -->
<template>
  <div class="p-6">
    <div class="max-w-3xl mx-auto text-center">
      <h1 class="text-5xl font-bold mb-3">404</h1>

      <p class="text-base text-slate-600 mb-6">
        Halaman yang Anda cari tidak ditemukan.
      </p>

      <div class="flex items-center justify-center gap-3 mb-4">
        <router-link to="/apps/ai" class="px-4 py-2 border rounded">
          Dashboard
        </router-link>
        <router-link to="/" class="px-4 py-2 bg-amber-500 text-white rounded">
          Beranda
        </router-link>
      </div>

      <p class="text-xs text-slate-400">
        URL: <code>{{ $route.fullPath }}</code>
      </p>
    </div>
  </div>
</template>
