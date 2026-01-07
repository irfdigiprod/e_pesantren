<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div
        class="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <!-- Header -->
        <div
          class="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10"
        >
          <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"
            >
              <Icon icon="solar:file-send-bold-duotone" class="text-lg" />
            </div>
            {{ title }}
          </h3>
          <button
            @click="closeModal"
            class="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <Icon icon="solar:close-circle-linear" class="text-xl" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto">
          <!-- Steps Indicator -->
          <div class="flex items-center justify-center mb-8">
            <div
              class="flex items-center"
              :class="{
                'text-green-600': step === 'upload',
                'text-slate-400': step !== 'upload',
              }"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-sm"
                :class="
                  step === 'upload'
                    ? 'border-green-600 bg-green-50'
                    : 'border-slate-300'
                "
              >
                1
              </div>
              <span class="ml-2 text-sm font-medium">Upload</span>
            </div>
            <div class="w-12 h-0.5 bg-slate-200 mx-2"></div>
            <div
              class="flex items-center"
              :class="{
                'text-green-600': step === 'preview',
                'text-slate-400': step !== 'preview',
              }"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-sm"
                :class="
                  step === 'preview'
                    ? 'border-green-600 bg-green-50'
                    : 'border-slate-300'
                "
              >
                2
              </div>
              <span class="ml-2 text-sm font-medium">Preview</span>
            </div>
            <div class="w-12 h-0.5 bg-slate-200 mx-2"></div>
            <div
              class="flex items-center"
              :class="{
                'text-green-600': step === 'result',
                'text-slate-400': step !== 'result',
              }"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-sm"
                :class="
                  step === 'result'
                    ? 'border-green-600 bg-green-50'
                    : 'border-slate-300'
                "
              >
                3
              </div>
              <span class="ml-2 text-sm font-medium">Hasil</span>
            </div>
          </div>

          <!-- Step 1: Upload -->
          <div v-if="step === 'upload'" class="space-y-4">
            <div
              class="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center transition-colors hover:border-green-400 hover:bg-green-50/30 cursor-pointer relative"
              @click="$refs.fileInput.click()"
              @drop.prevent="onFileDrop"
              @dragover.prevent
            >
              <input
                type="file"
                ref="fileInput"
                class="hidden"
                accept=".xlsx, .xls"
                @change="onFileSelect"
              />
              <div
                class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Icon
                  icon="solar:upload-minimalistic-bold-duotone"
                  class="text-3xl"
                />
              </div>
              <p class="text-lg font-medium text-slate-700 mb-1">
                {{ fileName || "Klik atau drop file Excel di sini" }}
              </p>
              <p class="text-sm text-slate-500">
                Format yang didukung: .xlsx, .xls
              </p>
            </div>

            <div
              class="bg-blue-50 p-4 rounded-lg flex gap-3 text-sm text-blue-700 border border-blue-100 items-start justify-between"
            >
              <div class="flex gap-3">
                <Icon
                  icon="solar:info-circle-bold-duotone"
                  class="text-xl flex-shrink-0 mt-0.5"
                />
                <div>
                  <p class="font-bold mb-1">Template Excel</p>
                  <p class="mb-2">
                    Gunakan file template agar lebih mudah dan sesuai format.
                  </p>
                  <p v-if="requiredColumns" class="text-xs opacity-80">
                    Kolom Wajib: {{ requiredColumns }}
                  </p>
                </div>
              </div>
              <button
                @click="downloadTemplate"
                class="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 flex-shrink-0"
              >
                <Icon icon="solar:download-minimalistic-bold-duotone" />
                Unduh Template
              </button>
            </div>
          </div>

          <!-- Step 2: Preview -->
          <template v-else-if="step === 'preview' && previewData">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div
                class="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center"
              >
                <div class="text-xs text-slate-500 mb-1">Total Data</div>
                <div class="text-2xl font-bold text-slate-700">
                  {{ previewData.totalRows }}
                </div>
              </div>
              <div
                class="p-3 bg-green-50 rounded-lg border border-green-100 text-center"
              >
                <div class="text-xs text-green-600 mb-1">Siap Import</div>
                <div class="text-2xl font-bold text-green-700">
                  {{ previewData.validRows }}
                </div>
              </div>
              <div
                class="p-3 bg-red-50 rounded-lg border border-red-100 text-center"
              >
                <div class="text-xs text-red-600 mb-1">Data Invalid</div>
                <div class="text-2xl font-bold text-red-700">
                  {{ previewData.invalidRows }}
                </div>
              </div>
              <!-- Optional Extra Stats, generic check -->
              <div
                v-if="previewData.duplicateNIP !== undefined"
                class="p-3 bg-amber-50 rounded-lg border border-amber-100 text-center"
              >
                <div class="text-xs text-amber-600 mb-1">Duplikat ID</div>
                <div class="text-2xl font-bold text-amber-700">
                  {{ previewData.duplicateNIP }}
                </div>
              </div>
            </div>

            <!-- Error List -->
            <div
              v-if="previewData.errors?.length > 0"
              class="mb-6 border border-red-200 rounded-lg overflow-hidden"
            >
              <div
                class="bg-red-50 px-4 py-2 text-sm font-bold text-red-700 border-b border-red-100 flex justify-between"
              >
                <span>Daftar Error ({{ previewData.errors.length }})</span>
                <span class="text-xs font-normal">Data ini akan dilewati</span>
              </div>
              <div class="max-h-40 overflow-y-auto p-0">
                <table class="w-full text-xs text-left">
                  <thead class="bg-red-50/50 text-red-900 sticky top-0">
                    <tr>
                      <th class="p-2 w-16">Baris</th>
                      <th class="p-2">Masalah</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-red-50">
                    <tr
                      v-for="(err, idx) in previewData.errors"
                      :key="idx"
                      class="hover:bg-red-50/30"
                    >
                      <td class="p-2 text-center">{{ err.row }}</td>
                      <td class="p-2 text-red-600">
                        <span v-if="err.nip" class="font-mono mr-1"
                          >[{{ err.nip }}]</span
                        >
                        {{ err.error }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Valid Data Preview -->
            <div
              v-if="previewData.validData?.length > 0"
              class="border border-slate-200 rounded-lg overflow-hidden"
            >
              <div
                class="bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 border-b border-slate-200"
              >
                Preview Data Valid ({{ previewData.validData.length }}
                item)
              </div>
              <div class="max-h-48 overflow-y-auto">
                <table class="w-full text-xs text-left">
                  <thead class="bg-slate-50 text-slate-600 sticky top-0">
                    <!-- If slot provided use it, else try generic render -->
                    <slot name="preview-columns">
                      <tr>
                        <th
                          v-for="key in Object.keys(
                            previewData.validData[0]
                          ).slice(0, 4)"
                          :key="key"
                          class="p-2 font-medium capitalize"
                        >
                          {{ key }}
                        </th>
                      </tr>
                    </slot>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr
                      v-for="(item, i) in previewData.validData.slice(0, 10)"
                      :key="i"
                      class="hover:bg-slate-50"
                    >
                      <!-- Generic render fallback if no slot mechanism used for rows. 
                           However, standard slot mechanism for table rows is tricky here because we iterate inside. 
                           For now, let's just do generic iteration of first few keys or rely on component usage to pass a table?
                           
                           Actually, to make it truly reusable, we should probably just render the keys generically 
                           OR allow passing column definitions.
                           For simplicity, let's render the first 5 keys.
                      -->
                      <td
                        v-for="key in Object.keys(
                          previewData.validData[0]
                        ).slice(0, 4)"
                        :key="key"
                        class="p-2"
                      >
                        {{ item[key] }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div
                  v-if="previewData.validData.length > 10"
                  class="px-4 py-2 bg-slate-50 text-xs text-center text-slate-500 border-t border-slate-100"
                >
                  ... dan
                  {{ previewData.validData.length - 10 }} data lainnya
                </div>
              </div>
            </div>
          </template>

          <!-- Step 3: Result -->
          <template v-else-if="step === 'result' && resultData">
            <div class="p-6 text-center">
              <div
                class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600"
              >
                <Icon icon="solar:check-circle-bold-duotone" class="text-5xl" />
              </div>
              <h4 class="text-xl font-bold text-slate-800 mb-2">
                Import Selesai!
              </h4>
              <p class="text-slate-600 mb-6">
                Proses import data telah selesai dilakukan.
              </p>

              <div class="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <div class="p-4 bg-green-50 rounded-lg border border-green-100">
                  <div class="text-3xl font-bold text-green-700 mb-1">
                    {{ resultData.success }}
                  </div>
                  <div class="text-sm font-medium text-green-800">Berhasil</div>
                </div>
                <div class="p-4 bg-red-50 rounded-lg border border-red-100">
                  <div class="text-3xl font-bold text-red-700 mb-1">
                    {{ resultData.failed }}
                  </div>
                  <div class="text-sm font-medium text-red-800">Gagal</div>
                </div>
              </div>

              <div
                v-if="resultData.errors?.length > 0"
                class="mt-6 text-left border border-slate-200 rounded-lg p-4 bg-slate-50"
              >
                <p class="font-bold text-sm text-slate-700 mb-2">
                  Detail Error:
                </p>
                <ul
                  class="text-xs text-red-600 space-y-1 list-disc pl-4 max-h-32 overflow-y-auto"
                >
                  <li v-for="(err, idx) in resultData.errors" :key="idx">
                    Baris {{ err.row }}: {{ err.error }}
                  </li>
                </ul>
              </div>
            </div>
          </template>

          <!-- Global Error Message -->
          <div
            v-if="error"
            class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
          >
            {{ error }}
          </div>
        </div>

        <!-- Footer -->
        <div
          class="px-6 py-4 border-t bg-slate-50 flex items-center justify-between"
        >
          <button
            v-if="step === 'preview'"
            @click="step = 'upload'"
            class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors text-sm"
          >
            ← Kembali
          </button>
          <div v-else></div>
          <!-- Spacer -->

          <div class="flex gap-2">
            <button
              @click="closeModal"
              class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors text-sm border border-slate-200 bg-white"
            >
              {{ step === "result" ? "Tutup" : "Batal" }}
            </button>

            <button
              v-if="step === 'upload'"
              @click="previewImport"
              :disabled="!file || loading"
              class="px-4 py-2 bg-slate-800 text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-900 flex items-center gap-2"
            >
              <Icon
                v-if="loading"
                icon="solar:spinner-line-duotone"
                class="animate-spin"
              />
              Preview Data
            </button>

            <button
              v-if="step === 'preview'"
              @click="confirmImport"
              :disabled="loading || previewData?.validRows === 0"
              class="px-4 py-2 bg-[#602515] text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4a1d10] flex items-center gap-2"
            >
              <Icon
                v-if="loading"
                icon="solar:spinner-line-duotone"
                class="animate-spin"
              />
              Mulai Import
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch } from "vue";
import { Icon } from "@iconify/vue";
import * as XLSX from "xlsx";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: "Import Data",
  },
  // Function returning Promise({ success, data: { totalRows, validRows, invalidRows, errors, validData } })
  apiPreview: {
    type: Function,
    required: true,
  },
  // Function returning Promise({ success, data: { success, failed, errors } })
  apiImport: {
    type: Function,
    required: true,
  },
  // Array of objects for template generation
  templateHeader: {
    type: Array,
    required: true,
  },
  templateName: {
    type: String,
    default: "template_import",
  },
  requiredColumns: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:isOpen", "success"]);

const step = ref("upload"); // upload | preview | result
const file = ref(null);
const fileName = ref("");
const loading = ref(false);
const error = ref("");
const previewData = ref(null);
const resultData = ref(null);
const fileInput = ref(null);

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      resetState();
    }
  }
);

function resetState() {
  step.value = "upload";
  file.value = null;
  fileName.value = "";
  loading.value = false;
  error.value = "";
  previewData.value = null;
  resultData.value = null;
  if (fileInput.value) fileInput.value.value = "";
}

function closeModal() {
  if (step.value === "result") {
    emit("success");
  }
  emit("update:isOpen", false);
}

function onFileSelect(event) {
  const f = event.target.files[0];
  if (f) handleFile(f);
}

function onFileDrop(event) {
  const f = event.dataTransfer.files[0];
  if (f) handleFile(f);
}

function handleFile(f) {
  const validTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];
  if (!validTypes.includes(f.type) && !f.name.match(/\.xls(x)?$/)) {
    error.value = "Format file tidak didukung. Gunakan .xlsx atau .xls";
    return;
  }
  file.value = f;
  fileName.value = f.name;
  error.value = "";
}

async function previewImport() {
  if (!file.value) return;

  loading.value = true;
  error.value = "";

  try {
    // API endpoint expects FormData with 'file'
    const formData = new FormData();
    formData.append("file", file.value);

    // Call layout prop function
    const res = await props.apiPreview(formData);

    if (res.success) {
      previewData.value = res.data;
      step.value = "preview";
    } else {
      error.value = res.message || "Gagal memproses file";
    }
  } catch (err) {
    console.error(err);
    error.value = err.message || "Terjadi kesalahan saat upload";
  } finally {
    loading.value = false;
  }
}

async function confirmImport() {
  if (!file.value) return;

  loading.value = true;
  error.value = "";

  try {
    const formData = new FormData();
    formData.append("file", file.value);

    const res = await props.apiImport(formData);

    if (res.success) {
      resultData.value = res.data;
      step.value = "result";
    } else {
      error.value = res.message || "Gagal melakukan import";
    }
  } catch (err) {
    console.error(err);
    error.value = err.message || "Terjadi kesalahan saat import";
  } finally {
    loading.value = false;
  }
}

function downloadTemplate() {
  if (!props.templateHeader || props.templateHeader.length === 0) return;

  let ws;

  // Check if it's a Column Definition (has .header) or Data Row (Example Data)
  const isColumnDef =
    props.templateHeader[0] &&
    Object.prototype.hasOwnProperty.call(props.templateHeader[0], "header");

  if (isColumnDef) {
    // Extract headers from definitions
    const headers = props.templateHeader.map((col) => col.header);
    ws = XLSX.utils.aoa_to_sheet([headers]);
    // Apply defined widths
    ws["!cols"] = props.templateHeader.map((col) => ({
      wch: col.width || 15,
    }));
  } else {
    // Use the data itself as the template (with header row from keys)
    ws = XLSX.utils.json_to_sheet(props.templateHeader);
    // Auto-width columns based on header length
    if (props.templateHeader[0]) {
      const keys = Object.keys(props.templateHeader[0]);
      ws["!cols"] = keys.map((key) => ({ wch: Math.max(key.length + 5, 20) }));
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, `${props.templateName}.xlsx`);
}
</script>
