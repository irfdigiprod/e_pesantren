<template>
  <div class="space-y-3">
    <!-- Search Input -->
    <div class="relative">
      <div
        class="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition"
      >
        <Icon icon="solar:magnifer-linear" class="text-slate-400" />
        <input
          ref="input"
          v-model="query"
          type="text"
          placeholder="Cari obat atau ketik manual..."
          class="flex-1 outline-none text-sm bg-transparent placeholder-slate-400 text-slate-700"
          @keydown.enter.prevent="handleEnter"
          @keydown.down.prevent="navigateResults(1)"
          @keydown.up.prevent="navigateResults(-1)"
          @input="isOpen = true"
          @focus="isOpen = true"
          @blur="handleBlur"
        />
      </div>

      <!-- Dropdown Results -->
      <div
        v-if="isOpen && (filteredMedicines.length > 0 || query)"
        class="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-100 z-50 max-h-60 overflow-y-auto"
      >
        <div v-if="filteredMedicines.length > 0">
          <div
            class="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 sticky top-0"
          >
            Stok Tersedia
          </div>
          <button
            v-for="(med, idx) in filteredMedicines"
            :key="med.id"
            class="w-full text-left px-4 py-2 hover:bg-slate-50 transition text-sm flex justify-between items-center group"
            :class="{ 'bg-slate-50': idx === activeIndex }"
            @mousedown.prevent="selectMedicine(med)"
          >
            <div class="flex flex-col">
              <span
                class="font-medium text-slate-700 group-hover:text-blue-600"
              >
                {{ med.name }}
              </span>
              <span class="text-xs text-slate-400"
                >{{ med.category }} • {{ med.unit }} <span v-if="med.pharmacyName">• Lokasi: {{ med.pharmacyName }}</span></span
              >
            </div>
            <span
              class="text-xs px-2 py-0.5 rounded-full"
              :class="
                med.stock > 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              "
            >
              Stok: {{ med.stock }}
            </span>
          </button>
        </div>

        <div v-if="query" class="border-t border-slate-100">
          <button
            class="w-full text-left px-4 py-2 hover:bg-amber-50 transition text-sm flex items-center gap-2 text-amber-700"
            @mousedown.prevent="addManual"
          >
            <Icon icon="solar:pen-new-square-linear" />
            <span
              >Tambah manual: "<strong>{{ query }}</strong
              >"</span
            >
          </button>
        </div>
      </div>
    </div>

    <!-- Selected Medicines List -->
    <div v-if="selectedItems.length > 0" class="space-y-2">
      <div
        v-for="(item, index) in selectedItems"
        :key="index"
        class="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg group"
      >
        <!-- Icon/Status -->
        <div
          class="w-8 h-8 flex items-center justify-center rounded-full shrink-0"
          :class="
            item.id
              ? 'bg-emerald-100 text-emerald-600'
              : 'bg-amber-100 text-amber-600'
          "
        >
          <Icon
            :icon="item.id ? 'solar:pill-bold' : 'solar:pen-new-square-bold'"
            class="text-lg"
          />
        </div>

        <!-- Details -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-700 truncate">
            {{ item.name }}
          </p>
          <p class="text-xs text-slate-500">
            {{ item.id ? "Dari Stok" : "Manual" }}
          </p>
        </div>

        <!-- Location Dropdown -->
        <div v-if="getLocations(item).length > 1" class="flex items-center gap-1.5 shrink-0">
          <label class="text-xs font-semibold text-slate-400">Apotik</label>
          <select
            :value="item.id"
            @change="(e) => changeLocation(index, Number(e.target.value))"
            class="px-2 py-1 text-xs border border-slate-200 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none max-w-[120px] truncate"
          >
            <option
              v-for="loc in getLocations(item)"
              :key="loc.id"
              :value="loc.id"
            >
              {{ loc.pharmacyName || 'Umum' }} (Stok: {{ loc.stock }})
            </option>
          </select>
        </div>
        <div v-else-if="getLocations(item).length === 1 && getLocations(item)[0].pharmacyName" class="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded shrink-0">
          Apotik: {{ getLocations(item)[0].pharmacyName }}
        </div>

        <!-- Quantity Input -->
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-400">Jml</label>
          <input
            v-model.number="item.quantity"
            type="number"
            min="1"
            class="w-16 px-2 py-1 text-sm border border-slate-200 rounded text-center focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
          <span v-if="item.unit" class="text-xs text-slate-400">{{
            item.unit
          }}</span>
        </div>

        <!-- Remove -->
        <button
          @click="removeItem(index)"
          class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
          title="Hapus"
        >
          <Icon icon="solar:trash-bin-trash-linear" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
  modelValue: {
    type: Array, // Expecting structured array: [{ id, name, quantity, unit }]
    default: () => [],
  },
  medicines: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue"]);

const query = ref("");
const isOpen = ref(false);
const activeIndex = ref(-1);
const input = ref(null);

const selectedItems = ref([]);

// Sync from prop
watch(
  () => props.modelValue,
  (val) => {
    if (JSON.stringify(val) !== JSON.stringify(selectedItems.value)) {
      selectedItems.value = [...val];
    }
  },
  { deep: true, immediate: true }
);

// Sync to prop
watch(
  selectedItems,
  (val) => {
    emit("update:modelValue", val);
  },
  { deep: true }
);

const filteredMedicines = computed(() => {
  if (!query.value) return [];
  const q = query.value.toLowerCase();
  
  // Filter out already selected NAMES to prevent duplicate entries of the same medicine
  const selectedNames = selectedItems.value.map((i) => i.name.toLowerCase()).filter(Boolean);
  
  const results = [];
  const seenNames = new Set();
  
  for (const m of props.medicines) {
    const lowerName = m.name.toLowerCase();
    if (lowerName.includes(q) && !selectedNames.includes(lowerName) && !seenNames.has(lowerName)) {
      results.push(m);
      seenNames.add(lowerName);
    }
  }
  return results.slice(0, 5);
});

function getLocations(item) {
  if (!item.id || item.isManual) return [];
  return props.medicines.filter(
    (m) => m.name.toLowerCase() === item.name.toLowerCase()
  );
}

function changeLocation(index, newId) {
  const selectedLoc = props.medicines.find(m => m.id === newId);
  if (selectedLoc) {
    selectedItems.value[index].id = selectedLoc.id;
    selectedItems.value[index].pharmacyName = selectedLoc.pharmacyName || null;
  }
}

function handleEnter() {
  if (activeIndex.value >= 0 && filteredMedicines.value[activeIndex.value]) {
    selectMedicine(filteredMedicines.value[activeIndex.value]);
  } else if (query.value.trim()) {
    addManual();
  }
}

function navigateResults(step) {
  const max = filteredMedicines.value.length - 1;
  activeIndex.value += step;
  if (activeIndex.value < -1) activeIndex.value = max;
  if (activeIndex.value > max) activeIndex.value = -1;
}

function selectMedicine(med) {
  selectedItems.value.push({
    id: med.id, // ID from DB
    name: med.name,
    quantity: 1,
    unit: med.unit || "pcs",
    isManual: false,
    pharmacyName: med.pharmacyName || null,
  });
  query.value = "";
  isOpen.value = false;
  activeIndex.value = -1;
  input.value?.focus();
}

function addManual() {
  if (query.value.trim()) {
    selectedItems.value.push({
      id: null,
      name: query.value.trim(),
      quantity: 1,
      unit: "pcs",
      isManual: true,
    });
    query.value = "";
    isOpen.value = false;
    activeIndex.value = -1;
    input.value?.focus();
  }
}

function removeItem(index) {
  selectedItems.value.splice(index, 1);
}

function handleBlur() {
  setTimeout(() => {
    isOpen.value = false;
  }, 200);
}
</script>
