<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 p-6">
    <div class="max-w-xl text-center">
      <h1 class="text-6xl font-extrabold mb-4">404</h1>
      <p class="text-lg text-slate-600 mb-6">Halaman tidak ditemukan.</p>

      <div class="flex items-center justify-center gap-3">
        <router-link
          to="/login"
          class="inline-block px-5 py-2 rounded-lg bg-primary text-white hover:bg-secondary"
        >
          Masuk / Login
        </router-link>

        <router-link
          to="/"
          class="inline-block px-5 py-2 rounded-lg border border-slate-200 hover:bg-slate-100"
        >
          Beranda
        </router-link>
      </div>

      <p class="mt-6 text-xs text-slate-400">
        URL:
        <code class="bg-white px-2 py-1 rounded">{{ $route.fullPath }}</code>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: "NotFoundPublic",
};
</script>

<style scoped>
/* gaya ringkas, bergantung pada Tailwind (jika ada) */
</style>
