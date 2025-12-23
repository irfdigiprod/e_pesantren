// src/main.js
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";

const app = createApp(App);
app.use(router);

// import composable state
import {
  isRouteLoading,
  startRouteLoading,
  stopRouteLoading,
} from "@/composables/routeLoading";

// global router hooks
router.beforeEach((to, from, next) => {
  // aktifkan skeleton sebelum navigasi
  startRouteLoading();
  next();
});

router.afterEach(() => {
  // hentikan loading setelah navigasi; beri sedikit delay biar transisi halus
  stopRouteLoading(600); // contoh 600ms, sesuaikan
});

// tunggu router ready lalu mount
router.isReady().then(() => {
  app.mount("#app");
});
