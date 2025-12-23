<!-- src/views/DynamicNotFound.vue -->
<template>
  <div>
    <!-- Jika user sudah login: tampilkan Layout yang membungkus NotFoundLayout -->
    <Layout v-if="isLoggedIn">
      <template #default>
        <NotFoundLayout />
      </template>
    </Layout>

    <!-- Jika belum login: tampilkan NotFoundPublic full page -->
    <NotFoundPublic v-else />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useLocalStorage } from "@vueuse/core";

import Layout from "@/components/Layout.vue"; // <- perhatikan path
import NotFoundLayout from "@/components/layout/NotFound.vue"; // isi area konten
import NotFoundPublic from "@/views/NotFoundPublic.vue"; // public 404

const token = useLocalStorage("token", null);
const isLoggedIn = computed(() => {
  const t = token.value;
  return (
    t !== null &&
    t !== undefined &&
    t !== "" &&
    String(t).toLowerCase() !== "null"
  );
});
</script>
