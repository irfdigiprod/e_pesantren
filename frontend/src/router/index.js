// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useLocalStorage } from "@vueuse/core";

// Layout utama untuk user yang sudah login
import Layout from "@/components/Layout.vue";

// Login & Register berada di folder src/
import Login from "@/Login.vue";
import Register from "@/Register.vue";

// Dynamic NotFound berada di src/views
import DynamicNotFound from "@/views/DynamicNotFound.vue";
import Students from "../views/apps/Students.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    //
    // ======================
    // ROOT → LOGIN
    // ======================
    //
    { path: "/", redirect: "/login" },

    //
    // ======================
    // AUTH PAGES (TANPA LAYOUT)
    // ======================
    //
    {
      path: "/login",
      name: "Login",
      component: Login,
    },
    {
      path: "/register",
      name: "Register",
      component: Register,
    },

    //
    // ======================
    // APP ROUTES (DENGAN LAYOUT)
    // ======================
    //
    {
      path: "/",
      component: Layout,
      children: [
        // =======================
        // APPS
        // =======================
        {
          path: "apps/ai",
          name: "AppsAI",
          component: () => import("@/views/apps/AppsAI.vue"),
        },
        {
          path: "apps/contacts",
          name: "AppsContacts",
          component: () => import("@/views/apps/AppsContacts.vue"),
        },
        {
          path: "apps/ecommerce/products",
          name: "AppsEcommerceProducts",
          component: () => import("@/views/apps/AppsEcommerceProducts.vue"),
        },
        {
          path: "apps/ecommerce/orders",
          name: "AppsEcommerceOrders",
          component: () => import("@/views/apps/AppsEcommerceOrders.vue"),
        },
        {
          path: "apps/blogs/list",
          name: "AppsBlogsList",
          component: () => import("@/views/apps/AppsBlogsList.vue"),
        },
        {
          path: "apps/blogs/detail",
          name: "AppsBlogsDetail",
          component: () => import("@/views/apps/AppsBlogsDetail.vue"),
        },
        {
          path: "apps/chats",
          name: "AppsChats",
          component: () => import("@/views/apps/AppsChats.vue"),
        },
        {
          path: "apps/chat",
          name: "Chat",
          component: () => import("@/views/apps/Chat.vue"),
        },
        {
          path: "apps/user-profile",
          name: "AppsUserProfile",
          component: () => import("@/views/apps/AppsUserProfile.vue"),
        },
        {
          path: "apps/students",
          name: "Students",
          component: Students,
        },
        {
          path: "apps/students/:id",
          name: "StudentProfile",
          component: () => import("@/views/apps/StudentProfile.vue"),
        },
        {
          path: "apps/parents",
          name: "Parents",
          component: () => import("@/views/apps/Parents.vue"),
        },
        {
          path: "apps/teachers",
          name: "Teachers",
          component: () => import("@/views/apps/Teachers.vue"),
        },
        {
          path: "apps/quran-memorization",
          name: "QuranMemorization",
          component: () => import("@/views/apps/QuranMemorization.vue"),
        },
        {
          path: "apps/attendance",
          name: "Attendance",
          component: () => import("@/views/apps/Attendance.vue"),
        },
        {
          path: "apps/teacher-attendance",
          name: "TeacherAttendance",
          component: () => import("@/views/apps/TeacherAttendance.vue"),
        },
        {
          path: "apps/attendance-recap",
          name: "AttendanceRecap",
          component: () => import("@/views/apps/RecapAttendance.vue"),
          meta: { requiresAdmin: true },
        },
        {
          path: "apps/attendance/permissions",
          name: "PermissionList",
          component: () => import("@/views/apps/PermissionList.vue"),
        },
        {
          path: "apps/attendance/approvals",
          name: "PermissionApproval",
          component: () => import("@/views/apps/PermissionApproval.vue"),
          meta: { requiresAdmin: true },
        },
        {
          path: "apps/rewards",
          name: "Rewards",
          component: () => import("@/views/apps/Rewards.vue"),
        },
        {
          path: "apps/halaqah",
          name: "Halaqah",
          component: () => import("@/views/apps/Halaqah.vue"),
        },
        {
          path: "apps/rooms",
          name: "Rooms",
          component: () => import("@/views/apps/Rooms.vue"),
        },
        {
          path: "apps/divisions",
          name: "Divisions",
          component: () => import("@/views/apps/Divisions.vue"),
        },
        // Clinic Routes
        {
          path: "apps/clinic/medicines",
          name: "Medicines",
          component: () => import("@/views/apps/clinic/Medicines.vue"),
        },
        {
          path: "apps/clinic/inpatients",
          name: "Inpatients",
          component: () => import("@/views/apps/clinic/Inpatients.vue"),
        },
        {
          path: "apps/clinic/examinations",
          name: "Examinations",
          component: () => import("@/views/apps/clinic/Examinations.vue"),
        },
        // Academic Routes
        {
          path: "apps/academic/classes",
          name: "Classes",
          component: () => import("@/views/apps/academic/Classes.vue"),
        },
        {
          path: "apps/academic/subjects",
          name: "Subjects",
          component: () => import("@/views/apps/academic/Subjects.vue"),
        },
        {
          path: "apps/academic/schedules",
          name: "Schedules",
          component: () => import("@/views/apps/academic/Schedules.vue"),
        },
        {
          path: "apps/academic/grades",
          name: "Grades",
          component: () => import("@/views/apps/academic/Grades.vue"),
        },
        {
          path: "apps/academic/reports",
          name: "Reports",
          component: () => import("@/views/apps/academic/Reports.vue"),
        },
        {
          path: "apps/invoice/list",
          name: "AppsInvoiceList",
          component: () => import("@/views/apps/AppsInvoiceList.vue"),
        },
        {
          path: "apps/invoice/details",
          name: "AppsInvoiceDetails",
          component: () => import("@/views/apps/AppsInvoiceDetails.vue"),
        },
        {
          path: "apps/notes",
          name: "AppsNotes",
          component: () => import("@/views/apps/AppsNotes.vue"),
        },
        {
          path: "apps/calendar",
          name: "AppsCalendar",
          component: () => import("@/views/apps/AppsCalendar.vue"),
        },
        {
          path: "apps/email",
          name: "AppsEmail",
          component: () => import("@/views/apps/AppsEmail.vue"),
        },
        {
          path: "apps/tickets",
          name: "AppsTickets",
          component: () => import("@/views/apps/AppsTickets.vue"),
        },
        {
          path: "apps/kanban",
          name: "AppsKanban",
          component: () => import("@/views/apps/AppsKanban.vue"),
        },

        // =======================
        // ANALYTICS
        // =======================
        {
          path: "analytics/overview",
          name: "AnalyticsOverview",
          component: () => import("@/views/analytics/AnalyticsOverview.vue"),
        },
        {
          path: "analytics/reports",
          name: "AnalyticsReports",
          component: () => import("@/views/analytics/AnalyticsReports.vue"),
        },

        // =======================
        // SETTINGS
        // =======================
        {
          path: "settings/general",
          name: "SettingsGeneral",
          component: () => import("@/views/settings/SettingsGeneral.vue"),
        },
        {
          path: "settings/billing",
          name: "SettingsBilling",
          component: () => import("@/views/settings/SettingsBilling.vue"),
        },
        {
          path: "settings/attendance",
          name: "SettingsAttendance",
          component: () => import("@/views/settings/SettingsAttendance.vue"),
        },

        // =======================
        // SECURITY
        // =======================
        {
          path: "security/roles",
          name: "SecurityRoles",
          component: () => import("@/views/security/SecurityRoles.vue"),
        },

        //
        // ⚠️ PENTING:
        // Jangan taruh catch-all ":pathMatch(.*)*" di sini!
        // Supaya 404 selalu ditangani oleh DynamicNotFound di root.
        //
      ],
    },

    //
    // ======================
    // GLOBAL CATCH-ALL (Satu-satunya 404)
    // DynamicNotFound akan memutuskan:
    //   - User login → tampilkan NotFound dalam Layout
    //   - Guest → tampilkan NotFoundPublic (full page)
    // ======================
    //
    {
      path: "/:pathMatch(.*)*",
      name: "DynamicNotFound",
      component: DynamicNotFound,
    },
  ],
});

//
// ======================
// ROUTER GUARD
// ======================
//
router.beforeEach((to, from, next) => {
  const token = useLocalStorage("token", null).value;
  const isAuthPage = to.path === "/login" || to.path === "/register";

  // Guest
  if (!token) {
    // guest boleh buka login/register
    if (isAuthPage) return next();

    // guest buka path lain → biarkan DynamicNotFound atau route lain menanganinya
    return next();
  }

  // User login mencoba ke login/register → redirect ke dashboard
  if (token && isAuthPage) {
    return next("/apps/ai");
  }

  // Lainnya → lanjut
  return next();
});

export default router;
