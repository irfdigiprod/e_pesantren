<template>
  <div
    :id="id"
    class="bg-white p-8 max-w-[800px] mx-auto text-slate-800"
    style="font-family: 'Times New Roman', serif"
  >
    <!-- HEADER -->
    <!-- HEADER -->
    <!-- HEADER -->
    <div class="relative text-center border-b-2 border-slate-800 pb-4 mb-6">
      <img
        :src="logoUrl"
        alt="Logo"
        class="absolute left-0 top-1 h-20 w-auto"
        @error="handleLogoError"
      />
      <h1 class="text-2xl font-bold uppercase pl-24 pr-24">
        {{ institutionName }}
      </h1>
      <p class="text-sm mt-1 pl-24 pr-24">
        {{ institutionAddress }}
      </p>
      <div
        class="mt-4 text-xl font-bold inline-block px-2 py-1 uppercase mx-auto"
      >
        Slip Gaji Guru
      </div>
    </div>

    <!-- INFO -->
    <div class="flex justify-between mb-6 text-sm">
      <div class="space-y-1.5">
        <div class="flex items-center">
          <span class="w-24 font-bold">Nama</span>
          <span>: {{ data.teacher.name }}</span>
        </div>
        <div class="flex items-center">
          <span class="w-24 font-bold">NIP</span>
          <span>: {{ data.teacher.nip || "-" }}</span>
        </div>
        <div class="flex items-center">
          <span class="w-24 font-bold">Jabatan</span>
          <span>: {{ data.teacher.position || "-" }}</span>
        </div>
        <div class="flex items-center">
          <span class="w-24 font-bold">Golongan</span>
          <span>: {{ data.teacher.gradeName || "-" }}</span>
        </div>
      </div>
      <div class="space-y-1.5 text-right">
        <div class="flex justify-end items-center">
          <span class="w-24 font-bold text-left">Periode</span>
          <span>: {{ periodName }}</span>
        </div>
        <div class="flex justify-end items-center">
          <span class="w-24 font-bold text-left">Kehadiran</span>
          <span>: {{ data.attendance.days }} Hari</span>
        </div>
      </div>
    </div>

    <!-- TABLE -->
    <table class="w-full text-sm border-collapse border border-slate-800 mb-6">
      <thead>
        <tr class="bg-slate-100">
          <th
            class="border border-slate-800 px-4 py-2.5 text-left w-12 align-middle"
          >
            No
          </th>
          <th
            class="border border-slate-800 px-4 py-2.5 text-left align-middle"
          >
            Keterangan
          </th>
          <th
            class="border border-slate-800 px-4 py-2.5 text-right w-48 align-middle"
          >
            Jumlah
          </th>
        </tr>
      </thead>
      <tbody>
        <!-- INCOME -->
        <tr>
          <td
            class="border border-slate-800 px-4 py-2.5 text-center align-middle"
          >
            1
          </td>
          <td class="border border-slate-800 px-4 py-2.5 align-middle">
            Tunjangan Kehadiran ({{ data.attendance.days }} x
            {{ formatMoney(data.attendance.rate) }})
          </td>
          <td
            class="border border-slate-800 px-4 py-2.5 text-right align-middle"
          >
            {{ formatMoney(data.attendance.total) }}
          </td>
        </tr>
        <tr>
          <td
            class="border border-slate-800 px-4 py-2.5 text-center align-middle"
          >
            2
          </td>
          <td class="border border-slate-800 px-4 py-2.5 align-middle">
            Tunjangan Jabatan
          </td>
          <td
            class="border border-slate-800 px-4 py-2.5 text-right align-middle"
          >
            {{ formatMoney(data.allowances.position) }}
          </td>
        </tr>
        <tr>
          <td
            class="border border-slate-800 px-4 py-2.5 text-center align-middle"
          >
            3
          </td>
          <td class="border border-slate-800 px-4 py-2.5 align-middle">
            Tunjangan Masa Kerja ({{ data.teacher.yearsService }} Tahun)
          </td>
          <td
            class="border border-slate-800 px-4 py-2.5 text-right align-middle"
          >
            {{ formatMoney(data.allowances.tenure) }}
          </td>
        </tr>
        <tr>
          <td
            class="border border-slate-800 px-4 py-2.5 text-center align-middle"
          >
            4
          </td>
          <td class="border border-slate-800 px-4 py-2.5 align-middle">
            Tunjangan Kesehatan
          </td>
          <td
            class="border border-slate-800 px-4 py-2.5 text-right align-middle"
          >
            {{ formatMoney(data.allowances.health) }}
          </td>
        </tr>
        <tr>
          <td
            class="border border-slate-800 px-4 py-2.5 text-center align-middle"
          >
            5
          </td>
          <td class="border border-slate-800 px-4 py-2.5 align-middle">
            Tunjangan Tempat Tinggal
          </td>
          <td
            class="border border-slate-800 px-4 py-2.5 text-right align-middle"
          >
            {{ formatMoney(data.allowances.housing) }}
          </td>
        </tr>
        <tr>
          <td
            class="border border-slate-800 px-4 py-2.5 text-center align-middle"
          >
            6
          </td>
          <td class="border border-slate-800 px-4 py-2.5 align-middle">
            Tunjangan Transportasi
          </td>
          <td
            class="border border-slate-800 px-4 py-2.5 text-right align-middle"
          >
            {{ formatMoney(data.allowances.transport) }}
          </td>
        </tr>

        <!-- Custom Allowances -->
        <tr v-for="(custom, idx) in data.allowances.custom" :key="idx">
          <td
            class="border border-slate-800 px-4 py-3 text-center align-middle"
          >
            {{ 7 + idx }}
          </td>
          <td class="border border-slate-800 px-4 py-3 align-middle">
            {{ custom.name }}
          </td>
          <td class="border border-slate-800 px-4 py-3 text-right align-middle">
            {{ formatMoney(custom.amount) }}
          </td>
        </tr>

        <!-- TOTAL -->
        <tr class="font-bold bg-slate-50">
          <td
            class="border border-slate-800 px-4 py-3 text-center align-middle"
            colspan="2"
          >
            TOTAL PENERIMAAN
          </td>
          <td class="border border-slate-800 px-4 py-3 text-right align-middle">
            {{ formatMoney(data.totalSalary) }}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- FOOTER -->
    <div class="flex justify-between mt-12 text-sm">
      <div class="text-center w-48">
        <p class="mb-16">Penerima,</p>
        <p class="font-bold border-b border-slate-800 pb-1">
          {{ data.teacher.name }}
        </p>
      </div>
      <div class="text-center w-48">
        <p class="mb-16">Purwakarta, {{ currentDate }}</p>
        <p class="font-bold border-b border-slate-800 pb-1">Bendahara</p>
      </div>
    </div>

    <div class="mt-8 text-xs text-slate-500 italic text-center">
      Dokumen ini dicetak otomatis oleh sistem SIM Pesantren secara elektronik.
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  id: { type: String, default: "salary-slip" }, // DOM ID for html2canvas
  data: { type: Object, required: true },
  period: { type: Object, required: true },
  institution: { type: Object, default: () => ({}) },
});

const logoUrl = computed(() => {
  const logo = props.institution?.institution_logo;
  if (!logo) return "/logo.png";

  // If absolute URL or data URI
  if (logo.startsWith("http") || logo.startsWith("data:")) return logo;

  const base = import.meta.env.VITE_API_BASE_URL || "";

  // If it starts with /api/, prepend base if base is not empty
  if (logo.startsWith("/api/")) {
    return base ? `${base}${logo}` : logo;
  }

  // If legacy relative path
  if (logo.startsWith("uploads/")) {
    return `${base}/api/${logo}`;
  }

  return logo;
});

const handleLogoError = (e) => {
  e.target.src = "/logo.png"; // Fallback on error
};

const institutionName = computed(() => {
  return props.institution?.institution_name || "Pondok Pesantren Minhajul Haq";
});

const institutionAddress = computed(() => {
  return (
    props.institution?.institution_address ||
    "Jl. Raya Purwakarta - Subang Km. 17, Wanayasa, Purwakarta, Jawa Barat"
  );
});

const periodName = computed(() => {
  const date = new Date(props.period.year, props.period.month - 1);
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
});

const currentDate = computed(() => {
  return new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

const formatMoney = (val) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
};
</script>
