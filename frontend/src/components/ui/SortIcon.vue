<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="w-3 h-3 inline"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <template v-if="sortBy !== field">
      <path d="M7 15l5 5 5-5" />
      <path d="M7 9l5-5 5 5" />
    </template>
    <template v-else-if="order === 'asc'">
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </template>
    <template v-else>
      <path d="M12 5v14" />
      <path d="M19 12l-7 7-7-7" />
    </template>
  </svg>
</template>

<script setup>
defineProps({
  field: {
    type: String,
    required: true,
  },
  sortBy: {
    type: String,
    default: "",
  },
  order: {
    type: String,
    default: "asc",
  },
});
</script>
