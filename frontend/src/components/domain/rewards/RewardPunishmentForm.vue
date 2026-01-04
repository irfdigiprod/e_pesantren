<template>
  <div class="space-y-6">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Type Selection -->
      <!-- Type Selection -->
      <div class="grid grid-cols-2 gap-4">
        <button
          type="button"
          :disabled="mode === 'edit'"
          @click="setType('reward')"
          class="p-4 rounded-lg border-2 text-center transition-all flex flex-col items-center gap-2"
          :class="[
            form.type === 'reward'
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-slate-200 hover:bg-slate-50',
            mode === 'edit' ? 'opacity-50 cursor-not-allowed' : '',
          ]"
        >
          <Icon icon="solar:medal-star-bold-duotone" class="text-3xl" />
          <span class="font-bold">Penghargaan</span>
        </button>
        <button
          type="button"
          :disabled="mode === 'edit'"
          @click="setType('punishment')"
          class="p-4 rounded-lg border-2 text-center transition-all flex flex-col items-center gap-2"
          :class="[
            form.type === 'punishment'
              ? 'border-red-500 bg-red-50 text-red-700'
              : 'border-slate-200 hover:bg-slate-50',
            mode === 'edit' ? 'opacity-50 cursor-not-allowed' : '',
          ]"
        >
          <Icon icon="solar:danger-circle-bold-duotone" class="text-3xl" />
          <span class="font-bold">Pelanggaran</span>
        </button>
      </div>

      <!-- Student Selector -->
      <div class="relative">
        <label class="block text-sm font-medium text-slate-700 mb-1"
          >Cari Santri <span class="text-red-500">*</span></label
        >
        <div class="relative">
          <input
            type="text"
            v-model="studentSearch"
            @focus="showStudentDropdown = true"
            @input="onSearchStudent"
            placeholder="Ketikan nama atau NIS..."
            class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
          <Icon
            icon="solar:magnifer-line-duotone"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>

        <!-- Dropdown -->
        <div
          v-if="showStudentDropdown && filteredStudents.length > 0"
          class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          <div
            v-for="s in filteredStudents"
            :key="s.id"
            @click="addStudent(s)"
            class="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-0 flex items-center gap-3"
          >
            <div
              class="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex-shrink-0"
            >
              <img
                v-if="s.photo"
                :src="getImageUrl(s.photo)"
                class="w-full h-full object-cover"
              />
              <Icon
                v-else
                icon="solar:user-bold"
                class="w-full h-full p-1.5 text-slate-400"
              />
            </div>
            <div>
              <div class="font-medium text-slate-800">{{ s.fullName }}</div>
              <div class="text-xs text-slate-500">
                NIS: {{ s.nis }} | Kelas: {{ s.class?.name || "-" }}
              </div>
            </div>
          </div>
        </div>

        <!-- Selected Students -->
        <div
          v-if="selectedStudents.length > 0"
          class="mt-3 flex flex-wrap gap-2"
        >
          <div
            v-for="(s, idx) in selectedStudents"
            :key="s.id"
            class="bg-blue-50 border border-blue-100 text-blue-700 rounded-full px-3 py-1 text-sm flex items-center gap-2"
          >
            <span>{{ s.fullName }}</span>
            <button
              type="button"
              @click="removeStudent(idx)"
              class="hover:text-red-500"
            >
              <Icon icon="solar:close-circle-bold" />
            </button>
          </div>
        </div>
        <div v-else class="mt-1 text-xs text-slate-400">
          Belum ada santri dipilih. Anda bisa memilih lebih dari satu.
        </div>
      </div>

      <!-- Rule Selector -->
      <div class="relative">
        <label class="block text-sm font-medium text-slate-700 mb-1"
          >Pilih Aturan</label
        >
        <div class="relative">
          <input
            type="text"
            v-model="ruleSearch"
            @focus="showRuleDropdown = true"
            @input="onSearchRule"
            placeholder="Cari aturan atau ketik manual..."
            class="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
          <button
            v-if="form.ruleId"
            type="button"
            @click="clearRule"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
          >
            <Icon icon="solar:close-circle-bold" />
          </button>
          <Icon
            v-else
            icon="solar:magnifer-line-duotone"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>

        <!-- Rule Dropdown -->
        <div
          v-if="showRuleDropdown && filteredRules.length > 0"
          class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          <div
            v-for="r in filteredRules"
            :key="r.id"
            @click="selectRule(r)"
            class="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-0"
          >
            <div class="font-medium text-slate-800">
              [{{ r.category }}] {{ r.name }}
            </div>
            <div class="text-xs text-slate-500 flex justify-between">
              <span>{{ r.description || "Tidak ada deskripsi" }}</span>
              <span
                class="font-bold"
                :class="r.type === 'reward' ? 'text-green-600' : 'text-red-600'"
              >
                {{ r.defaultPoints }} Poin
              </span>
            </div>
          </div>
        </div>

        <div
          v-if="!form.ruleId && ruleSearch"
          class="mt-1 text-xs text-slate-500"
        >
          Tekan enter atau biarkan untuk input manual:
          <strong>{{ ruleSearch }}</strong>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Points -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >Poin <span class="text-red-500">*</span></label
          >
          <input
            v-model.number="form.points"
            type="number"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        <!-- Date -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >Tanggal <span class="text-red-500">*</span></label
          >
          <input
            v-model="form.date"
            type="date"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
      </div>

      <!-- Description/Notes -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1"
          >Catatan / Deskripsi</label
        >
        <textarea
          v-model="form.notes"
          rows="3"
          class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          placeholder="Tambahkan detail kejadian..."
        ></textarea>
      </div>

      <!-- Image Upload -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2"
          >Bukti Foto (Maks 5)</label
        >

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
          <!-- Preview Images -->
          <div
            v-for="(img, idx) in previewImages"
            :key="idx"
            class="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group"
          >
            <!-- Handle both local preview and existing images -->
            <img
              :src="img.url || getImageUrl(img.path)"
              class="w-full h-full object-cover"
            />
            <button
              type="button"
              @click="removeImage(idx)"
              class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Icon icon="solar:trash-bin-trash-bold" class="text-sm" />
            </button>
            <div
              v-if="img.uploading"
              class="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <Icon
                icon="svg-spinners:ring-resize"
                class="text-white text-2xl"
              />
            </div>
          </div>

          <!-- Add Button -->
          <button
            v-if="previewImages.length < 5"
            type="button"
            @click="triggerUpload"
            class="aspect-square rounded-lg border-2 border-dashed border-slate-300 hover:border-primary hover:bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary transition-colors"
          >
            <Icon icon="solar:camera-add-bold" class="text-2xl" />
            <span class="text-xs">Upload</span>
          </button>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="handleFileSelect"
        />
        <p class="text-xs text-slate-500">
          Format: JPG, PNG. Maks 5MB per file.
        </p>
      </div>

      <!-- Submit -->
      <div class="flex justify-end pt-4 border-t gap-3">
        <button
          v-if="mode === 'edit'"
          type="button"
          @click="$emit('cancel')"
          class="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
        >
          Batal
        </button>
        <button
          type="submit"
          :disabled="submitting || uploading"
          class="px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <Icon v-if="submitting" icon="svg-spinners:ring-resize" />
          <Icon v-else icon="solar:diskette-bold" />
          {{ submitting ? "Menyimpan..." : "Simpan Data" }}
        </button>
      </div>
    </form>

    <StatusModal
      :isOpen="statusModal.isOpen"
      :type="statusModal.status"
      :title="statusModal.title"
      :message="statusModal.message"
      @close="statusModal.isOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { Icon } from "@iconify/vue";
import StatusModal from "@/components/ui/StatusModal.vue";
import { uploadFile as apiUploadFile } from "@/services/api";

const props = defineProps({
  students: { type: Array, default: () => [] },
  rules: { type: Array, default: () => [] },
  mode: { type: String, default: "create" }, // 'create' or 'edit'
  initialData: { type: Object, default: null },
  submitting: { type: Boolean, default: false },
});

const emit = defineEmits(["submit", "cancel"]);

const studentSearch = ref("");
const showStudentDropdown = ref(false);
const filteredStudents = ref([]);
const selectedStudents = ref([]);

// Rule Search
const ruleSearch = ref("");
const showRuleDropdown = ref(false);
const filteredRules = ref([]);

const fileInput = ref(null);
const previewImages = ref([]); // { file, url, uploading, path }
const uploading = ref(false);

const statusModal = reactive({
  isOpen: false,
  status: "success",
  title: "",
  message: "",
});

const form = reactive({
  type: "reward", // 'reward' | 'punishment'
  ruleId: null,
  points: 0,
  date: new Date().toISOString().split("T")[0],
  notes: "",
  category: "",
  title: "",
});

const currentRules = computed(() => {
  return props.rules.filter((r) => r.type === form.type);
});

// Implementation
const getBaseUrl = () => import.meta.env.VITE_API_BASE_URL || "";
const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${getBaseUrl()}/api/${path}`;
};

// Populate form if initialData exists
watch(
  () => props.initialData,
  (newVal) => {
    if (newVal) {
      form.type = newVal.type;
      form.ruleId = newVal.ruleId;
      form.points = Math.abs(newVal.points);
      form.date = new Date(newVal.date).toISOString().split("T")[0];
      form.notes = newVal.description || newVal.notes || "";
      form.category = newVal.category;
      form.title = newVal.title;
      ruleSearch.value = newVal.title; // Set title search input

      // Set student
      if (newVal.student) {
        selectedStudents.value = [newVal.student];
      } else if (newVal.studentId) {
        const s = props.students.find((s) => s.id === newVal.studentId);
        if (s) selectedStudents.value = [s];
      }

      // Set images
      // Assuming images come as array of objects or strings?
      // Check backend: "pointImages" table. `with: { ... images ?? }`
      // Currently the backend getByID might need to include images.
      // For now, if images passed in initialData (which might need fetching logic in parent)
      if (newVal.images && Array.isArray(newVal.images)) {
        previewImages.value = newVal.images.map((img) => ({
          url: null,
          path: typeof img === "string" ? img : img.imageUrl,
          uploading: false,
        }));
      }
    }
  },
  { immediate: true }
);

function onSearchStudent() {
  if (!studentSearch.value) {
    filteredStudents.value = [];
    return;
  }
  const q = studentSearch.value.toLowerCase();
  filteredStudents.value = props.students
    .filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) || s.nis?.toLowerCase().includes(q)
    )
    .slice(0, 10);
  showStudentDropdown.value = true;
}

function addStudent(s) {
  // If edit mode, maybe restrict to one? Or just allow replace.
  // For now, allow multiple selection for Create.
  // user said "CRUD with same form", usually update is single record.
  if (props.mode === "edit") {
    selectedStudents.value = [s];
  } else {
    if (!selectedStudents.value.find((x) => x.id === s.id)) {
      selectedStudents.value.push(s);
    }
  }

  studentSearch.value = "";
  showStudentDropdown.value = false;
}

function removeStudent(idx) {
  selectedStudents.value.splice(idx, 1);
}

function setType(t) {
  if (form.type === t) return;
  form.type = t;
  form.ruleId = null;
  form.points = 0;
  form.title = "";
  form.category = "";
  ruleSearch.value = "";
}

function onSearchRule() {
  form.ruleId = null;
  form.title = ruleSearch.value;

  if (!ruleSearch.value) {
    filteredRules.value = [];
    return;
  }

  const q = ruleSearch.value.toLowerCase();
  filteredRules.value = currentRules.value
    .filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
    )
    .slice(0, 10);
  showRuleDropdown.value = true;
}

function selectRule(r) {
  form.ruleId = r.id;
  ruleSearch.value = r.name;
  form.points = r.defaultPoints;
  form.title = r.name;
  form.category = r.category;
  if (r.description && !form.notes) {
    form.notes = r.description;
  }
  showRuleDropdown.value = false;
}

function clearRule() {
  form.ruleId = null;
  ruleSearch.value = "";
  form.points = 0;
  form.title = "";
  form.category = "";
}

function triggerUpload() {
  fileInput.value.click();
}

async function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  if (previewImages.value.length + files.length > 5) {
    statusModal.status = "error";
    statusModal.title = "Gagal";
    statusModal.message = "Maksimal 5 foto.";
    statusModal.isOpen = true;
    return;
  }

  for (const file of files) {
    const preview = reactive({
      file,
      url: URL.createObjectURL(file), // Local preview
      uploading: true,
      path: null,
    });
    previewImages.value.push(preview);

    try {
      const res = await apiUploadFile(file);
      if (res && res.success && res.data && res.data.filePath) {
        preview.path = res.data.filePath;
      } else if (res && (res.path || (res.file && res.file.path))) {
        preview.path = res.path || res.file.path;
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      console.error(err);
      statusModal.status = "error";
      statusModal.title = "Gagal Upload";
      statusModal.message = "Gagal upload gambar: " + file.name;
      statusModal.isOpen = true;
      const idx = previewImages.value.indexOf(preview);
      if (idx > -1) previewImages.value.splice(idx, 1);
    } finally {
      preview.uploading = false;
    }
  }
  e.target.value = "";
}

function removeImage(idx) {
  previewImages.value.splice(idx, 1);
}

function handleSubmit() {
  // Validation
  if (selectedStudents.value.length === 0) {
    statusModal.status = "error";
    statusModal.title = "Gagal";
    statusModal.message = "Pilih santri terlebih dahulu";
    statusModal.isOpen = true;
    return;
  }
  if (!form.points && form.points !== 0) {
    statusModal.status = "error";
    statusModal.title = "Gagal";
    statusModal.message = "Poin harus diisi";
    statusModal.isOpen = true;
    return;
  }

  const payload = {
    formData: { ...form },
    students: selectedStudents.value,
    images: previewImages.value.map((p) => p.path).filter(Boolean),
  };

  emit("submit", payload);
}

// Expose reset
function resetForm() {
  Object.assign(form, {
    type: form.type, // Keep type
    ruleId: null,
    points: 0,
    date: new Date().toISOString().split("T")[0],
    notes: "",
    category: "",
    title: "",
  });
  studentSearch.value = "";
  ruleSearch.value = "";
  selectedStudents.value = [];
  previewImages.value = [];
}
defineExpose({ resetForm });

watch(
  () => studentSearch.value,
  (val) => {
    if (!val) showStudentDropdown.value = false;
  }
);
watch(
  () => ruleSearch.value,
  (val) => {
    if (!val) showRuleDropdown.value = false;
  }
);
</script>
