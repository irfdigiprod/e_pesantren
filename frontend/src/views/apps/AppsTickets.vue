<template>
  <div class="flex flex-col space-y-8">
    <div class="flex flex-col bg-white rounded-xl shadow-sm border">
      <!-- Header -->
      <div class="flex items-center justify-between p-5 border-b">
        <div>
          <h2 class="text-lg font-semibold">Arrivals</h2>
          <p class="text-sm text-gray-500">
            Check and manage the arrivals of guests in this section
          </p>
        </div>
        <button class="btn-primary">+ Add new arrival</button>
      </div>

      <!-- Filter Bar -->
      <div class="flex flex-wrap items-center justify-between gap-4 p-4">
        <div class="flex gap-2">
          <button
            v-for="tab in tabs"
            :key="tab"
            class="tab-btn"
            :class="tab === activeTab ? 'tab-active' : ''"
            @click="activeTab = tab"
          >
            {{ tab }}
          </button>
        </div>

        <div class="flex items-center gap-2">
          <input type="text" placeholder="Search" class="input-search" />
          <button class="btn-outline">Filters</button>
        </div>
      </div>

      <!-- TABLE -->
      <div class="overflow-x-auto relative">
        <table class="w-full text-sm border-separate border-spacing-0">
          <thead class="bg-gray-50 text-gray-500">
            <tr>
              <!-- Sticky Left 1 -->
              <th class="sticky left-0 z-40 bg-gray-50 w-12 px-4 py-3">
                <input type="checkbox" />
              </th>

              <!-- Sticky Left 2 -->
              <th
                class="sticky left-12 z-40 bg-gray-50 w-64 px-4 py-3 text-left"
              >
                Property Name
              </th>

              <th class="w-48 px-4 py-3 text-left">Client</th>
              <th class="w-24 px-4 py-3">Ref</th>
              <th class="w-40 px-4 py-3">Mobile</th>
              <th class="w-32 px-4 py-3">Booking ID</th>
              <th class="w-32 px-4 py-3">Check In</th>
              <th class="w-32 px-4 py-3">Check Out</th>

              <!-- Sticky Right -->
              <th class="sticky right-0 z-40 bg-gray-50 w-16 px-4 py-3"></th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="row in arrivals"
              :key="row.id"
              class="border-t hover:bg-gray-50"
            >
              <!-- Sticky Left 1 -->
              <td class="sticky left-0 z-30 bg-white w-12 px-4 py-3">
                <input type="checkbox" />
              </td>

              <!-- Sticky Left 2 -->
              <td
                class="sticky left-12 z-30 bg-white w-64 px-4 py-3 font-medium"
              >
                {{ row.property }}
              </td>

              <td class="px-4 py-3 text-blue-600 cursor-pointer">
                {{ row.client }}
              </td>
              <td class="px-4 py-3 text-center">{{ row.ref }}</td>
              <td class="px-4 py-3">{{ row.mobile }}</td>
              <td class="px-4 py-3 text-blue-600">{{ row.bookingId }}</td>
              <td class="px-4 py-3">{{ row.checkIn }}</td>
              <td class="px-4 py-3">{{ row.checkOut }}</td>

              <!-- Sticky Right -->
              <td
                class="sticky right-0 z-30 bg-white w-16 px-4 py-3 text-right"
              >
                <button class="btn-icon">i</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between p-4 text-sm">
        <span>Total Arrivals: 300</span>
        <div class="flex items-center gap-2">
          <button class="page-btn">1</button>
          <button class="page-btn">2</button>
          <button class="page-btn">3</button>
          <button class="page-btn">›</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const tabs = ["View all", "This Month", "Next Month", "This Year"];
const activeTab = ref("View all");

const arrivals = ref([
  {
    id: 1,
    property: "Sanctuary Cottage",
    client: "Jean Owen",
    ref: "45138",
    mobile: "07812990424",
    bookingId: "15218",
    checkIn: "10/02/2023",
    checkOut: "17/02/2024",
  },
  {
    id: 2,
    property: "Sanctuary Cottage2",
    client: "Jean Owen2",
    ref: "45138",
    mobile: "07812990424",
    bookingId: "15218",
    checkIn: "10/02/2023",
    checkOut: "17/02/2024",
  },
  {
    id: 3,
    property: "Sanctuary Cottage3",
    client: "Jean Owen3",
    ref: "45138",
    mobile: "07812990424",
    bookingId: "15218",
    checkIn: "10/02/2023",
    checkOut: "17/02/2024",
  },
]);
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700;
}
.btn-outline {
  @apply border px-3 py-2 rounded-lg text-sm hover:bg-gray-50;
}
.input-search {
  @apply border rounded-lg px-3 py-2 text-sm w-48;
}
.tab-btn {
  @apply border rounded-lg px-3 py-1.5 text-sm;
}
.tab-active {
  @apply bg-blue-50 text-blue-600 border-blue-200;
}
.page-btn {
  @apply border px-3 py-1 rounded hover:bg-gray-100;
}
.btn-icon {
  @apply border rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100;
}
</style>
