<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4"
    >
      <div
        class="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col"
      >
        <!-- Header -->
        <div
          class="p-4 border-b flex justify-between items-center bg-gradient-to-r from-slate-50 to-slate-100"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-[#602515]/10 flex items-center justify-center"
            >
              <Icon :icon="headerIcon" class="text-xl text-[#602515]" />
            </div>
            <div>
              <h3 class="font-semibold text-slate-800 text-base sm:text-lg">
                {{ title }}
              </h3>
              <p class="text-xs text-slate-500">
                Klik item untuk menambah/menghapus
              </p>
            </div>
          </div>
          <button
            @click="$emit('close')"
            class="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Icon
              icon="solar:close-circle-line-duotone"
              class="text-xl text-slate-400 hover:text-slate-600"
            />
          </button>
        </div>

        <!-- Content - Stacked on mobile, side-by-side on larger screens -->
        <div class="flex-1 overflow-hidden flex flex-col md:flex-row">
          <!-- Left Panel: Available Items -->
          <div
            class="w-full md:w-1/2 border-b md:border-b-0 md:border-r flex flex-col h-[40vh] md:h-auto"
          >
            <div class="p-3 bg-green-50 border-b">
              <div class="flex items-center gap-2 mb-2">
                <Icon
                  icon="solar:users-group-rounded-line-duotone"
                  class="text-green-600"
                />
                <h4 class="font-medium text-sm text-green-700">
                  {{ availableTitle }}
                </h4>
              </div>
              <div class="relative">
                <Icon
                  icon="solar:magnifer-linear"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  v-model="searchAvailable"
                  type="text"
                  :placeholder="`Cari ${itemLabel}...`"
                  class="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
            </div>
            <div class="flex-1 overflow-auto p-2 bg-green-50/30">
              <div v-if="loadingAvailable" class="text-center py-8">
                <Icon
                  icon="solar:spinner-line-duotone"
                  class="text-3xl text-slate-400 animate-spin mx-auto mb-2"
                />
                <span class="text-sm text-slate-500">Memuat data...</span>
              </div>
              <div
                v-else-if="filteredAvailable.length === 0"
                class="text-center py-8"
              >
                <Icon
                  icon="solar:users-group-rounded-line-duotone"
                  class="text-4xl text-slate-300 mx-auto mb-2"
                />
                <span class="text-sm text-slate-400"
                  >Tidak ada data tersedia</span
                >
              </div>
              <div
                v-for="item in filteredAvailable"
                :key="item.id"
                @click="addItem(item)"
                class="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-green-100 active:bg-green-200 cursor-pointer border border-transparent hover:border-green-200 mb-1.5 transition-all bg-white shadow-sm"
              >
                <div class="min-w-0 flex-1">
                  <span
                    class="font-medium text-sm text-slate-800 block truncate"
                    >{{ item[displayField] }}</span
                  >
                  <span v-if="item[subField]" class="text-xs text-slate-500">{{
                    item[subField]
                  }}</span>
                  <span
                    v-if="metaField && item[metaField]"
                    class="block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 w-fit"
                  >
                    {{ item[metaField] }}
                  </span>
                </div>
                <div
                  class="ml-2 flex-shrink-0 w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center"
                >
                  <Icon
                    icon="solar:add-circle-bold-duotone"
                    class="text-green-600 text-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Right Panel: Selected Items -->
          <div class="w-full md:w-1/2 flex flex-col h-[40vh] md:h-auto">
            <div class="p-3 bg-blue-50 border-b">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <Icon
                    icon="solar:check-circle-bold-duotone"
                    class="text-blue-600"
                  />
                  <h4 class="font-medium text-sm text-blue-700">
                    {{ selectedTitle }}
                  </h4>
                </div>
                <span
                  class="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700"
                >
                  {{ selectedItems.length }}
                </span>
              </div>
              <div class="relative">
                <Icon
                  icon="solar:magnifer-linear"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  v-model="searchSelected"
                  type="text"
                  :placeholder="`Cari ${itemLabel}...`"
                  class="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            <div class="flex-1 overflow-auto p-2 bg-blue-50/30">
              <div v-if="loadingSelected" class="text-center py-8">
                <Icon
                  icon="solar:spinner-line-duotone"
                  class="text-3xl text-slate-400 animate-spin mx-auto mb-2"
                />
                <span class="text-sm text-slate-500">Memuat data...</span>
              </div>
              <div
                v-else-if="filteredSelected.length === 0"
                class="text-center py-8"
              >
                <Icon
                  icon="solar:inbox-line-duotone"
                  class="text-4xl text-slate-300 mx-auto mb-2"
                />
                <span class="text-sm text-slate-400">Belum ada anggota</span>
              </div>
              <div
                v-for="item in filteredSelected"
                :key="item.id"
                @click="removeItem(item)"
                class="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-red-50 active:bg-red-100 cursor-pointer border border-blue-200 hover:border-red-200 mb-1.5 transition-all bg-white shadow-sm"
              >
                <div class="min-w-0 flex-1">
                  <span
                    class="font-medium text-sm text-slate-800 block truncate"
                    >{{ getDisplayName(item) }}</span
                  >
                  <span
                    v-if="getSubDisplay(item)"
                    class="text-xs text-slate-500"
                    >{{ getSubDisplay(item) }}</span
                  >
                </div>
                <div
                  class="ml-2 flex-shrink-0 w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center"
                >
                  <Icon
                    icon="solar:minus-circle-bold-duotone"
                    class="text-red-500 text-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="p-3 border-t bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-2"
        >
          <div
            v-if="error"
            class="flex items-center gap-2 text-sm text-red-600"
          >
            <Icon icon="solar:danger-circle-bold-duotone" />
            {{ error }}
          </div>
          <div v-else class="hidden sm:block"></div>
          <button
            @click="$emit('close')"
            class="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            <Icon icon="solar:check-circle-bold-duotone" />
            Selesai
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
  show: Boolean,
  title: { type: String, default: "Kelola Anggota" },
  headerIcon: {
    type: String,
    default: "solar:users-group-rounded-bold-duotone",
  },
  availableTitle: { type: String, default: "Tersedia" },
  selectedTitle: { type: String, default: "Terpilih" },
  itemLabel: { type: String, default: "item" },
  availableItems: { type: Array, default: () => [] },
  selectedItems: { type: Array, default: () => [] },
  displayField: { type: String, default: "fullName" },
  subField: { type: String, default: null },
  metaField: { type: String, default: null },
  loadingAvailable: Boolean,
  loadingSelected: Boolean,
  error: { type: String, default: "" },
});

const emit = defineEmits(["close", "add", "remove"]);

const searchAvailable = ref("");
const searchSelected = ref("");

const filteredAvailable = computed(() => {
  const selectedIds = new Set(
    props.selectedItems.map((s) => s.studentId || s.teacherId || s.id)
  );
  return props.availableItems
    .filter((item) => !selectedIds.has(item.id))
    .filter((item) => {
      if (!searchAvailable.value) return true;
      const name = (item[props.displayField] || "").toLowerCase();
      return name.includes(searchAvailable.value.toLowerCase());
    });
});

const filteredSelected = computed(() => {
  return props.selectedItems.filter((item) => {
    if (!searchSelected.value) return true;
    const name = getDisplayName(item).toLowerCase();
    return name.includes(searchSelected.value.toLowerCase());
  });
});

function getDisplayName(item) {
  return (
    item.student?.fullName ||
    item.teacher?.fullName ||
    item[props.displayField] ||
    `#${item.id}`
  );
}

function getSubDisplay(item) {
  if (!props.subField) return null;
  return (
    item.student?.[props.subField] ||
    item.teacher?.[props.subField] ||
    item[props.subField]
  );
}

function addItem(item) {
  emit("add", item);
}
function removeItem(item) {
  emit("remove", item);
}
</script>
