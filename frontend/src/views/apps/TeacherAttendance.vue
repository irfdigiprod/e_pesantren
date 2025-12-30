<template>
  <div class="min-h-screen bg-slate-100 p-4">
    <!-- Header with Clock -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-lg font-bold text-slate-800">Absensi Guru</h1>
      <div
        class="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm text-sm text-slate-600"
      >
        <Icon icon="lucide:clock" class="w-4 h-4 text-amber-500" />
        <span class="font-semibold font-mono">{{ currentTime }}</span>
      </div>
    </div>

    <!-- Skeleton Loader -->
    <div v-if="loading" class="animate-pulse space-y-4">
      <!-- Check In/Out Cards Skeleton -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="bg-white rounded-2xl p-4 shadow-sm h-48">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-2 h-2 rounded-full bg-slate-200"></div>
            <div class="h-3 w-10 bg-slate-200 rounded"></div>
            <div class="ml-auto h-3 w-16 bg-slate-200 rounded"></div>
          </div>
          <div class="flex flex-col items-center justify-center h-24 gap-2">
            <div class="h-8 w-24 bg-slate-200 rounded"></div>
            <div class="h-3 w-20 bg-slate-200 rounded"></div>
          </div>
          <div class="h-10 w-full bg-slate-200 rounded-full mt-2"></div>
        </div>
        <div class="bg-white rounded-2xl p-4 shadow-sm h-48">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-2 h-2 rounded-full bg-slate-200"></div>
            <div class="h-3 w-10 bg-slate-200 rounded"></div>
            <div class="ml-auto h-3 w-16 bg-slate-200 rounded"></div>
          </div>
          <div class="flex flex-col items-center justify-center h-24 gap-2">
            <div class="h-8 w-24 bg-slate-200 rounded"></div>
            <div class="h-3 w-20 bg-slate-200 rounded"></div>
          </div>
          <div class="h-10 w-full bg-slate-200 rounded-full mt-2"></div>
        </div>
      </div>

      <!-- History Skeleton -->
      <div class="bg-white rounded-2xl shadow-sm p-4">
        <div class="flex justify-between items-center mb-4">
          <div class="h-4 w-32 bg-slate-200 rounded"></div>
          <div class="h-8 w-8 bg-slate-200 rounded"></div>
        </div>
        <div class="space-y-4">
          <div
            v-for="i in 3"
            :key="i"
            class="flex justify-between items-center"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-slate-200"></div>
              <div class="space-y-2">
                <div class="h-3 w-24 bg-slate-200 rounded"></div>
                <div class="h-2 w-16 bg-slate-200 rounded"></div>
              </div>
            </div>
            <div class="h-6 w-16 bg-slate-200 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Real Content Wrapper -->
    <div v-else class="space-y-4">
      <!-- Check In/Out Cards -->
      <div class="grid grid-cols-2 gap-3">
        <!-- Masuk Card -->
        <div class="bg-white rounded-2xl p-4 shadow-sm flex flex-col h-full">
          <div class="flex items-center gap-2 mb-3">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span class="text-xs text-slate-600 font-medium">Masuk</span>
            <span class="text-xs text-slate-400 ml-auto">{{
              distance !== null ? formatDistance(distance) : "..."
            }}</span>
            <Icon
              v-if="isWithinRadius"
              icon="lucide:map-pin"
              class="w-3 h-3 text-emerald-500"
            />
          </div>

          <!-- Activity Selection -->
          <div v-if="!todayAttendance?.checkIn || newShiftAllowed" class="mb-3">
            <select
              v-model="selectedActivity"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:border-amber-500 focus:ring-1 focus:ring-amber-200 transition-all outline-none"
            >
              <option value="" disabled>Pilih Kegiatan</option>
              <option
                v-for="activity in settings.activityTypes"
                :key="activity"
                :value="activity"
              >
                {{ activity }}
              </option>
            </select>
          </div>

          <!-- Time Display -->
          <div class="text-center mb-4" v-else>
            <div
              class="text-2xl font-bold text-slate-800 tracking-wider font-mono"
            >
              {{ todayAttendance?.checkIn || "──:──" }}
            </div>
            <div class="text-xs text-slate-400 mt-1">
              {{ todayAttendance?.checkIn ? "Tercatat" : "Belum absen" }}
            </div>
          </div>

          <button
            @click="handleCheckIn"
            :disabled="
              savingCheckIn ||
              !selectedActivity ||
              (!!todayAttendance?.checkIn && !newShiftAllowed) ||
              !isWithinRadius ||
              distance === null
            "
            class="w-full py-2.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 mt-auto"
            :class="
              (todayAttendance?.checkIn && !newShiftAllowed) ||
              !selectedActivity
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isWithinRadius
                ? 'bg-amber-900 text-white hover:bg-amber-400 shadow-md'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            "
          >
            <span
              v-if="
                !savingCheckIn &&
                (!todayAttendance?.checkIn || newShiftAllowed) &&
                selectedActivity
              "
              class="w-2 h-2 rounded-full bg-white"
            ></span>
            <Icon
              v-if="savingCheckIn"
              icon="lucide:loader-2"
              class="w-4 h-4 animate-spin"
            />
            <span>Masuk</span>
          </button>
        </div>

        <!-- Pulang Card -->
        <div class="bg-white rounded-2xl p-4 shadow-sm flex flex-col h-full">
          <div class="flex items-center gap-2 mb-3">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span class="text-xs text-slate-600 font-medium">Pulang</span>
            <span class="text-xs text-slate-400 ml-auto">{{
              distance !== null ? formatDistance(distance) : "..."
            }}</span>
            <Icon
              v-if="isWithinRadius"
              icon="lucide:map-pin"
              class="w-3 h-3 text-emerald-500"
            />
          </div>

          <!-- Time Display -->
          <div class="text-center mb-4">
            <div
              class="text-2xl font-bold text-slate-800 tracking-wider font-mono"
            >
              {{ todayAttendance?.checkOut || "──:──" }}
            </div>
            <div class="text-xs text-slate-400 mt-1">
              {{ todayAttendance?.checkOut ? "Tercatat" : "Belum absen" }}
            </div>
          </div>

          <button
            @click="handleCheckOut"
            :disabled="
              savingCheckOut ||
              !todayAttendance?.checkIn ||
              !!todayAttendance?.checkOut ||
              !isWithinRadius ||
              distance === null
            "
            class="w-full py-2.5 rounded-full text-sm font-semibold transition-all mt-auto"
            :class="
              !!todayAttendance?.checkOut
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isWithinRadius && todayAttendance?.checkIn
                ? 'bg-amber-900 text-white hover:bg-amber-400 shadow-md'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            "
          >
            <Icon
              v-if="savingCheckOut"
              icon="lucide:loader-2"
              class="w-4 h-4 animate-spin inline mr-1"
            />
            <span>Pulang</span>
          </button>
        </div>
      </div>

      <!-- Today's Activity Section -->
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div
          class="flex items-center justify-between px-4 py-3 border-b border-slate-100"
        >
          <div class="flex items-center gap-2">
            <Icon icon="lucide:calendar" class="w-5 h-5 text-slate-400" />
            <span class="text-sm font-medium text-slate-700">
              {{
                showFullHistory ? "Riwayat Absensi Saya" : "Kegiatan hari ini"
              }}
              <span v-if="!showFullHistory">, {{ formattedToday }}</span>
            </span>
          </div>
          <button
            @click="showFullHistory = !showFullHistory"
            class="p-1 rounded-lg hover:bg-slate-100 transition-colors"
            :title="
              showFullHistory ? 'Tampilan Ringkas' : 'Lihat Semua Riwayat'
            "
          >
            <Icon
              :icon="
                showFullHistory ? 'lucide:layout-grid' : 'lucide:calendar-days'
              "
              class="w-5 h-5 text-amber-900"
            />
          </button>
        </div>

        <!-- Compact View (Today only) -->
        <div v-if="!showFullHistory" class="divide-y divide-slate-100">
          <div
            v-if="todayRecords.length === 0"
            class="px-4 py-8 text-center text-slate-400 text-sm"
          >
            Belum ada absensi kegiatan !
          </div>

          <div
            v-for="item in todayRecords"
            :key="item.id"
            class="px-4 py-3 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center"
                :class="
                  item.checkOut
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-amber-100 text-amber-600'
                "
              >
                <Icon
                  :icon="item.checkOut ? 'lucide:check' : 'lucide:clock'"
                  class="w-4 h-4"
                />
              </div>
              <div>
                <p class="text-sm font-medium text-slate-800">
                  {{ item.checkIn }} - {{ item.checkOut || "..." }}
                  <span v-if="item.activity" class="ml-1 text-xs text-slate-500"
                    >({{ item.activity }})</span
                  >
                </p>
                <p class="text-xs text-slate-400">
                  {{ item.checkOut ? "Selesai" : "Sedang berlangsung" }}
                </p>
                <p
                  v-if="item.checkInLatitude || item.checkOutLatitude"
                  class="text-xs text-slate-400 mt-0.5"
                >
                  <span v-if="item.checkInLatitude">
                    Masuk:
                    {{
                      calculateDistanceFromCoords(
                        item.checkInLatitude,
                        item.checkInLongitude
                      )
                    }}
                  </span>
                  <span v-if="item.checkOutLatitude" class="ml-2">
                    Pulang:
                    {{
                      calculateDistanceFromCoords(
                        item.checkOutLatitude,
                        item.checkOutLongitude
                      )
                    }}
                  </span>
                </p>
              </div>
            </div>
            <span
              class="px-2 py-1 text-xs font-medium rounded-full"
              :class="getStatusClass(item.status)"
            >
              {{ formatAttendanceStatus(item.status) }}
            </span>
          </div>
        </div>

        <!-- Full Table View (All user's records) -->
        <!-- Full Table View -->
        <div v-else>
          <!-- Mobile: Card View -->
          <div class="md:hidden divide-y divide-slate-100">
            <template v-for="date in periodDates" :key="date.toISOString()">
              <!-- Has Data -->
              <template v-if="getAttendancesForDate(date).length > 0">
                <div
                  class="p-4 relative transition-colors"
                  :class="
                    settings.holidays?.includes(date.getDay())
                      ? 'bg-rose-50'
                      : 'bg-white hover:bg-slate-50'
                  "
                >
                  <!-- Single Header for Date & Status -->
                  <div
                    class="flex items-center justify-between mb-3 border-b border-slate-100 pb-2"
                  >
                    <span class="text-sm font-bold text-slate-800">{{
                      formatDate(getAttendancesForDate(date)[0].date)
                    }}</span>
                    <span
                      class="px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="
                        getStatusClass(getAttendancesForDate(date)[0].status)
                      "
                    >
                      {{
                        formatAttendanceStatus(
                          getAttendancesForDate(date)[0].status
                        )
                      }}
                    </span>
                  </div>

                  <!-- List of Sessions for this Date -->
                  <div class="space-y-3">
                    <div
                      v-for="(item, idx) in getAttendancesForDate(date)"
                      :key="item.id"
                      class="space-y-1"
                    >
                      <div class="flex items-center gap-4 text-sm">
                        <div class="min-w-[80px]">
                          <span
                            class="text-xs text-slate-400 block uppercase tracking-wider"
                            >Masuk</span
                          >
                          <span class="text-emerald-600 font-medium">{{
                            item.checkIn || "-"
                          }}</span>
                        </div>
                        <div class="min-w-[80px]">
                          <span
                            class="text-xs text-slate-400 block uppercase tracking-wider"
                            >Pulang</span
                          >
                          <span class="text-rose-600 font-medium">{{
                            item.checkOut || "-"
                          }}</span>
                        </div>
                      </div>
                      <!-- Activity -->
                      <div
                        v-if="item.activity"
                        class="text-xs text-slate-500 italic flex items-center gap-1.5 pt-0.5"
                      >
                        <Icon
                          icon="lucide:clipboard-list"
                          class="w-3 h-3 opacity-70"
                        />
                        {{ item.activity }}
                      </div>

                      <!-- Divider if not last item -->
                      <div
                        v-if="idx < getAttendancesForDate(date).length - 1"
                        class="h-px bg-slate-100 my-2"
                      ></div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Empty / Claim -->
              <div
                v-else
                class="p-4 flex items-center justify-between"
                :class="
                  settings.holidays?.includes(date.getDay())
                    ? 'bg-rose-50'
                    : 'bg-slate-50'
                "
              >
                <span
                  class="text-sm font-medium text-slate-400"
                  :class="{
                    'text-rose-400': settings.holidays?.includes(date.getDay()),
                  }"
                  >{{ formatDate(formatDateISO(date)) }}</span
                >
                <button
                  @click="openClaimModal(date)"
                  class="px-3 py-1 text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-amber-50 hover:text-amber-600 transition-colors shadow-sm"
                >
                  Klaim Kehadiran
                </button>
              </div>
            </template>

            <div
              v-if="periodDates.length === 0"
              class="p-8 text-center text-slate-400 text-sm"
            >
              Menyiapkan periode absensi...
            </div>
          </div>

          <!-- Desktop: Table View -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr
                  class="text-left text-xs font-semibold text-slate-500 bg-slate-50 uppercase tracking-wider border-b border-slate-100"
                >
                  <th class="px-4 py-3">Tanggal</th>
                  <th class="px-4 py-3">Masuk</th>
                  <th class="px-4 py-3">Jarak Masuk</th>
                  <th class="px-4 py-3">Pulang</th>
                  <th class="px-4 py-3">Jarak Pulang</th>
                  <th class="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <template v-for="date in periodDates" :key="date.toISOString()">
                  <!-- Check if date has attendances -->
                  <template v-if="getAttendancesForDate(date).length > 0">
                    <tr
                      v-for="(item, idx) in getAttendancesForDate(date)"
                      :key="item.id"
                      class="transition-colors"
                      :class="
                        settings.holidays?.includes(date.getDay())
                          ? 'bg-rose-50'
                          : 'hover:bg-slate-50/50'
                      "
                    >
                      <!-- Date Cell: Only show on first row, span if multiple -->
                      <td
                        class="px-4 py-3 font-medium text-slate-900 border-r border-slate-100 align-top"
                        v-if="idx === 0"
                        :rowspan="getAttendancesForDate(date).length"
                      >
                        {{ formatDate(item.date) }}
                      </td>

                      <td
                        class="px-4 py-3 text-emerald-600 font-medium align-top"
                      >
                        {{ item.checkIn || "-" }}
                        <div
                          v-if="item.activity"
                          class="text-xs text-slate-400 font-normal mt-0.5 max-w-[150px] truncate"
                          :title="item.activity"
                        >
                          {{ item.activity }}
                        </div>
                      </td>
                      <td class="px-4 py-3 text-slate-500 text-xs align-top">
                        {{
                          item.checkInLatitude
                            ? calculateDistanceFromCoords(
                                item.checkInLatitude,
                                item.checkInLongitude
                              )
                            : "-"
                        }}
                      </td>
                      <td class="px-4 py-3 text-rose-600 font-medium align-top">
                        {{ item.checkOut || "-" }}
                      </td>
                      <td class="px-4 py-3 text-slate-500 text-xs align-top">
                        {{
                          item.checkOutLatitude
                            ? calculateDistanceFromCoords(
                                item.checkOutLatitude,
                                item.checkOutLongitude
                              )
                            : "-"
                        }}
                      </td>
                      <td class="px-4 py-3 align-top">
                        <span
                          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                          :class="getStatusClass(item.status)"
                        >
                          {{ formatAttendanceStatus(item.status) }}
                          <span v-if="item.isClaim" class="ml-1 text-slate-500"
                            >(Klaim)</span
                          >
                        </span>
                      </td>
                    </tr>
                  </template>

                  <!-- Missing Attendance Row -->
                  <tr
                    v-else
                    class="transition-colors"
                    :class="
                      settings.holidays?.includes(date.getDay())
                        ? 'bg-rose-50'
                        : 'bg-transparent hover:bg-slate-50/50'
                    "
                  >
                    <td
                      class="px-4 py-3 font-medium text-slate-400 border-r border-slate-100"
                    >
                      {{ formatDate(formatDateISO(date)) }}
                    </td>
                    <td
                      colspan="4"
                      class="px-4 py-3 text-center text-slate-300"
                    >
                      -
                    </td>
                    <td class="px-4 py-3">
                      <button
                        @click="openClaimModal(date)"
                        class="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
                      >
                        Tidak hadir (Klaim)
                      </button>
                    </td>
                  </tr>
                </template>

                <tr v-if="periodDates.length === 0">
                  <td colspan="6" class="px-4 py-8 text-center text-slate-400">
                    Menyiapkan periode absensi...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Claim Modal -->
      <div
        v-if="claimModal.open"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 transition-opacity"
      >
        <div class="bg-white rounded-2xl w-full max-w-md overflow-hidden">
          <div
            class="px-6 py-4 border-b border-slate-100 flex items-center justify-between"
          >
            <h3 class="font-semibold text-slate-800">Ajukan Klaim Kehadiran</h3>
            <button
              @click="claimModal.open = false"
              class="text-slate-400 hover:text-slate-600"
            >
              <Icon icon="lucide:x" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Tanggal</label
              >
              <input
                type="date"
                :value="claimModal.date"
                disabled
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Jam Masuk</label
                >
                <VueDatePicker
                  v-model="claimModal.checkIn"
                  time-picker
                  :is-24="true"
                  model-type="HH:mm"
                  placeholder="--:--"
                  :teleport="true"
                  auto-apply
                  input-class-name="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-100 outline-none !bg-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Jam Pulang</label
                >
                <VueDatePicker
                  v-model="claimModal.checkOut"
                  time-picker
                  :is-24="true"
                  model-type="HH:mm"
                  placeholder="--:--"
                  :teleport="true"
                  auto-apply
                  input-class-name="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-100 outline-none !bg-white"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Jenis Kegiatan</label
              >
              <select
                v-model="claimModal.activity"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-100 outline-none"
              >
                <option value="">Pilih Kegiatan...</option>
                <option
                  v-for="act in settings.activityTypes"
                  :key="act"
                  :value="act"
                >
                  {{ act }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Alasan / Catatan <span class="text-red-500">*</span></label
              >
              <textarea
                v-model="claimModal.notes"
                rows="3"
                placeholder="Jelaskan alasan tidak absen secaran normal..."
                class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-100 outline-none"
              ></textarea>
            </div>
          </div>
          <div class="px-6 py-4 bg-slate-50 flex justify-end gap-3">
            <button
              @click="claimModal.open = false"
              class="px-4 py-2 text-sm text-slate-600 font-medium hover:bg-slate-200 rounded-lg"
            >
              Batal
            </button>
            <button
              @click="submitClaim"
              :disabled="
                claimModal.loading || !claimModal.checkIn || !claimModal.notes
              "
              class="px-4 py-2 text-sm text-white font-medium bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              <Icon
                v-if="claimModal.loading"
                icon="lucide:loader-2"
                class="w-4 h-4 animate-spin"
              />
              Kirim Pengajuan
            </button>
          </div>
        </div>
      </div>

      <!-- New Session Button (when checked out) -->
      <!-- New Session FAB -->
      <button
        v-if="todayAttendance?.checkOut && !newShiftAllowed && isWithinRadius"
        @click="enableNewShift"
        class="fixed bottom-24 right-6 z-50 w-14 h-14 bg-amber-900 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-amber-800 transition-transform active:scale-95"
      >
        <Icon icon="lucide:plus" class="w-8 h-8" />
      </button>

      <!-- Location Error Alert -->
      <div
        v-if="locationError"
        class="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2"
      >
        <Icon
          icon="lucide:alert-circle"
          class="w-4 h-4 text-red-500 shrink-0 mt-0.5"
        />
        <p class="text-xs text-red-600">{{ locationError }}</p>
      </div>
    </div>

    <!-- Status Modal -->
    <StatusModal
      :is-open="statusModal.open"
      :type="statusModal.type"
      :title="statusModal.title"
      :message="statusModal.message"
      @close="statusModal.open = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, reactive } from "vue";
import { Icon } from "@iconify/vue";
import {
  attendanceApi,
  authApi,
  teachersApi,
  settingsApi,
} from "@/services/api.js";
import { useDateFormat, useNow } from "@vueuse/core";
import StatusModal from "@/components/ui/StatusModal.vue";

// DatePicker
import { VueDatePicker } from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

// State
const attendances = ref([]);
const loading = ref(true);
const savingCheckIn = ref(false);
const savingCheckOut = ref(false);
const distance = ref(null);
const locationError = ref("");
// Reactive current time (full Date object)
const now = useNow();
const isComponentMounted = ref(false);

// Formatted time string for header clock
const currentTime = useDateFormat(now, "HH:mm:ss");

const showFullHistory = ref(false);
const selectedActivity = ref("");
const newShiftAllowed = ref(false);

// Settings
const settings = ref({
  latitude: 0,
  longitude: 0,
  radius: 100,
  activityTypes: [],
  periodStart: 25, // Default cutoff
  periodEnd: 24,
  holidays: [],
});

// Claim Modal State
const claimModal = reactive({
  open: false,
  date: "",
  checkIn: "",
  checkOut: "",
  activity: "",
  notes: "",
  loading: false,
});

// Status Modal State
const statusModal = reactive({
  open: false,
  type: "success",
  title: "",
  message: "",
});

function showStatus(type, title, message) {
  statusModal.type = type;
  statusModal.title = title;
  statusModal.message = message;
  statusModal.open = true;
}

// Computed: Current Period Dates
const periodDates = computed(() => {
  const dates = [];
  const today = new Date();

  if (settings.value.periodType === "same_month") {
    // Same month logic: 1st to End of current month
    // Determine which month "current" refers to.
    // Typically if Start=1, End=31.
    // If Today is Jan 10 -> Period is Jan 1 to Jan 31.

    // What if Start=10, End=9 (same month)? Not possible.
    // We assume Same Month means strictly [Month Start, Month End] for the purpose of a full monthly view.
    // OR we respect Start/End inputs within the same month?
    // User example: "Rentang tanggal pada bulan yang sama". Likely Start < End.
    // Example: Start 1, End 30.

    // Current Period determination:
    // If Today <= End, we are in current month's period?
    // Actually simple: Just take current month.

    const year = today.getFullYear();
    const month = today.getMonth();

    // Start Date
    const start = new Date(year, month, settings.value.periodStart);
    // If Start > Today?? This implies we are looking at *future* period?
    // No, usually "Active Period". If Period is 20-30 and Today is 10.
    // Then we are NOT in that period. We are in Previous Month's 20-30? Or Next?
    // This is tricky.
    // Let's assume standard "Monthly View".
    // If "Same Month": Standard Calendar Month of Today.
    // Start = Date(Year, Month, settings.periodStart)
    // End = Date(Year, Month, settings.periodEnd)

    // Adjust if periodEnd < periodStart (logic error or crossover?)
    // If user selects "Same Month", Period End must be >= Period Start.
    // If they selected Start 25, End 24 and "Same Month", that's invalid.
    // But let's just generate from Start to End.

    let current = new Date(start);
    // If today is *before* start (e.g. today 5, start 20), do we show *previous* month's period?
    // Typically payroll is "Current Active Period".
    // If today is 5th, and period is 20th-30th.
    // The "Active" period for the 5th might be undefined or just "This Month".

    // Let's stick to: "Show the period associated with Today's month".

    const end = new Date(year, month, settings.value.periodEnd);

    // If end < start, maybe they meant cross month but selected same month?
    // Or maybe they just mixed up. We'll generate what we can.

    // Loop
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  } else {
    // Cross Month Logic (Default)
    // Example: Start 25, End 24.
    // If Today is 10. Start 25.
    // Today < Start.
    // Use Previous Month as Start Base.

    let startMonth = today.getMonth();
    let startYear = today.getFullYear();

    if (today.getDate() < settings.value.periodStart) {
      startMonth--;
      if (startMonth < 0) {
        startMonth = 11;
        startYear--;
      }
    }

    const startDate = new Date(
      startYear,
      startMonth,
      settings.value.periodStart
    );

    // For cross-month, the end date is in the NEXT month
    let endMonth = startMonth + 1;
    let endYear = startYear;
    if (endMonth > 11) {
      endMonth = 0;
      endYear++;
    }
    const endDate = new Date(endYear, endMonth, settings.value.periodEnd);

    let current = new Date(startDate);

    // Loop until we reach the end date
    while (current <= endDate && dates.length < 45) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  }

  return dates;
});

// Helper to get attendances for a specific date (returns Array)
function getAttendancesForDate(dateObj) {
  const dateStr = formatDateISO(dateObj); // YYYY-MM-DD
  return attendances.value
    .filter((item) => {
      if (!item.date) return false;
      let itemDate = item.date;
      // Handle if item.date is Date object
      if (itemDate instanceof Date) {
        return formatDateISO(itemDate) === dateStr;
      }
      // Handle string (ISO or YYYY-MM-DD)
      if (typeof itemDate === "string") {
        return itemDate.startsWith(dateStr);
      }
      return false;
    })
    .sort((a, b) => {
      // Sort by checkIn time if possible
      if (a.checkIn && b.checkIn) return a.checkIn.localeCompare(b.checkIn);
      return 0;
    });
}

function formatDateISO(date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
}

function openClaimModal(dateObj) {
  claimModal.date = formatDateISO(dateObj);
  claimModal.checkIn = "";
  claimModal.checkOut = "";
  claimModal.activity = "";
  claimModal.notes = "";
  claimModal.open = true;
}

async function submitClaim() {
  if (!claimModal.checkIn || !claimModal.notes) return;

  claimModal.loading = true;
  try {
    // Normalize time format from VueDatePicker
    const formatTime = (time) => {
      if (!time) return undefined;
      if (typeof time === "string") return time || undefined;
      if (typeof time === "object" && time !== null) {
        const h = String(time.hours).padStart(2, "0");
        const m = String(time.minutes).padStart(2, "0");
        return `${h}:${m}`;
      }
      return undefined;
    };

    // Validate teacherId
    if (!currentTeacher.value?.id) {
      console.error(
        "Missing teacherId. Current User:",
        currentUser.value,
        "Current Teacher:",
        currentTeacher.value
      );
      throw new Error(
        "Data guru tidak ditemukan. Pastikan akun terhubung dengan data guru."
      );
    }

    const payload = {
      teacherId: currentTeacher.value?.id,
      date: claimModal.date,
      checkIn: formatTime(claimModal.checkIn),
      checkOut: formatTime(claimModal.checkOut),
      activity: claimModal.activity,
      notes: claimModal.notes,
    };

    // Remove undefined keys to play nice with Zod optional
    Object.keys(payload).forEach(
      (key) => payload[key] === undefined && delete payload[key]
    );

    // console.log("Submitting Claim Payload:", JSON.stringify(payload, null, 2));

    await attendanceApi.teacherClaim(payload);

    showStatus("success", "Berhasil", "Klaim kehadiran berhasil diajukan.");
    claimModal.open = false;
    fetchData(); // Refresh list
  } catch (e) {
    showStatus("error", "Gagal", e.message || "Gagal klaim");
  } finally {
    claimModal.loading = false;
  }
}

// Settings (fetched from API)
// const settings = ref({
//   latitude: -6.175392,
//   longitude: 106.827153,
//   radius: 100,
//   activityTypes: ["Mengajar", "Piket", "Rapat", "Kegiatan Lainnya"],
// });

async function fetchSettings() {
  try {
    const res = await settingsApi.getAll([
      "attendance_latitude",
      "attendance_longitude",
      "attendance_radius",
      "attendance_activities",
      "attendance_period_start",
      "attendance_period_end",
      "attendance_period_type",
      "attendance_holidays",
    ]);

    if (res.data) {
      if (res.data.attendance_latitude)
        settings.value.latitude = parseFloat(res.data.attendance_latitude);
      if (res.data.attendance_longitude)
        settings.value.longitude = parseFloat(res.data.attendance_longitude);
      if (res.data.attendance_radius)
        settings.value.radius = parseInt(res.data.attendance_radius);
      if (res.data.attendance_activities)
        settings.value.activityTypes = JSON.parse(
          res.data.attendance_activities
        );
      if (res.data.attendance_period_start)
        settings.value.periodStart = parseInt(res.data.attendance_period_start);
      if (res.data.attendance_period_end)
        settings.value.periodEnd = parseInt(res.data.attendance_period_end);
      if (res.data.attendance_period_type)
        settings.value.periodType = res.data.attendance_period_type;

      try {
        if (res.data.attendance_holidays) {
          settings.value.holidays = JSON.parse(res.data.attendance_holidays);
        } else {
          settings.value.holidays = [0];
        }
      } catch (e) {
        settings.value.holidays = [0];
      }
    }
  } catch (e) {
    console.error("Gagal memuat pengaturan:", e);
  }
}

// Geolocation
let geoId;
const currentPos = ref({ lat: null, lng: null });

const isWithinRadius = computed(() => {
  if (distance.value === null) return false;
  return distance.value <= settings.value.radius;
});

const canCheckIn = computed(() => {
  if (savingCheckIn.value) return false;
  if (!selectedActivity.value) return false;
  if (!isWithinRadius.value) return false;

  // Allow if not checked in OR new shift is explicitly allowed
  if (!todayAttendance.value?.checkIn) return true;
  if (newShiftAllowed.value) return true;

  return false;
});

const canCheckOut = computed(() => {
  if (savingCheckOut.value) return false;
  if (!isWithinRadius.value) return false;

  // Must be checked in AND not checked out
  if (!todayAttendance.value?.checkIn) return false;
  if (todayAttendance.value?.checkOut) return false;

  return true;
});

const isCheckInDisabled = computed(() => !canCheckIn.value);
const isCheckOutDisabled = computed(() => !canCheckOut.value);

// Formatted today's date
const formattedToday = computed(() => {
  return new Date(now.value).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

// Helper: Haversine Formula
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371e3;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function formatDistance(meters) {
  if (meters >= 1000) return (meters / 1000).toFixed(2) + " km";
  return Math.round(meters) + " m";
}

// Calculate distance from saved coordinates to settings location
function calculateDistanceFromCoords(lat, lng) {
  const dist = getDistanceFromLatLonInMeters(
    Number(lat),
    Number(lng),
    settings.value.latitude,
    settings.value.longitude
  );
  return formatDistance(dist);
}

// Get user info and teacher info
const currentUser = ref(null);
const currentTeacher = ref(null);

async function fetchUser() {
  try {
    const res = await authApi.getCurrentUser();
    currentUser.value = res.data;

    // Fetch teacher record by userId to get correct teacher.id
    if (currentUser.value?.id) {
      const teacherRes = await teachersApi.getAll({
        userId: currentUser.value.id,
      });
      if (teacherRes?.data?.length > 0) {
        currentTeacher.value = teacherRes.data[0];
      }
    }
  } catch (e) {
    console.error("Failed to get user", e);
  }
}

// Today's date string
const todayString = computed(() => {
  const currentDate = new Date(now.value); // Reactive source
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
});

// Today's records
const todayRecords = computed(() => {
  return attendances.value
    .filter((a) => a.date && String(a.date).startsWith(todayString.value))
    .sort((a, b) => b.id - a.id);
});

function formatAttendanceStatus(status, type = "text") {
  switch (status) {
    case "present":
      return "Hadir";
    case "late":
      return "Terlambat";
    case "absent":
      return "Alpha";
    case "permit_deduct":
      return "Izin (Kena Potong)";
    case "sick_deduct":
      return "Sakit (Kena Potong)";
    case "permit_no_deduct":
      return "Izin (Tanpa Potong)";
    case "sick_no_deduct":
      return "Sakit (Tanpa Potong)";
    case "permitted":
      return "Izin";
    case "sick":
      return "Sakit";
    default:
      return status || "-";
  }
}

// Today attendance (latest)
const todayAttendance = computed(() => {
  if (todayRecords.value.length === 0) return null;
  return todayRecords.value[0];
});

// All user's attendances (sorted by date desc)
const myAttendances = computed(() => {
  return attendances.value.slice().sort((a, b) => {
    // Sort by date descending, then by id descending
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateB - dateA !== 0) return dateB - dateA;
    return b.id - a.id;
  });
});

// Format date for display
function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusClass(status) {
  if (status === "present") return "bg-emerald-100 text-emerald-800";
  if (status === "late") return "bg-amber-100 text-amber-800";
  if (status === "absent") return "bg-rose-100 text-rose-800";
  if (["permit_deduct", "sick_deduct", "permitted", "sick"].includes(status))
    return "bg-rose-100 text-rose-700";
  if (["permit_no_deduct", "sick_no_deduct"].includes(status))
    return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-700"; // Default gray
}

async function fetchData() {
  loading.value = true;
  try {
    // Only fetch attendance for the logged-in teacher
    const teacherId = currentTeacher.value?.id;
    const params = teacherId ? { teacherId } : {};
    const res = await attendanceApi.getTeacherAttendance(params);
    attendances.value = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

// Helper to get current position with promise
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Browser tidak mendukung Geolocation"));
      return;
    }

    // Try high accuracy first (GPS) - 10s timeout
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => {
        console.debug(
          "High accuracy location failed, retrying with low accuracy...",
          err.message
        );
        // Fallback: Low accuracy (Network/WiFi) - Faster, more reliable indoors
        // Allow cached positions up to 2 minutes old
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          (err2) => reject(err2),
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 }
        );
      },

      { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
    );
  });
}

async function handleCheckIn() {
  // Pre-check basic requirements
  if (!selectedActivity.value) {
    showStatus("error", "Gagal", "Pilih jenis kegiatan terlebih dahulu.");
    return;
  }

  // Check if already on leave/sick today
  if (
    todayAttendance.value &&
    [
      "permitted",
      "sick",
      "permit_deduct",
      "sick_deduct",
      "permit_no_deduct",
      "sick_no_deduct",
    ].includes(todayAttendance.value.status)
  ) {
    showStatus("info", "Sedang Izin", "Anda sedang izin hari ini.");
    return;
  }

  savingCheckIn.value = true;
  try {
    // Force fresh location update
    const pos = await getCurrentPosition();
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    // Validate distance locally
    const dist = getDistanceFromLatLonInMeters(
      lat,
      lng,
      settings.value.latitude,
      settings.value.longitude
    );

    distance.value = dist; // Update UI distance
    currentPos.value = { lat, lng }; // Update UI position

    if (dist > settings.value.radius) {
      throw new Error(
        `Anda berada di luar radius absensi (${formatDistance(dist)})`
      );
    }

    const payload = {
      teacherId: currentTeacher.value?.id,
      checkInTime: new Date().toTimeString().slice(0, 5),
      latitude: lat,
      longitude: lng,
      distance: dist,
      activity: selectedActivity.value,
    };
    await attendanceApi.teacherCheckIn(payload);
    showStatus("success", "Berhasil", "Check In berhasil!");
    // Reset states after successful check-in
    newShiftAllowed.value = false;
    selectedActivity.value = "";
    await fetchData();
  } catch (e) {
    let msg = e.message;
    if (e.code === 1) msg = "Izin lokasi ditolak.";
    else if (e.code === 2) msg = "Lokasi tidak tersedia.";
    else if (e.code === 3) msg = "Waktu permintaan lokasi habis.";

    showStatus("error", "Gagal Check In", msg || "Terjadi kesalahan");
  } finally {
    savingCheckIn.value = false;
  }
}

// Enable new shift (just sets the flag, doesn't auto check-in)
function enableNewShift() {
  newShiftAllowed.value = true;
  selectedActivity.value = "";
}

async function handleCheckOut() {
  savingCheckOut.value = true;
  try {
    // Force fresh location update
    const pos = await getCurrentPosition();
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    // Validate distance locally
    const dist = getDistanceFromLatLonInMeters(
      lat,
      lng,
      settings.value.latitude,
      settings.value.longitude
    );

    distance.value = dist;
    currentPos.value = { lat, lng };

    if (dist > settings.value.radius) {
      throw new Error(
        `Anda berada di luar radius absensi (${formatDistance(dist)})`
      );
    }

    const payload = {
      teacherId: currentTeacher.value?.id,
      checkOutTime: new Date().toTimeString().slice(0, 5),
      latitude: lat,
      longitude: lng,
      distance: dist,
    };
    await attendanceApi.teacherCheckOut(payload);
    showStatus("success", "Berhasil", "Check Out berhasil!");
    await fetchData();
  } catch (e) {
    let msg = e.message;
    if (e.code === 1) msg = "Izin lokasi ditolak.";
    else if (e.code === 2) msg = "Lokasi tidak tersedia.";
    else if (e.code === 3) msg = "Waktu permintaan lokasi habis.";

    showStatus("error", "Gagal Check Out", msg || "Terjadi kesalahan");
  } finally {
    savingCheckOut.value = false;
  }
}

async function startNewSession() {
  await handleCheckIn();
}

function startGeolocation() {
  if (!navigator.geolocation) {
    locationError.value = "Browser tidak mendukung Geolocation.";
    return;
  }

  geoId = navigator.geolocation.watchPosition(
    (pos) => {
      if (!isComponentMounted.value) return;
      currentPos.value = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      if (
        settings.value &&
        settings.value.latitude &&
        settings.value.longitude
      ) {
        distance.value = getDistanceFromLatLonInMeters(
          currentPos.value.lat,
          currentPos.value.lng,
          settings.value.latitude,
          settings.value.longitude
        );
      }
      locationError.value = "";
    },
    (err) => {
      if (!isComponentMounted.value) return;
      console.debug("WatchPosition Info:", err.message);
      // Only show visible error if we haven't locked location yet
      if (!currentPos.value) {
        locationError.value = "Sedang mencari lokasi... (" + err.message + ")";
      }
    },
    { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
  );
}

onMounted(async () => {
  isComponentMounted.value = true;
  await fetchUser();
  await fetchSettings();
  await fetchData();
  startGeolocation();
});

onUnmounted(() => {
  isComponentMounted.value = false;
  if (geoId) navigator.geolocation.clearWatch(geoId);
});
</script>
