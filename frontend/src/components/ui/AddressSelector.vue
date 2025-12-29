<template>
  <div class="space-y-4">
    <label v-if="label" class="block text-sm font-medium text-slate-700 mb-2">
      {{ label }}
    </label>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Provinsi -->
      <div class="relative">
        <label class="block text-xs font-medium text-slate-600 mb-1">
          Provinsi
        </label>
        <div class="relative">
          <input
            type="text"
            :value="provinceDisplayValue"
            @input="searchProvince = $event.target.value"
            @focus="handleFocus('province')"
            @blur="handleBlur('province')"
            :placeholder="'Pilih Provinsi...'"
            :disabled="disabled || loadingProvinces"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm"
            :class="{ 'bg-slate-50': disabled || loadingProvinces }"
          />
          <Icon
            v-if="loadingProvinces"
            icon="solar:spinner-bold"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin"
          />
          <Icon
            v-else
            icon="solar:alt-arrow-down-linear"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          />
        </div>
        <!-- Dropdown -->
        <div
          v-if="showProvinceDropdown && filteredProvinces.length > 0"
          class="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          <div
            v-for="prov in filteredProvinces"
            :key="prov.code"
            @mousedown.prevent="selectProvince(prov)"
            class="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm border-b border-slate-50 last:border-0"
          >
            {{ prov.name }}
          </div>
        </div>
      </div>

      <!-- Kabupaten/Kota -->
      <div class="relative">
        <label class="block text-xs font-medium text-slate-600 mb-1">
          Kabupaten/Kota
        </label>
        <div class="relative">
          <input
            type="text"
            :value="regencyDisplayValue"
            @input="searchRegency = $event.target.value"
            @focus="handleFocus('regency')"
            @blur="handleBlur('regency')"
            :placeholder="'Pilih Kabupaten/Kota...'"
            :disabled="disabled || !selectedProvince || loadingRegencies"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm"
            :class="{
              'bg-slate-50': disabled || !selectedProvince || loadingRegencies,
            }"
          />
          <Icon
            v-if="loadingRegencies"
            icon="solar:spinner-bold"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin"
          />
          <Icon
            v-else
            icon="solar:alt-arrow-down-linear"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          />
        </div>
        <!-- Dropdown -->
        <div
          v-if="showRegencyDropdown && filteredRegencies.length > 0"
          class="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          <div
            v-for="reg in filteredRegencies"
            :key="reg.code"
            @mousedown.prevent="selectRegency(reg)"
            class="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm border-b border-slate-50 last:border-0"
          >
            {{ reg.name }}
          </div>
        </div>
      </div>

      <!-- Kecamatan -->
      <div class="relative">
        <label class="block text-xs font-medium text-slate-600 mb-1">
          Kecamatan
        </label>
        <div class="relative">
          <input
            type="text"
            :value="districtDisplayValue"
            @input="searchDistrict = $event.target.value"
            @focus="handleFocus('district')"
            @blur="handleBlur('district')"
            :placeholder="'Pilih Kecamatan...'"
            :disabled="disabled || !selectedRegency || loadingDistricts"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm"
            :class="{
              'bg-slate-50': disabled || !selectedRegency || loadingDistricts,
            }"
          />
          <Icon
            v-if="loadingDistricts"
            icon="solar:spinner-bold"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin"
          />
          <Icon
            v-else
            icon="solar:alt-arrow-down-linear"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          />
        </div>
        <!-- Dropdown -->
        <div
          v-if="showDistrictDropdown && filteredDistricts.length > 0"
          class="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          <div
            v-for="dist in filteredDistricts"
            :key="dist.code"
            @mousedown.prevent="selectDistrict(dist)"
            class="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm border-b border-slate-50 last:border-0"
          >
            {{ dist.name }}
          </div>
        </div>
      </div>

      <!-- Desa/Kelurahan -->
      <div class="relative">
        <label class="block text-xs font-medium text-slate-600 mb-1">
          Desa/Kelurahan
        </label>
        <div class="relative">
          <input
            type="text"
            :value="villageDisplayValue"
            @input="searchVillage = $event.target.value"
            @focus="handleFocus('village')"
            @blur="handleBlur('village')"
            :placeholder="'Pilih Desa/Kelurahan...'"
            :disabled="disabled || !selectedDistrict || loadingVillages"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm"
            :class="{
              'bg-slate-50': disabled || !selectedDistrict || loadingVillages,
            }"
          />
          <Icon
            v-if="loadingVillages"
            icon="solar:spinner-bold"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin"
          />
          <Icon
            v-else
            icon="solar:alt-arrow-down-linear"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          />
        </div>
        <!-- Dropdown -->
        <div
          v-if="showVillageDropdown && filteredVillages.length > 0"
          class="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          <div
            v-for="vil in filteredVillages"
            :key="vil.code"
            @mousedown.prevent="selectVillage(vil)"
            class="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm border-b border-slate-50 last:border-0"
          >
            {{ vil.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Address -->
    <div>
      <label class="block text-xs font-medium text-slate-600 mb-1">
        Alamat Lengkap (Detail)
      </label>
      <textarea
        v-model="addressDetail"
        rows="2"
        :disabled="disabled"
        class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm resize-none"
        :class="{ 'bg-slate-50': disabled }"
        placeholder="Nama Jalan, Nomor, RT/RW, Dusun/Kampung..."
        @input="emitValue"
      ></textarea>
    </div>

    <!-- Postal Code -->
    <div class="w-40">
      <label class="block text-xs font-medium text-slate-600 mb-1">
        Kode Pos
      </label>
      <input
        type="text"
        v-model="postalCode"
        :disabled="disabled"
        class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm"
        :class="{ 'bg-slate-50': disabled }"
        placeholder="Kode Pos"
        maxlength="5"
        @input="emitValue"
      />
    </div>

    <!-- Full Address Display -->
    <div
      v-if="fullAddress"
      class="p-3 bg-slate-50 rounded-lg text-sm text-slate-600"
    >
      <span class="font-medium text-slate-700">Alamat lengkap:</span>
      {{ fullAddress }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      province: null,
      regency: null,
      district: null,
      village: null,
      addressDetail: "",
      postalCode: "",
    }),
  },
  label: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

// API Base URL - use backend proxy to avoid CORS issues
const VITE_API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const API_BASE = `${VITE_API_BASE}/api/wilayah`;

// Data stores
const provinces = ref([]);
const regencies = ref([]);
const districts = ref([]);
const villages = ref([]);

// Selected values
const selectedProvince = ref(null);
const selectedRegency = ref(null);
const selectedDistrict = ref(null);
const selectedVillage = ref(null);

// Additional address fields
const addressDetail = ref("");
const postalCode = ref("");

// Search inputs
const searchProvince = ref("");
const searchRegency = ref("");
const searchDistrict = ref("");
const searchVillage = ref("");

// Dropdown visibility
const showProvinceDropdown = ref(false);
const showRegencyDropdown = ref(false);
const showDistrictDropdown = ref(false);
const showVillageDropdown = ref(false);

// Loading states
const loadingProvinces = ref(false);
const loadingRegencies = ref(false);
const loadingDistricts = ref(false);
const loadingVillages = ref(false);

// Filtered lists
const filteredProvinces = computed(() => {
  const query = searchProvince.value.toLowerCase();
  return provinces.value.filter((p) => p.name.toLowerCase().includes(query));
});

const filteredRegencies = computed(() => {
  const query = searchRegency.value.toLowerCase();
  return regencies.value.filter((r) => r.name.toLowerCase().includes(query));
});

const filteredDistricts = computed(() => {
  const query = searchDistrict.value.toLowerCase();
  return districts.value.filter((d) => d.name.toLowerCase().includes(query));
});

const filteredVillages = computed(() => {
  const query = searchVillage.value.toLowerCase();
  return villages.value.filter((v) => v.name.toLowerCase().includes(query));
});

// Full address computed
const fullAddress = computed(() => {
  const parts = [];

  // Add detail address first
  if (addressDetail.value) parts.push(addressDetail.value);

  // Add region parts
  if (selectedVillage.value) parts.push(selectedVillage.value.name);
  if (selectedDistrict.value) parts.push("Kec. " + selectedDistrict.value.name);
  if (selectedRegency.value) parts.push(selectedRegency.value.name);
  if (selectedProvince.value) parts.push(selectedProvince.value.name);

  // Add postal code at the end
  if (postalCode.value) parts.push(postalCode.value);

  return parts.join(", ");
});

// Display values - show search text when focused/typing, otherwise show selected value
const isProvinceEditing = ref(false);
const isRegencyEditing = ref(false);
const isDistrictEditing = ref(false);
const isVillageEditing = ref(false);

const provinceDisplayValue = computed(() => {
  if (isProvinceEditing.value) return searchProvince.value;
  return selectedProvince.value?.name || "";
});

const regencyDisplayValue = computed(() => {
  if (isRegencyEditing.value) return searchRegency.value;
  return selectedRegency.value?.name || "";
});

const districtDisplayValue = computed(() => {
  if (isDistrictEditing.value) return searchDistrict.value;
  return selectedDistrict.value?.name || "";
});

const villageDisplayValue = computed(() => {
  if (isVillageEditing.value) return searchVillage.value;
  return selectedVillage.value?.name || "";
});

// Focus handler - switch to editing mode
function handleFocus(type) {
  if (type === "province") {
    isProvinceEditing.value = true;
    searchProvince.value = "";
    showProvinceDropdown.value = true;
  }
  if (type === "regency") {
    isRegencyEditing.value = true;
    searchRegency.value = "";
    showRegencyDropdown.value = true;
  }
  if (type === "district") {
    isDistrictEditing.value = true;
    searchDistrict.value = "";
    showDistrictDropdown.value = true;
  }
  if (type === "village") {
    isVillageEditing.value = true;
    searchVillage.value = "";
    showVillageDropdown.value = true;
  }
}

// API Fetch functions
async function fetchProvinces() {
  loadingProvinces.value = true;
  try {
    const res = await fetch(`${API_BASE}/provinces`);
    const data = await res.json();
    provinces.value = data.data || [];
  } catch (e) {
    console.error("Failed to fetch provinces:", e);
  } finally {
    loadingProvinces.value = false;
  }
}

async function fetchRegencies(provinceCode) {
  loadingRegencies.value = true;
  regencies.value = [];
  try {
    const res = await fetch(`${API_BASE}/regencies/${provinceCode}`);
    const data = await res.json();
    regencies.value = data.data || [];
  } catch (e) {
    console.error("Failed to fetch regencies:", e);
  } finally {
    loadingRegencies.value = false;
  }
}

async function fetchDistricts(regencyCode) {
  loadingDistricts.value = true;
  districts.value = [];
  try {
    const res = await fetch(`${API_BASE}/districts/${regencyCode}`);
    const data = await res.json();
    districts.value = data.data || [];
  } catch (e) {
    console.error("Failed to fetch districts:", e);
  } finally {
    loadingDistricts.value = false;
  }
}

async function fetchVillages(districtCode) {
  loadingVillages.value = true;
  villages.value = [];
  try {
    const res = await fetch(`${API_BASE}/villages/${districtCode}`);
    const data = await res.json();
    villages.value = data.data || [];
  } catch (e) {
    console.error("Failed to fetch villages:", e);
  } finally {
    loadingVillages.value = false;
  }
}

// Selection handlers
function selectProvince(prov) {
  selectedProvince.value = prov;
  searchProvince.value = "";
  showProvinceDropdown.value = false;
  isProvinceEditing.value = false; // Immediately show selected value

  // Reset dependent selections
  selectedRegency.value = null;
  selectedDistrict.value = null;
  selectedVillage.value = null;
  regencies.value = [];
  districts.value = [];
  villages.value = [];

  // Fetch regencies
  fetchRegencies(prov.code);
  emitValue();
}

function selectRegency(reg) {
  selectedRegency.value = reg;
  searchRegency.value = "";
  showRegencyDropdown.value = false;
  isRegencyEditing.value = false; // Immediately show selected value

  // Reset dependent selections
  selectedDistrict.value = null;
  selectedVillage.value = null;
  districts.value = [];
  villages.value = [];

  // Fetch districts
  fetchDistricts(reg.code);
  emitValue();
}

function selectDistrict(dist) {
  selectedDistrict.value = dist;
  searchDistrict.value = "";
  showDistrictDropdown.value = false;
  isDistrictEditing.value = false; // Immediately show selected value

  // Reset dependent selections
  selectedVillage.value = null;
  villages.value = [];

  // Fetch villages
  fetchVillages(dist.code);
  emitValue();
}

function selectVillage(vil) {
  selectedVillage.value = vil;
  searchVillage.value = "";
  showVillageDropdown.value = false;
  isVillageEditing.value = false; // Immediately show selected value
  emitValue();
}

function handleBlur(type) {
  setTimeout(() => {
    if (type === "province") {
      showProvinceDropdown.value = false;
      isProvinceEditing.value = false;
    }
    if (type === "regency") {
      showRegencyDropdown.value = false;
      isRegencyEditing.value = false;
    }
    if (type === "district") {
      showDistrictDropdown.value = false;
      isDistrictEditing.value = false;
    }
    if (type === "village") {
      showVillageDropdown.value = false;
      isVillageEditing.value = false;
    }
  }, 200);
}

function emitValue() {
  emit("update:modelValue", {
    province: selectedProvince.value,
    regency: selectedRegency.value,
    district: selectedDistrict.value,
    village: selectedVillage.value,
    addressDetail: addressDetail.value,
    postalCode: postalCode.value,
  });
}

// Initialize from modelValue prop
async function initFromProps() {
  // Load addressDetail and postalCode if present
  if (props.modelValue?.addressDetail) {
    addressDetail.value = props.modelValue.addressDetail;
  }
  if (props.modelValue?.postalCode) {
    postalCode.value = props.modelValue.postalCode;
  }

  if (props.modelValue?.province) {
    await fetchProvinces();
    const prov = provinces.value.find(
      (p) => p.code === props.modelValue.province.code
    );
    if (prov) {
      selectedProvince.value = prov;
      await fetchRegencies(prov.code);

      if (props.modelValue.regency) {
        const reg = regencies.value.find(
          (r) => r.code === props.modelValue.regency.code
        );
        if (reg) {
          selectedRegency.value = reg;
          await fetchDistricts(reg.code);

          if (props.modelValue.district) {
            const dist = districts.value.find(
              (d) => d.code === props.modelValue.district.code
            );
            if (dist) {
              selectedDistrict.value = dist;
              await fetchVillages(dist.code);

              if (props.modelValue.village) {
                const vil = villages.value.find(
                  (v) => v.code === props.modelValue.village.code
                );
                if (vil) selectedVillage.value = vil;
              }
            }
          }
        }
      }
    }
  } else {
    await fetchProvinces();
  }
}

onMounted(() => {
  initFromProps();
});

// Watch for external modelValue changes
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal?.province?.code !== selectedProvince.value?.code) {
      initFromProps();
    }
  },
  { deep: true }
);
</script>
