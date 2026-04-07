<template>
  <div class="p-6">
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Jadwal Pelajaran</h1>
        <p class="text-slate-500">
          Kelola jadwal pelajaran dengan fitur interaktif drag and drop.
        </p>
      </div>
      <div class="flex flex-col md:flex-row items-start md:items-center gap-3">
        <!-- New Academic Year Dropdown -->
        <div class="flex flex-col gap-1 w-full md:w-auto">
          <label
            class="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1"
            >Tahun Ajaran</label
          >
          <select
            v-model="selectedAcademicYear"
            class="border border-slate-200 p-2.5 rounded-xl bg-white min-w-[150px] shadow-sm focus:ring-2 focus:ring-[#f8ae19] focus:border-[#f8ae19] text-sm font-medium text-slate-700 transition-all hover:border-[#f8ae19]/50"
          >
            <option value="2023/2024">2023/2024</option>
            <option value="2024/2025">2024/2025</option>
            <option value="2025/2026">2025/2026</option>
          </select>
        </div>

        <!-- New Semester Dropdown -->
        <div class="flex flex-col gap-1 w-full md:w-auto">
          <label
            class="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1"
            >Semester</label
          >
          <select
            v-model="selectedSemester"
            class="border border-slate-200 p-2.5 rounded-xl bg-white min-w-[130px] shadow-sm focus:ring-2 focus:ring-[#f8ae19] focus:border-[#f8ae19] text-sm font-medium text-slate-700 transition-all hover:border-[#f8ae19]/50"
          >
            <option :value="1">Ganjil (1)</option>
            <option :value="2">Genap (2)</option>
          </select>
        </div>

        <!-- Existing Class Dropdown -->
        <div class="flex flex-col gap-1 w-full md:w-auto">
          <label
            class="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1"
            >Pilih Kelas</label
          >
          <select
            v-model="selectedClassId"
            class="border border-slate-200 p-2.5 rounded-xl bg-white min-w-[200px] shadow-sm focus:ring-2 focus:ring-[#602515] focus:border-[#602515] text-sm font-medium text-slate-700 transition-all hover:border-[#602515]/50"
          >
            <option value="" disabled>-- Pilih Kelas --</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Main Board -->
    <div
      v-if="selectedClassId"
      class="flex flex-col lg:flex-row gap-6 items-start"
    >
      <!-- Subjects Sidebar (Draggable) -->
      <div class="lg:w-1/4 w-full sticky top-6">
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <h2 class="font-bold text-slate-700 mb-2 flex items-center gap-2">
            <span
              class="w-8 h-8 rounded-lg bg-[#f8ae19]/10 text-[#f8ae19] flex items-center justify-center"
              >📚</span
            >
            Mata Pelajaran
          </h2>
          <p class="text-xs text-slate-500 mb-4">
            Seret (drag) mapel ke kolom hari di sebelah kanan.
          </p>
          <div
            class="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar"
          >
            <div
              v-for="sub in availableSubjects"
              :key="sub.id"
              class="p-3 border rounded-lg bg-slate-50 cursor-grab hover:bg-[#602515]/5 hover:border-[#602515]/20 transition-colors flex items-center gap-3 active:cursor-grabbing group relative overflow-hidden"
              :draggable="sub.hoursLeft > 0"
              @dragstart="onDragStart($event, sub)"
            >
              <div
                class="w-1.5 h-full absolute left-0 top-0 bg-[#f8ae19]"
              ></div>
              <div class="flex-1 pl-2">
                <p class="font-medium text-slate-700 text-sm leading-tight">
                  {{ sub.name }}
                </p>
                <div class="flex items-center justify-between mt-2">
                  <span class="text-xs text-slate-500 font-medium"
                    >Sisa:
                    <span class="text-[#602515] font-bold">{{
                      sub.hoursLeft
                    }}</span>
                    Jam</span
                  >
                  <!-- Jam Input Stepper -->
                  <div
                    class="flex items-center bg-white border border-slate-200 rounded overflow-hidden"
                    @click.stop
                  >
                    <button
                      @click="changeTargetHours(sub.id, -1)"
                      class="px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 hover:text-red-500 transition-colors disabled:opacity-30"
                      :disabled="sub.targetHours <= 1"
                    >
                      −
                    </button>
                    <span
                      class="px-2 py-0.5 text-xs font-bold text-slate-700 min-w-[24px] text-center border-x border-slate-100"
                      >{{ sub.targetHours }}</span
                    >
                    <button
                      @click="changeTargetHours(sub.id, 1)"
                      class="px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 hover:text-green-500 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-if="availableSubjects.length === 0"
              class="text-center text-sm text-slate-400 py-8 px-4 border-2 border-dashed border-slate-200 rounded-xl"
            >
              <span class="text-3xl mb-2 block text-slate-300">🎉</span>
              Semua jam tatap muka untuk kelas ini sudah dialokasikan ke jadwal!
            </div>
          </div>
        </div>
      </div>

      <!-- Timetable Grid -->
      <div class="lg:w-3/4 w-full overflow-x-auto pb-4 custom-scrollbar">
        <div class="flex gap-4 min-w-max">
          <div
            v-for="(dayName, dayIndex) in days"
            :key="dayIndex"
            class="w-64 flex-shrink-0 flex flex-col"
          >
            <!-- Header Hari -->
            <div
              class="bg-[#602515] text-white font-medium py-3 px-4 rounded-t-xl text-center shadow-sm"
            >
              {{ dayName }}
            </div>

            <!-- Drop Zone Hari -->
            <div
              class="flex-1 min-h-[500px] bg-slate-50 border-x border-b border-slate-200 rounded-b-xl p-3 flex flex-col gap-3 transition-colors relative"
              :class="{
                'bg-orange-50/50 border-[#f8ae19] border-dashed border-2':
                  dragTargetDay === dayIndex,
              }"
              @dragover.prevent="dragTargetDay = dayIndex"
              @dragleave.prevent="dragTargetDay = null"
              @drop="onDrop($event, dayIndex)"
            >
              <!-- Placeholder Kosong -->
              <div
                v-if="getSchedulesForDay(dayIndex).length === 0"
                class="absolute inset-x-3 top-3 bottom-3 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center pointer-events-none"
                :class="{
                  'border-[#f8ae19] bg-[#f8ae19]/5': dragTargetDay === dayIndex,
                }"
              >
                <span class="text-xs text-slate-400 font-medium"
                  >Tarik Mapel Kesini</span
                >
              </div>

              <!-- List Jadwal Card -->
              <div
                v-for="sch in getSchedulesForDay(dayIndex)"
                :key="sch.id"
                class="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-slate-300 cursor-pointer transition-all relative z-10"
                draggable="true"
                @dragstart="
                  onDragStart($event, { ...sch, isScheduleBlock: true })
                "
                @dragover.prevent
                @drop="onDropOnSchedule($event, sch)"
                @click="openEdit(sch)"
              >
                <!-- Drag Handle Hint -->
                <div
                  class="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-200 rounded-l-xl group-hover:bg-[#602515]/30 transition-colors"
                ></div>

                <div class="flex justify-between items-center mb-2 pl-2">
                  <span
                    class="text-xs font-bold text-[#602515] bg-[#602515]/10 px-2 py-1 rounded"
                  >
                    {{ sch.startTime?.substring(0, 5) }} -
                    {{ sch.endTime?.substring(0, 5) }}
                  </span>
                  <button
                    @click.stop="confirmDelete(sch)"
                    class="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
                <h4
                  class="font-bold text-slate-700 text-sm mb-2 leading-tight pl-2"
                >
                  {{ getSubjectName(sch.subjectId) }}
                </h4>
                <div
                  class="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-100 ml-2"
                >
                  <span class="text-slate-400">👤</span>
                  <span class="truncate font-medium">{{
                    getTeacherName(sch.teacherId)
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Close Main Board flex container -->

    <!-- Empty State / Not Selected -->
    <div
      v-else
      class="bg-white border rounded-xl p-16 flex flex-col items-center justify-center text-center mt-4"
    >
      <div
        class="w-24 h-24 bg-[#602515]/5 text-[#602515] rounded-full flex items-center justify-center text-4xl mb-6 ring-8 ring-[#602515]/5"
      >
        📅
      </div>
      <h3 class="text-2xl font-bold text-slate-800">
        Pilih Kelas Terlebih Dahulu
      </h3>
      <p class="text-slate-500 mt-3 max-w-md text-sm leading-relaxed">
        Silakan pilih kelas pada dropdown di bagian atas untuk melihat dan
        mengatur jadwal pelajaran kelas tersebut.
      </p>
    </div>

    <!-- Modal Form -->
    <div
      v-if="modal.show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div
        class="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden transform transition-all relative"
      >
        <div class="p-5 border-b flex justify-between items-center bg-slate-50">
          <h3 class="font-bold text-lg text-slate-800">
            {{
              modal.mode === "create"
                ? "Atur Jadwal Pelajaran"
                : "Edit Jadwal Pelajaran"
            }}
          </h3>
          <button
            @click="closeModal"
            class="text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 font-bold"
          >
            ✕
          </button>
        </div>
        <div class="p-6 space-y-5">
          <div
            class="bg-[#f8ae19]/10 text-slate-700 p-4 rounded-xl text-sm mb-4 border border-[#f8ae19]/20 shadow-inner"
          >
            <div class="flex flex-col gap-1">
              <span class="text-xs text-slate-500 font-medium"
                >Mata Pelajaran yang dipilih</span
              >
              <strong class="text-base text-[#602515]">{{
                getSubjectName(form.subjectId)
              }}</strong>
            </div>
            <div
              class="flex items-center gap-2 mt-3 pt-3 border-t border-[#f8ae19]/20"
            >
              <span class="text-xs text-slate-500 font-medium w-16">Hari:</span>
              <span
                class="font-semibold bg-white px-2 py-0.5 rounded text-slate-800 border border-slate-200"
                >{{ days[form.dayOfWeek] }}</span
              >
            </div>
            <div class="flex items-center gap-2 mt-2">
              <span class="text-xs text-slate-500 font-medium w-16"
                >Kelas:</span
              >
              <span
                class="font-semibold bg-white px-2 py-0.5 rounded text-slate-800 border border-slate-200"
                >{{ getClassName(form.classId) }}</span
              >
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5"
              >Guru Pengajar <span class="text-red-500">*</span></label
            >
            <select
              v-model="form.teacherId"
              class="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#f8ae19] focus:border-[#f8ae19] bg-slate-50 hover:bg-white transition-colors"
            >
              <option value="" disabled>-- Pilih Guru Pengajar --</option>
              <option v-for="t in teachers" :key="t.id" :value="t.id">
                {{ t.fullName }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5"
                >Jam Mulai <span class="text-red-500">*</span></label
              >
              <input
                v-model="form.startTime"
                type="time"
                class="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#f8ae19] focus:border-[#f8ae19] bg-slate-50 hover:bg-white transition-colors"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5"
                >Jam Selesai <span class="text-red-500">*</span></label
              >
              <input
                v-model="form.endTime"
                type="time"
                class="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#f8ae19] focus:border-[#f8ae19] bg-slate-50 hover:bg-white transition-colors"
              />
            </div>
          </div>
        </div>
        <div
          class="p-5 border-t bg-slate-50 flex gap-3 justify-end items-center"
        >
          <button
            @click="closeModal"
            class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-100 transition-colors mr-auto"
          >
            Batal
          </button>
          <button
            @click="submitForm"
            :disabled="saving"
            class="px-6 py-2.5 rounded-xl bg-[#602515] text-white font-medium text-sm hover:bg-[#4a1c10] shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            <span
              v-if="saving"
              class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            ></span>
            {{ saving ? "Menyimpan..." : "Simpan Jadwal" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Status Modal -->
    <StatusModal
      :isOpen="statusModal.show"
      :type="statusModal.type"
      :title="statusModal.title"
      :message="statusModal.message"
      @close="statusModal.show = false"
    />

    <!-- Confirm Modal -->
    <div
      v-if="confirmModal.show"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div
        class="bg-white max-w-sm w-full rounded-2xl shadow-xl overflow-hidden p-6 text-center transform transition-all"
      >
        <div
          class="mx-auto w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-slate-800 mb-2">Hapus Jadwal?</h3>
        <p class="text-sm text-slate-500 mb-6 leading-relaxed">
          Tindakan ini akan menghapus jadwal secara permanen. Anda yakin?
        </p>
        <div class="flex gap-3 justify-center">
          <button
            @click="confirmModal.show = false"
            class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            @click="executeDelete"
            class="px-5 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 shadow-md transition-colors"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import { academicApi, teachersApi } from "@/services/api.js";
import StatusModal from "@/components/ui/StatusModal.vue";

const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// Data states
const classes = ref([]);
const rawSubjects = ref([]);
const teachers = ref([]);
const allSchedules = ref([]);

// Modals
const statusModal = reactive({
  show: false,
  type: "error", // 'success' or 'error'
  title: "",
  message: "",
});

const confirmModal = reactive({
  show: false,
  scheduleIdToDelete: null,
});

// Sidebar Mapel Target Hours state
const targetHours = reactive({});

// UI states
const selectedClassId = ref("");
const selectedAcademicYear = ref("2024/2025");
const selectedSemester = ref(1);

const dragTargetDay = ref(null);
const saving = ref(false);

const modal = reactive({ show: false, mode: "create" });
const form = reactive({
  id: null,
  classId: "",
  subjectId: "",
  teacherId: "",
  dayOfWeek: 1, // Default Senin
  startTime: "08:00",
  endTime: "09:00",
  academicYear: "2024/2025",
  semester: 1,
});

// Computed schedules for current class
const classSchedules = computed(() => {
  if (!selectedClassId.value) return [];
  return allSchedules.value.filter(
    (s) => parseInt(s.classId) === parseInt(selectedClassId.value),
  );
});

// Computed available subjects (only those with Jam Tatap Muka > 0)
const scheduledHoursCount = computed(() => {
  const counts = {};
  classSchedules.value.forEach((sch) => {
    if (!counts[sch.subjectId]) {
      counts[sch.subjectId] = 0;
    }
    counts[sch.subjectId] += 1;
  });
  return counts;
});

const availableSubjects = computed(() => {
  return rawSubjects.value
    .map((sub) => {
      const target = targetHours[sub.id] || 0;
      const assigned = scheduledHoursCount.value[sub.id] || 0;
      const left = target - assigned;
      return { ...sub, hoursLeft: left, targetHours: target };
    })
    .filter((sub) => sub.hoursLeft > 0);
});

async function fetchMasterData() {
  try {
    const [clsRes, subRes, tchRes] = await Promise.all([
      academicApi.getClasses(),
      academicApi.getSubjects(),
      teachersApi.getAll(),
    ]);
    classes.value = Array.isArray(clsRes?.data) ? clsRes.data : [];

    const subs = Array.isArray(subRes?.data) ? subRes.data : [];
    rawSubjects.value = subs;

    // Initialize target hours from creditHours
    subs.forEach((sub) => {
      if (targetHours[sub.id] === undefined) {
        targetHours[sub.id] = sub.creditHours || 2;
      }
    });

    teachers.value = Array.isArray(tchRes?.data) ? tchRes.data : [];
  } catch (error) {
    showStatus("error", "Error API", "Gagal mengambil data referensi master.");
  }
}

async function fetchSchedules() {
  try {
    const params = {};
    if (selectedAcademicYear.value)
      params.academicYear = selectedAcademicYear.value;
    if (selectedSemester.value) params.semester = selectedSemester.value;

    const res = await academicApi.getSchedules(params);
    allSchedules.value = Array.isArray(res?.data) ? res.data : [];
  } catch (error) {
    showStatus("error", "Error API", "Gagal mengambil daftar jadwal.");
  }
}

// Logic: Modifying Target Hours Mapel
function changeTargetHours(subjectId, delta) {
  const current = targetHours[subjectId] || 0;
  const newValue = current + delta;
  if (newValue >= 0) {
    targetHours[subjectId] = newValue;
  }
}

// Helpers
const getSubjectName = (id) =>
  rawSubjects.value.find((s) => parseInt(s.id) === parseInt(id))?.name ||
  "Memuat...";
const getTeacherName = (id) =>
  teachers.value.find((t) => parseInt(t.id) === parseInt(id))?.fullName ||
  "Belum dipilih";
const getClassName = (id) =>
  classes.value.find((c) => parseInt(c.id) === parseInt(id))?.name || "-";
const getSchedulesForDay = (dayIndex) => {
  return classSchedules.value
    .filter((s) => parseInt(s.dayOfWeek) === dayIndex)
    .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
};

function showStatus(type, title, message) {
  statusModal.type = type;
  statusModal.title = title;
  statusModal.message = message;
  statusModal.show = true;
}

// Drag and Drop Callbacks
function onDragStart(event, subject) {
  event.dataTransfer.dropEffect = "move";
  event.dataTransfer.effectAllowed = "move";

  if (subject.isScheduleBlock) {
    // Dragging an existing schedule
    event.dataTransfer.setData("type", "schedule");
    event.dataTransfer.setData("scheduleId", subject.id);
  } else {
    // Dragging a new subject from sidebar
    event.dataTransfer.setData("type", "subject");
    event.dataTransfer.setData("subjectId", subject.id);
  }
}

async function onDrop(event, dayIndex) {
  dragTargetDay.value = null;
  const dragType = event.dataTransfer.getData("type");

  if (dragType === "subject") {
    // Logic for new subject from sidebar
    const subjectId = parseInt(event.dataTransfer.getData("subjectId"));
    if (!subjectId) return;

    // Set default times (e.g. from last schedule or default)
    const existingToday = getSchedulesForDay(dayIndex);
    let defaultStart = "07:30";
    let defaultEnd = "08:15";
    if (existingToday.length > 0) {
      // try to append after the last one
      const lastSch = existingToday[existingToday.length - 1];
      if (lastSch.endTime) {
        defaultStart = lastSch.endTime.substring(0, 5);

        // Add 45 minutes for default end time
        let [h, m] = defaultStart.split(":").map(Number);
        m += 45;
        if (m >= 60) {
          h += 1;
          m -= 60;
        }
        defaultEnd = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      }
    }

    // Open modal for new schedule
    modal.mode = "create";
    Object.assign(form, {
      id: null,
      classId: selectedClassId.value,
      subjectId: subjectId,
      teacherId: "",
      dayOfWeek: dayIndex,
      startTime: defaultStart,
      endTime: defaultEnd,
      academicYear: selectedAcademicYear.value,
      semester: selectedSemester.value,
    });
    modal.show = true;
  } else if (dragType === "schedule") {
    // Logic for moving an existing schedule to another day
    const scheduleId = parseInt(event.dataTransfer.getData("scheduleId"));
    if (!scheduleId) return;

    const existingSch = allSchedules.value.find((s) => s.id === scheduleId);
    if (!existingSch || existingSch.dayOfWeek === dayIndex) return; // Same day drag managed below using different logic if needed. For now, simple day change.

    // Move to different day with exactly matching times
    try {
      saving.value = true;
      const payload = {
        classId: parseInt(existingSch.classId),
        subjectId: parseInt(existingSch.subjectId),
        teacherId: parseInt(existingSch.teacherId),
        dayOfWeek: dayIndex,
        startTime: existingSch.startTime,
        endTime: existingSch.endTime,
        academicYear: selectedAcademicYear.value,
        semester: selectedSemester.value,
      };
      await academicApi.updateSchedule(scheduleId, payload);
      await fetchSchedules();
    } catch (error) {
      showStatus(
        "error",
        "Gagal Memindahkan Jadwal",
        error.message || "Bentrokan terdeteksi atau terjadi kesalahan sistem.",
      );
    } finally {
      saving.value = false;
    }
  }
}

// Drag re-ordering intra-day (Before/After another schedule)
async function onDropOnSchedule(event, targetSch) {
  // Prevent bubbling to day column
  event.stopPropagation();
  dragTargetDay.value = null;

  const dragType = event.dataTransfer.getData("type");
  if (dragType !== "schedule") return; // Only allow reordering of existing cards

  const draggedId = parseInt(event.dataTransfer.getData("scheduleId"));
  if (!draggedId || draggedId === targetSch.id) return; // Dropped on itself

  const draggedSch = allSchedules.value.find((s) => s.id === draggedId);
  if (!draggedSch) return;

  // Calculate new time: start at target's end time. And maintain duration.
  const oldStartMins = timeToMins(draggedSch.startTime);
  const oldEndMins = timeToMins(draggedSch.endTime);
  const duration = oldEndMins - oldStartMins;

  const newStart = targetSch.endTime.substring(0, 5);
  const newStartMins = timeToMins(newStart);
  const newEnd = minsToTime(newStartMins + duration);

  try {
    saving.value = true;
    const payload = {
      classId: parseInt(draggedSch.classId),
      subjectId: parseInt(draggedSch.subjectId),
      teacherId: parseInt(draggedSch.teacherId),
      dayOfWeek: targetSch.dayOfWeek,
      startTime: newStart,
      endTime: newEnd,
      academicYear: selectedAcademicYear.value,
      semester: selectedSemester.value,
    };
    await academicApi.updateSchedule(draggedId, payload);
    await fetchSchedules();
  } catch (error) {
    showStatus(
      "error",
      "Gagal Memindahkan Waktu",
      error.message || "Waktu bertabrakan dengan jadwal lainnya.",
    );
  } finally {
    saving.value = false;
  }
}

// Time Utils
function timeToMins(tStr) {
  if (!tStr) return 0;
  const [h, m] = tStr.split(":").map(Number);
  return h * 60 + m;
}

function minsToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function openEdit(sch) {
  modal.mode = "edit";
  Object.assign(form, {
    id: sch.id,
    classId: sch.classId,
    subjectId: sch.subjectId,
    teacherId: sch.teacherId,
    dayOfWeek: sch.dayOfWeek,
    startTime: sch.startTime ? sch.startTime.substring(0, 5) : "",
    endTime: sch.endTime ? sch.endTime.substring(0, 5) : "",
    academicYear: sch.academicYear || selectedAcademicYear.value,
    semester: sch.semester || selectedSemester.value,
  });
  modal.show = true;
}

function closeModal() {
  modal.show = false;
}

async function submitForm() {
  if (!form.teacherId || !form.startTime || !form.endTime) {
    return showStatus(
      "error",
      "Input Belum Lengkap",
      "Silakan pilih Guru Pengajar, Jam Mulai, dan Jam Selesai.",
    );
  }

  saving.value = true;
  try {
    const payload = {
      ...form,
      teacherId: parseInt(form.teacherId),
      classId: parseInt(form.classId),
      subjectId: parseInt(form.subjectId),
      dayOfWeek: parseInt(form.dayOfWeek),
      academicYear: selectedAcademicYear.value,
      semester: selectedSemester.value,
    };

    if (modal.mode === "edit") {
      await academicApi.updateSchedule(form.id, payload);
      showStatus(
        "success",
        "Berhasil!",
        "Jadwal pelajaran berhasil diperbarui.",
      );
    } else {
      await academicApi.createSchedule(payload);
      showStatus("success", "Berhasil!", "Jadwal pelajaran baru ditambahkan.");
    }

    await fetchSchedules();
    closeModal();
  } catch (error) {
    // This will catch the 400 Bad Request error from backend due to Anti-Clash logic!
    showStatus(
      "error",
      "Gagal Menyimpan",
      error.message || "Terjadi kesalahan!",
    );
  } finally {
    saving.value = false;
  }
}

function confirmDelete(sch) {
  confirmModal.scheduleIdToDelete = sch.id;
  confirmModal.show = true;
}

async function executeDelete() {
  if (!confirmModal.scheduleIdToDelete) return;

  try {
    await academicApi.deleteSchedule(confirmModal.scheduleIdToDelete);
    await fetchSchedules();
    confirmModal.show = false;
    showStatus("success", "Terhapus", "Jadwal telah dihapus.");
  } catch (error) {
    confirmModal.show = false;
    showStatus("error", "Error API", "Gagal menghapus jadwal.");
  }
}

watch([selectedClassId, selectedAcademicYear, selectedSemester], () => {
  fetchSchedules();
});

onMounted(async () => {
  await fetchMasterData();
  await fetchSchedules();
});
</script>

<style scoped>
/* Custom Scrollbar for better UX */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}
</style>
