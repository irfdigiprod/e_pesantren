<template>
  <div class="w-full animate-pulse">
    <!-- Table View Skeleton -->
    <div v-if="viewMode === 'table'" class="w-full">
      <!-- Header -->
      <div class="h-10 bg-slate-100 rounded-lg mb-4 w-full"></div>

      <!-- Rows -->
      <div class="space-y-4">
        <div
          v-for="i in rows"
          :key="i"
          class="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0"
        >
          <!-- Checkbox / No -->
          <div class="w-10 h-6 bg-slate-100 rounded-md"></div>

          <!-- Random Width Cells -->
          <div
            v-for="j in columnCount - 1"
            :key="j"
            class="h-6 bg-slate-100 rounded-md"
            :class="randomWidthClass(j)"
          ></div>
        </div>
      </div>
    </div>

    <!-- Card View Skeleton -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="i in rows"
        :key="i"
        class="bg-white p-4 rounded-xl border border-slate-100"
      >
        <!-- Header: Avatar + Text -->
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0"></div>
          <div class="space-y-2 flex-1">
            <div class="h-4 bg-slate-100 rounded w-3/4"></div>
            <div class="h-3 bg-slate-100 rounded w-1/2"></div>
          </div>
        </div>

        <!-- Content Grid -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="h-8 bg-slate-50 rounded"></div>
          <div class="h-8 bg-slate-50 rounded"></div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-50">
          <div class="w-20 h-8 bg-slate-100 rounded-lg"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  viewMode: {
    type: String, // 'table' | 'card'
    default: "table",
  },
  rows: {
    type: Number,
    default: 5,
  },
  columnCount: {
    type: Number,
    default: 5,
  },
});

function randomWidthClass(index) {
  // Simple deterministic pseudo-random logic based on index
  const widthClasses = ["w-full", "w-3/4", "w-1/2", "w-2/3", "w-5/6"];
  return widthClasses[index % widthClasses.length] + " flex-1";
}
</script>
