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
    // MOBILE DASHBOARD
    // ======================
    {
      path: "/mobile-dashboard",
      component: () => import("@/components/MobileLayout.vue"),
      children: [
        {
          path: "",
          name: "MobileDashboard",
          component: () => import("@/views/MobileDashboard.vue"),
          meta: { title: "Dashboard" },
        },
        {
          path: "chat",
          name: "MobileChat",
          component: () => import("@/views/apps/Chat.vue"),
          meta: { title: "Chat" },
        },
        {
          path: "students",
          name: "MobileStudents",
          component: () => import("../views/apps/Students.vue"), // Reusing the import logic might be tricky if not consistent, using dynamic import is safest
          meta: { title: "Data Santri" },
        },
        {
          path: "tahfidz",
          name: "MobileTahfidz",
          component: () => import("@/views/apps/tahfidz/TahfidzDashboard.vue"),
          meta: { title: "Tahfidz" },
        },
        {
          path: "attendance",
          name: "MobileAttendance",
          component: () => import("@/views/apps/TeacherAttendance.vue"),
          meta: { title: "Absensi Guru" },
        },
        {
          path: "permissions",
          name: "MobilePermissions",
          component: () => import("@/views/apps/PermissionList.vue"),
          meta: { title: "Perizinan Saya" },
        },
        // Additional Routes for Grid Items
        {
          path: "profile",
          name: "MobileProfile",
          component: () => import("@/views/apps/AppsUserProfile.vue"),
          meta: { title: "Profil Pengguna" },
        },
        {
          path: "teachers",
          name: "MobileTeachers",
          component: () => import("@/views/apps/Teachers.vue"),
          meta: { title: "Data Guru" },
        },
        {
          path: "salary",
          name: "MobileSalary",
          component: () => import("@/views/apps/SalaryReport.vue"),
          meta: { title: "Laporan Gaji" },
        },
        {
          path: "divisions",
          name: "MobileDivisions",
          component: () => import("@/views/apps/Divisions.vue"),
          meta: { title: "Divisi" },
        },
        {
          path: "rooms",
          name: "MobileRooms",
          component: () => import("@/views/apps/Rooms.vue"),
          meta: { title: "Data Kamar" },
        },
        {
          path: "rewards",
          name: "MobileRewards",
          component: () => import("@/views/apps/Rewards.vue"),
          meta: { title: "Prestasi Santri" },
        },
        {
          path: "classes",
          name: "MobileClasses",
          component: () => import("@/views/apps/academic/Classes.vue"),
          meta: { title: "Data Kelas" },
        },
        {
          path: "subjects",
          name: "MobileSubjects",
          component: () => import("@/views/apps/academic/Subjects.vue"),
          meta: { title: "Mata Pelajaran" },
        },
        {
          path: "schedules",
          name: "MobileSchedules",
          component: () => import("@/views/apps/academic/Schedules.vue"),
          meta: { title: "Jadwal Pelajaran" },
        },
        {
          path: "grades",
          name: "MobileGrades",
          component: () => import("@/views/apps/academic/Grades.vue"),
          meta: { title: "Nilai Santri" },
        },
        {
          path: "academic-reports",
          name: "MobileAcademicReports",
          component: () => import("@/views/apps/academic/Reports.vue"),
          meta: { title: "Rapor Akademik" },
        },
        {
          path: "halaqah",
          name: "MobileHalaqah",
          component: () => import("@/views/apps/Halaqah.vue"),
          meta: { title: "Grup Halaqah" },
        },
        {
          path: "tahfidz-input",
          name: "MobileTahfidzInput",
          component: () => import("@/views/apps/tahfidz/TahfidzHalaqah.vue"),
          meta: { title: "Input Tahfidz" },
        },
        {
          path: "tahfidz-exams",
          name: "MobileTahfidzExams",
          component: () => import("@/views/apps/tahfidz/TahfidzExams.vue"),
          meta: { title: "Ujian Tahfidz" },
        },
        {
          path: "tahfidz-reports",
          name: "MobileTahfidzReports",
          component: () => import("@/views/apps/tahfidz/TahfidzReports.vue"),
          meta: { title: "Laporan Tahfidz" },
        },
        {
          path: "clinic",
          name: "MobileClinic",
          component: () => import("@/views/apps/clinic/Examinations.vue"),
          meta: { title: "Klinik" },
        },
        {
          path: "analytics",
          name: "MobileAnalytics",
          component: () => import("@/views/analytics/AnalyticsOverview.vue"),
          meta: { title: "Analytics" },
        },
        {
          path: "settings",
          name: "MobileSettings",
          component: () => import("@/views/settings/SettingsGeneral.vue"),
          meta: { title: "Pengaturan" },
        },
      ],
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
          path: "apps/tahfidz/dashboard",
          name: "TahfidzDashboard",
          component: () => import("@/views/apps/tahfidz/TahfidzDashboard.vue"),
        },
        {
          path: "apps/tahfidz/exams",
          name: "TahfidzExams",
          component: () => import("@/views/apps/tahfidz/TahfidzExams.vue"),
        },
        {
          path: "apps/tahfidz/reports",
          name: "TahfidzReports",
          component: () => import("@/views/apps/tahfidz/TahfidzReports.vue"),
        },
        {
          path: "apps/tahfidz/halaqah",
          name: "TahfidzHalaqah",
          component: () => import("@/views/apps/tahfidz/TahfidzHalaqah.vue"),
        },
        {
          path: "apps/tahfidz/mading",
          name: "MadingHalaqah",
          component: () => import("@/views/apps/tahfidz/MadingHalaqah.vue"),
        },
        {
          path: "apps/tahfidz/settings",
          name: "TahfidzSettings",
          component: () => import("@/views/apps/tahfidz/TahfidzSettings.vue"),
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
          path: "apps/salary-report",
          name: "SalaryReport",
          component: () => import("@/views/apps/SalaryReport.vue"),
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
          path: "apps/notifications",
          name: "Notifications",
          component: () => import("@/views/pages/Notifications.vue"),
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
        {
          path: "settings/salary-grading",
          name: "SalaryGrading",
          component: () => import("@/views/settings/SalaryGrading.vue"),
        },
        {
          path: "settings/salary",
          name: "SalarySettings",
          component: () => import("@/views/settings/SalarySettings.vue"),
        },
        {
          path: "settings/institution",
          name: "SettingsInstitution",
          component: () => import("@/views/settings/SettingsInstitution.vue"),
        },
        {
          path: "settings/information-board",
          name: "InformationBoardSettings",
          component: () =>
            import("@/views/settings/InformationBoardSettings.vue"),
        },
        {
          path: "about",
          name: "About",
          component: () => import("@/views/About.vue"),
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

    // guest buka path lain → redirect ke login
    if (!isAuthPage) return next("/login");

    return next();
  }

  // User login mencoba ke login/register → redirect ke dashboard
  if (token && isAuthPage) {
    return next("/apps/teacher-attendance");
  }

  // Lainnya → lanjut
  return next();
});

export default router;
