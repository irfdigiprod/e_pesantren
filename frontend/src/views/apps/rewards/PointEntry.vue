<template>
  <div class="px-2">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Input Poin</h1>
      <p class="text-slate-500 text-sm mt-1">
        Catat pelanggaran atau penghargaan santri dengan bukti foto.
      </p>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <RewardPunishmentForm
        ref="formRef"
        :students="students"
        :rules="rules"
        mode="create"
        :submitting="submitting"
        @submit="handleSubmit"
      />
    </div>

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
import { ref, reactive, onMounted } from "vue";
import StatusModal from "@/components/ui/StatusModal.vue";
import RewardPunishmentForm from "@/components/domain/rewards/RewardPunishmentForm.vue";
import { studentsApi, rulesApi, rewardsApi } from "@/services/api";

const students = ref([]);
const rules = ref([]);
const submitting = ref(false);
const formRef = ref(null);

const statusModal = reactive({
  isOpen: false,
  status: "success",
  title: "",
  message: "",
});

async function fetchInitialData() {
  try {
    const [studentRes, ruleRes] = await Promise.all([
      studentsApi.getAll({ limit: 0 }),
      rulesApi.getAll({ limit: 0 }),
    ]);

    if (studentRes.data) {
      if (Array.isArray(studentRes.data)) students.value = studentRes.data;
      else if (studentRes.data.data) students.value = studentRes.data.data;
    }
    if (ruleRes.success) rules.value = ruleRes.data;
  } catch (err) {
    console.error("Failed to load initial data", err);
  }
}

async function handleSubmit(payload) {
  submitting.value = true;
  try {
    const { formData, students, images } = payload;

    // Prepare base payload
    const basePayload = {
      type: formData.type,
      ruleId: formData.ruleId,
      points: formData.points,
      date: formData.date,
      notes: formData.notes,
      category: formData.category || "Umum",
      title:
        formData.title ||
        (formData.type === "reward"
          ? "Penghargaan Manual"
          : "Pelanggaran Manual"),
      description: formData.notes,
      images: images,
    };

    if (!basePayload.category || basePayload.category === "Umum") {
      basePayload.category = basePayload.category || "Lainnya";
    }

    // Create for each student
    const promises = students.map((student) => {
      return rewardsApi.create({ ...basePayload, studentId: student.id });
    });

    await Promise.all(promises);

    statusModal.status = "success";
    statusModal.title = "Berhasil";
    statusModal.message = `Data poin berhasil disimpan untuk ${students.length} santri.`;
    statusModal.isOpen = true;

    // Reset form
    if (formRef.value) formRef.value.resetForm();
  } catch (err) {
    statusModal.status = "error";
    statusModal.title = "Gagal";
    statusModal.message = err.message || "Gagal menyimpan data";
    statusModal.isOpen = true;
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  fetchInitialData();
});
</script>
