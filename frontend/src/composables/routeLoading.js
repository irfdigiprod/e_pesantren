// src/composables/routeLoading.js
import { ref } from "vue";

export const isRouteLoading = ref(false);

// helper default delay (ms)
export function startRouteLoading() {
  isRouteLoading.value = true;
}

export function stopRouteLoading(delay = 0) {
  if (delay <= 0) {
    isRouteLoading.value = false;
  } else {
    setTimeout(() => (isRouteLoading.value = false), delay);
  }
}
