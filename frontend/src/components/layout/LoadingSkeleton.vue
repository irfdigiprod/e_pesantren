<!-- src/components/layout/LoadingSkeleton.vue -->
<template>
  <div class="max-w-4xl mx-auto">
    <div
      class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse skeleton-shimmer"
    >
      <!-- Judul -->
      <div class="h-6 w-48 bg-slate-200 rounded-md mb-6"></div>

      <!-- Deskripsi -->
      <div class="h-4 w-40 bg-slate-200 rounded-md mb-3"></div>

      <!-- Body content skeleton -->
      <div class="space-y-4">
        <div class="h-4 w-5/6 bg-slate-200 rounded-md"></div>
        <div class="h-4 w-5/6 bg-slate-200 rounded-md"></div>
        <div class="h-4 w-4/6 bg-slate-200 rounded-md"></div>
        <div class="h-4 w-3/6 bg-slate-200 rounded-md"></div>
      </div>
    </div>
  </div>
</template>
