<template>
  <div class="overflow-x-auto relative">
    <table
      class="min-w-[1400px] w-full text-sm border-separate border-spacing-0"
    >
      <!-- HEADER -->
      <thead class="bg-gray-50 text-gray-500 sticky top-0 z-40">
        <tr>
          <slot name="head" />
        </tr>
      </thead>

      <!-- BODY -->
      <tbody>
        <slot name="body" />
      </tbody>
    </table>
  </div>
</template>

<script setup>
// base component, no logic needed
</script>

<style scoped>
/* shadow visual helper */
.sticky-left-shadow {
  box-shadow: 4px 0 6px -4px rgba(0, 0, 0, 0.12);
}
.sticky-right-shadow {
  box-shadow: -4px 0 6px -4px rgba(0, 0, 0, 0.12);
}
</style>
