<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <Icon
          icon="solar:spinner-bold"
          class="text-5xl text-[#602515] animate-spin mx-auto mb-4"
        />
        <p class="text-slate-500">Memuat data santri...</p>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="flex items-center justify-center min-h-[400px]"
    >
      <div class="text-center p-8 bg-red-50 rounded-2xl max-w-md">
        <Icon
          icon="solar:danger-triangle-bold"
          class="text-5xl text-red-500 mx-auto mb-4"
        />
        <h3 class="text-lg font-bold text-red-700 mb-2">Gagal Memuat Data</h3>
        <p class="text-red-600 text-sm mb-4">{{ error }}</p>
        <button
          @click="fetchStudent"
          class="px-4 py-2 bg-[#602515] text-white rounded-lg hover:bg-[#7e3c2f] transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <template v-else-if="student">
      <!-- Header with Back Button -->
      <div class="flex items-center gap-4 mb-8">
        <button
          @click="$router.back()"
          class="p-2 rounded-xl bg-white shadow-md hover:shadow-lg transition-all group"
        >
          <Icon
            icon="solar:arrow-left-bold"
            class="text-xl text-slate-400 group-hover:text-[#602515] transition-colors"
          />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Profil Santri</h1>
          <p class="text-sm text-slate-500">
            Detail informasi santri dan orang tua
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- LEFT COL: IDENTITY CARD -->
        <aside class="lg:col-span-4 space-y-6">
          <!-- Student Identity Card -->
          <div
            class="bg-white rounded-3xl shadow-xl overflow-hidden relative group transition-all hover:shadow-2xl"
          >
            <!-- Gradient Header with Pattern -->
            <div
              class="h-36 bg-gradient-to-r from-[#602515] to-[#8B4513] relative overflow-hidden"
            >
              <!-- Decorative Pattern -->
              <div class="absolute inset-0 opacity-10">
                <div class="absolute top-4 right-4">
                  <Icon icon="solar:user-id-bold" class="text-white text-8xl" />
                </div>
              </div>
              <!-- NIS Badge -->
              <div class="absolute bottom-4 left-6">
                <span class="text-xs text-white/70 uppercase tracking-wider"
                  >NIS</span
                >
                <p class="text-xl font-bold text-white font-mono">
                  {{ student.nis }}
                </p>
              </div>
            </div>

            <!-- Profile Content -->
            <div class="px-6 pb-8 text-center -mt-14 relative z-10">
              <!-- Avatar -->
              <div class="relative inline-block mx-auto mb-4">
                <div
                  class="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-3xl font-bold relative"
                  :class="
                    student.gender === 'female'
                      ? 'bg-pink-100 text-pink-600'
                      : 'bg-blue-100 text-blue-600'
                  "
                >
                  <Icon
                    :icon="
                      student.gender === 'female'
                        ? 'solar:women-bold-duotone'
                        : 'solar:men-bold-duotone'
                    "
                    class="text-5xl"
                  />
                </div>
                <!-- Status Indicator -->
                <div
                  class="absolute bottom-1 right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center"
                  :class="statusColors[student.status]?.bg || 'bg-slate-400'"
                >
                  <Icon
                    :icon="
                      statusIcons[student.status] ||
                      'solar:question-circle-bold'
                    "
                    class="text-white text-sm"
                  />
                </div>
              </div>

              <!-- Name & Meta -->
              <h2 class="text-xl font-bold text-slate-800 mb-1">
                {{ student.fullName }}
              </h2>
              <p class="text-slate-500 text-sm mb-4">
                <Icon
                  :icon="
                    student.gender === 'female'
                      ? 'solar:women-bold'
                      : 'solar:men-bold'
                  "
                  class="inline-block mr-1"
                />
                {{ student.gender === "female" ? "Perempuan" : "Laki-laki" }}
              </p>

              <div class="flex justify-center flex-wrap gap-2 mt-2">
                <span
                  class="text-xs font-semibold px-3 py-1.5 rounded-lg capitalize flex items-center gap-1"
                  :class="
                    statusColors[student.status]?.badge ||
                    'bg-slate-100 text-slate-600'
                  "
                >
                  <div
                    class="w-1.5 h-1.5 rounded-full"
                    :class="statusColors[student.status]?.dot || 'bg-slate-400'"
                  ></div>
                  {{ statusLabels[student.status] || student.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Info Card -->
          <div class="bg-white rounded-3xl shadow-lg p-6 space-y-4">
            <h3 class="font-bold text-slate-800 flex items-center gap-2">
              <Icon
                icon="solar:info-circle-bold-duotone"
                class="text-[#602515]"
              />
              Informasi Singkat
            </h3>

            <!-- Birth Info -->
            <div
              class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div class="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                <Icon icon="solar:calendar-date-bold-duotone" width="22" />
              </div>
              <div class="flex-1 min-w-0">
                <span class="text-xs text-slate-400 block">Tanggal Lahir</span>
                <span
                  class="text-sm font-semibold text-slate-700 truncate block"
                >
                  {{ formatDate(student.birthDate) }}
                </span>
              </div>
            </div>

            <!-- Birth Place -->
            <div
              class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div class="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                <Icon icon="solar:map-point-bold-duotone" width="22" />
              </div>
              <div class="flex-1 min-w-0">
                <span class="text-xs text-slate-400 block">Tempat Lahir</span>
                <span
                  class="text-sm font-semibold text-slate-700 truncate block"
                >
                  {{ student.birthPlace || "-" }}
                </span>
              </div>
            </div>

            <!-- Phone -->
            <div
              class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div class="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <Icon icon="solar:phone-bold-duotone" width="22" />
              </div>
              <div class="flex-1 min-w-0">
                <span class="text-xs text-slate-400 block">Telepon</span>
                <span
                  class="text-sm font-semibold text-slate-700 truncate block"
                >
                  {{ student.phone || "-" }}
                </span>
              </div>
            </div>

            <!-- Created At -->
            <div
              class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div class="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
                <Icon icon="solar:clock-circle-bold-duotone" width="22" />
              </div>
              <div class="flex-1 min-w-0">
                <span class="text-xs text-slate-400 block">Terdaftar</span>
                <span
                  class="text-sm font-semibold text-slate-700 truncate block"
                >
                  {{ formatDate(student.createdAt) }}
                </span>
              </div>
            </div>
          </div>
        </aside>

        <!-- RIGHT COL: DETAILS -->
        <main class="lg:col-span-8 space-y-8">
          <!-- Address Card -->
          <div
            class="bg-white rounded-3xl shadow-xl p-8 relative overflow-hidden"
          >
            <!-- Decorative -->
            <div
              class="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"
            >
              <Icon icon="solar:map-bold" width="120" />
            </div>

            <div class="flex items-center gap-3 mb-6">
              <div class="w-1 h-8 bg-[#f8ae19] rounded-full"></div>
              <h3 class="text-xl font-bold text-slate-800">Alamat</h3>
            </div>

            <div class="flex items-start gap-4">
              <div class="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                <Icon icon="solar:home-2-bold-duotone" width="28" />
              </div>
              <div class="flex-1">
                <p class="text-slate-700 leading-relaxed">
                  {{ student.address || "Alamat belum diisi" }}
                </p>
              </div>
            </div>
          </div>

          <!-- Parents Card -->
          <div
            class="bg-white rounded-3xl shadow-xl p-8 relative overflow-hidden"
          >
            <!-- Decorative -->
            <div
              class="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"
            >
              <Icon icon="solar:users-group-rounded-bold" width="120" />
            </div>

            <div class="flex items-center gap-3 mb-6">
              <div class="w-1 h-8 bg-[#602515] rounded-full"></div>
              <h3 class="text-xl font-bold text-slate-800">
                Data Orang Tua / Wali
              </h3>
            </div>

            <!-- No Parents -->
            <div
              v-if="!parents || parents.length === 0"
              class="text-center py-12"
            >
              <div
                class="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <Icon
                  icon="solar:users-group-two-rounded-bold-duotone"
                  class="text-4xl text-slate-300"
                />
              </div>
              <p class="text-slate-500">Belum ada data orang tua terhubung</p>
            </div>

            <!-- Parents List -->
            <div v-else class="space-y-6">
              <div
                v-for="parent in parents"
                :key="parent.id"
                class="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 hover:border-[#602515]/30 transition-all hover:shadow-md"
              >
                <!-- Parent Header -->
                <div class="flex items-start justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <div class="p-3 bg-[#602515]/10 rounded-xl">
                      <Icon
                        icon="solar:users-group-rounded-bold-duotone"
                        class="text-2xl text-[#602515]"
                      />
                    </div>
                    <div>
                      <span
                        v-if="parent.isPrimary"
                        class="text-xs bg-[#f8ae19]/20 text-[#b17a0d] px-2 py-0.5 rounded-full font-medium mb-1 inline-block"
                      >
                        Wali Utama
                      </span>
                      <h4 class="font-bold text-slate-800">
                        Orang Tua #{{ parent.id }}
                      </h4>
                    </div>
                  </div>
                  <!-- Edit Parent Button -->
                  <button
                    @click="openParentEditModal(parent)"
                    class="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-[#602515] transition-colors"
                    title="Edit data orang tua"
                  >
                    <Icon icon="solar:pen-2-bold-duotone" class="text-lg" />
                  </button>
                </div>

                <!-- Parent Details Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Father Info -->
                  <div class="p-4 bg-white rounded-xl border border-slate-200">
                    <div class="flex items-center gap-2 mb-3">
                      <Icon
                        icon="solar:men-bold-duotone"
                        class="text-blue-500"
                      />
                      <span
                        class="text-xs font-semibold text-slate-400 uppercase tracking-wider"
                        >Ayah</span
                      >
                    </div>
                    <p class="font-semibold text-slate-800 mb-1">
                      {{ parent.fatherName || "-" }}
                    </p>
                    <p
                      v-if="parent.fatherOccupation"
                      class="text-xs text-slate-500 flex items-center gap-1"
                    >
                      <Icon icon="solar:case-bold" class="text-slate-400" />
                      {{ parent.fatherOccupation }}
                    </p>
                  </div>

                  <!-- Mother Info -->
                  <div class="p-4 bg-white rounded-xl border border-slate-200">
                    <div class="flex items-center gap-2 mb-3">
                      <Icon
                        icon="solar:women-bold-duotone"
                        class="text-pink-500"
                      />
                      <span
                        class="text-xs font-semibold text-slate-400 uppercase tracking-wider"
                        >Ibu</span
                      >
                    </div>
                    <p class="font-semibold text-slate-800 mb-1">
                      {{ parent.motherName || "-" }}
                    </p>
                    <p
                      v-if="parent.motherOccupation"
                      class="text-xs text-slate-500 flex items-center gap-1"
                    >
                      <Icon icon="solar:case-bold" class="text-slate-400" />
                      {{ parent.motherOccupation }}
                    </p>
                  </div>
                </div>

                <!-- Contact Info -->
                <div
                  class="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <!-- Phone -->
                  <div class="flex items-center gap-3">
                    <div class="p-2 bg-green-100 rounded-lg">
                      <Icon
                        icon="solar:phone-bold-duotone"
                        class="text-green-600"
                      />
                    </div>
                    <div>
                      <span class="text-xs text-slate-400 block">Telepon</span>
                      <span class="text-sm font-medium text-slate-700">{{
                        parent.phone || "-"
                      }}</span>
                    </div>
                  </div>

                  <!-- Address -->
                  <div class="flex items-center gap-3">
                    <div class="p-2 bg-orange-100 rounded-lg">
                      <Icon
                        icon="solar:home-2-bold-duotone"
                        class="text-orange-600"
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <span class="text-xs text-slate-400 block">Alamat</span>
                      <span
                        class="text-sm font-medium text-slate-700 truncate block"
                        >{{ parent.address || "-" }}</span
                      >
                    </div>
                  </div>
                </div>

                <!-- User Account Info -->
                <div
                  v-if="parent.userId"
                  class="mt-4 pt-4 border-t border-slate-200"
                >
                  <div class="flex items-center gap-2 text-sm">
                    <Icon
                      icon="solar:shield-check-bold-duotone"
                      class="text-green-500"
                    />
                    <span class="text-slate-600"
                      >Memiliki akun login untuk orang tua</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions Card -->
          <div
            class="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden"
          >
            <div class="absolute top-0 right-0 opacity-10">
              <Icon icon="solar:settings-bold" width="150" />
            </div>

            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-6">
                <div
                  class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm"
                >
                  <Icon
                    icon="solar:widget-2-bold-duotone"
                    class="text-[#f8ae19]"
                    width="24"
                  />
                </div>
                <div>
                  <h3 class="text-xl font-bold">Aksi</h3>
                  <p class="text-slate-400 text-sm">Kelola data santri</p>
                </div>
              </div>

              <div class="flex flex-wrap gap-3">
                <button
                  @click="$router.push('/apps/students')"
                  class="px-5 py-2.5 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/20 transition-colors border border-white/10 flex items-center gap-2"
                >
                  <Icon icon="solar:arrow-left-bold" />
                  Kembali ke Daftar
                </button>
                <button
                  @click="openEditModal"
                  class="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#f8ae19] text-[#602515] hover:bg-[#ffc145] transition-colors shadow-lg shadow-orange-500/20 flex items-center gap-2"
                >
                  <Icon icon="solar:pen-2-bold" />
                  Edit Data
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </template>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div
        v-if="editModal.show"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      >
        <div
          class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          <!-- Header -->
          <div class="p-4 border-b flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"
              >
                <Icon
                  icon="solar:pen-new-square-bold-duotone"
                  class="text-xl text-[#602515]"
                />
              </div>
              <div>
                <h3 class="font-semibold text-slate-800">Edit Data Santri</h3>
                <p class="text-xs text-slate-500">Ubah informasi santri</p>
              </div>
            </div>
            <button
              @click="closeEditModal"
              class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Icon
                icon="solar:close-circle-line-duotone"
                class="text-xl text-slate-400"
              />
            </button>
          </div>

          <!-- Content - Scrollable -->
          <div class="p-5 space-y-4 overflow-y-auto flex-1">
            <!-- Error message -->
            <div
              v-if="editModal.error"
              class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
            >
              {{ editModal.error }}
            </div>

            <!-- Form Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- NIS -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >NIS <span class="text-red-500">*</span></label
                >
                <input
                  v-model="editForm.nis"
                  required
                  class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#602515]"
                />
              </div>

              <!-- Full Name -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Nama Lengkap <span class="text-red-500">*</span></label
                >
                <input
                  v-model="editForm.fullName"
                  required
                  class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#602515]"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Birth Date -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Tanggal Lahir</label
                >
                <input
                  type="date"
                  v-model="editForm.birthDate"
                  class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#602515]"
                />
              </div>

              <!-- Birth Place -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Tempat Lahir</label
                >
                <input
                  v-model="editForm.birthPlace"
                  class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#602515]"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Gender -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Jenis Kelamin <span class="text-red-500">*</span></label
                >
                <div class="flex gap-4 mt-2">
                  <label class="flex items-center gap-2">
                    <input
                      type="radio"
                      v-model="editForm.gender"
                      value="male"
                      class="text-[#602515] focus:ring-[#602515]"
                    />
                    <span class="text-sm">Laki-laki</span>
                  </label>
                  <label class="flex items-center gap-2">
                    <input
                      type="radio"
                      v-model="editForm.gender"
                      value="female"
                      class="text-[#602515] focus:ring-[#602515]"
                    />
                    <span class="text-sm">Perempuan</span>
                  </label>
                </div>
              </div>

              <!-- Status -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Status</label
                >
                <select
                  v-model="editForm.status"
                  class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#602515]"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                  <option value="graduated">Lulus</option>
                  <option value="transferred">Pindah</option>
                  <option value="dropped">Keluar</option>
                </select>
              </div>
            </div>

            <!-- Phone -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >No. Telepon</label
              >
              <input
                v-model="editForm.phone"
                class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#602515]"
                placeholder="08..."
              />
            </div>

            <!-- Address -->
            <!-- Address -->
            <div>
              <AddressSelector
                v-model="editForm.addressData"
                label="Alamat Domisili"
              />
            </div>
          </div>

          <!-- Footer -->
          <div
            class="p-4 border-t bg-slate-50 flex items-center justify-end gap-3 shrink-0"
          >
            <button
              @click="closeEditModal"
              class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              @click="saveStudent"
              :disabled="editModal.saving"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style="background: #602515"
            >
              <Icon
                v-if="editModal.saving"
                icon="solar:spinner-bold"
                class="animate-spin"
              />
              <Icon v-else icon="solar:diskette-bold-duotone" />
              {{ editModal.saving ? "Menyimpan..." : "Simpan Perubahan" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Success/Error Status Modal -->
    <StatusModal
      :isOpen="statusModal.isOpen"
      :type="statusModal.type"
      :title="statusModal.title"
      :message="statusModal.message"
      @close="statusModal.isOpen = false"
    />

    <!-- Parent Edit Modal -->
    <Teleport to="body">
      <div
        v-if="parentEditModal.show"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      >
        <div
          class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          <!-- Header -->
          <div class="p-4 border-b flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"
              >
                <Icon
                  icon="solar:users-group-rounded-bold-duotone"
                  class="text-xl text-[#602515]"
                />
              </div>
              <div>
                <h3 class="font-semibold text-slate-800">
                  Edit Data Orang Tua
                </h3>
                <p class="text-xs text-slate-500">
                  Ubah informasi orang tua/wali
                </p>
              </div>
            </div>
            <button
              @click="closeParentEditModal"
              class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Icon
                icon="solar:close-circle-line-duotone"
                class="text-xl text-slate-400"
              />
            </button>
          </div>

          <!-- Content - Scrollable -->
          <div class="p-5 space-y-4 overflow-y-auto flex-1">
            <!-- Error message -->
            <div
              v-if="parentEditModal.error"
              class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
            >
              {{ parentEditModal.error }}
            </div>

            <!-- Father Section -->
            <div class="p-4 bg-blue-50 rounded-xl space-y-3">
              <div class="flex items-center gap-2 mb-2">
                <Icon icon="solar:men-bold-duotone" class="text-blue-500" />
                <span class="font-semibold text-slate-700">Data Ayah</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1"
                    >Nama Ayah</label
                  >
                  <input
                    v-model="parentForm.fatherName"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1"
                    >Pekerjaan Ayah</label
                  >
                  <input
                    v-model="parentForm.fatherOccupation"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>

            <!-- Mother Section -->
            <div class="p-4 bg-pink-50 rounded-xl space-y-3">
              <div class="flex items-center gap-2 mb-2">
                <Icon icon="solar:women-bold-duotone" class="text-pink-500" />
                <span class="font-semibold text-slate-700">Data Ibu</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1"
                    >Nama Ibu</label
                  >
                  <input
                    v-model="parentForm.motherName"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 bg-white"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1"
                    >Pekerjaan Ibu</label
                  >
                  <input
                    v-model="parentForm.motherOccupation"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 bg-white"
                  />
                </div>
              </div>
            </div>

            <!-- Contact Section -->
            <div class="p-4 bg-slate-50 rounded-xl space-y-3">
              <div class="flex items-center gap-2 mb-2">
                <Icon icon="solar:phone-bold-duotone" class="text-green-500" />
                <span class="font-semibold text-slate-700">Kontak</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1"
                    >No. Telepon</label
                  >
                  <input
                    v-model="parentForm.phone"
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 bg-white"
                    placeholder="08..."
                  />
                </div>
                <div>
                  <AddressSelector
                    v-model="parentForm.addressData"
                    label="Alamat Domisili"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="p-4 border-t bg-slate-50 flex items-center justify-end gap-3 shrink-0"
          >
            <button
              @click="closeParentEditModal"
              class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              @click="saveParent"
              :disabled="parentEditModal.saving"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 bg-[#602515] hover:bg-[#602515]/80"
            >
              <Icon
                v-if="parentEditModal.saving"
                icon="solar:spinner-bold"
                class="animate-spin"
              />
              <Icon v-else icon="solar:diskette-bold-duotone" />
              {{ parentEditModal.saving ? "Menyimpan..." : "Simpan Perubahan" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { studentsApi, parentsApi } from "@/services/api";
import StatusModal from "@/components/ui/StatusModal.vue";
import AddressSelector from "@/components/ui/AddressSelector.vue"; // Imported

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref("");
const student = ref(null);
const parents = ref([]);

// Edit Modal state (Student)
const editModal = reactive({
  show: false,
  saving: false,
  error: "",
});

const editForm = reactive({
  nis: "",
  fullName: "",
  birthDate: "",
  birthPlace: "",
  gender: "male",
  phone: "",
  // Address structure matching AddressSelector v-model
  addressData: {
    province: null,
    regency: null,
    district: null,
    village: null,
    addressDetail: "",
    postalCode: "",
  },
  status: "active",
});

// Parent Edit Modal state
const parentEditModal = reactive({
  show: false,
  saving: false,
  error: "",
  parentId: null,
});

const parentForm = reactive({
  fatherName: "",
  motherName: "",
  fatherOccupation: "",
  motherOccupation: "",
  phone: "",
  addressData: {
    province: null,
    regency: null,
    district: null,
    village: null,
    addressDetail: "",
    postalCode: "",
  },
});

// Status Modal
const statusModal = reactive({
  isOpen: false,
  type: "success",
  title: "",
  message: "",
});

// Status styling
const statusColors = {
  active: {
    bg: "bg-green-500",
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  inactive: {
    bg: "bg-slate-500",
    badge: "bg-slate-100 text-slate-700",
    dot: "bg-slate-500",
  },
  graduated: {
    bg: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  transferred: {
    bg: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  dropped: {
    bg: "bg-red-500",
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
};

const statusLabels = {
  active: "Aktif",
  inactive: "Tidak Aktif",
  graduated: "Lulus",
  transferred: "Pindah",
  dropped: "Keluar",
};

const statusIcons = {
  active: "solar:check-circle-bold",
  inactive: "solar:minus-circle-bold",
  graduated: "solar:diploma-bold",
  transferred: "solar:transfer-horizontal-bold",
  dropped: "solar:close-circle-bold",
};

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateForInput(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

// Helper to safely parse JSON or return value
function safeParse(val) {
  if (!val) return null;
  if (typeof val === "object") return val; // Already parsed
  try {
    return JSON.parse(val);
  } catch (e) {
    return null;
  }
}

function openEditModal() {
  if (!student.value) return;

  // Populate form with current student data
  editForm.nis = student.value.nis || "";
  editForm.fullName = student.value.fullName || "";
  editForm.birthDate = formatDateForInput(student.value.birthDate);
  editForm.birthPlace = student.value.birthPlace || "";
  editForm.gender = student.value.gender || "male";
  editForm.phone = student.value.phone || "";

  // Parse address fields
  editForm.addressData = {
    province: safeParse(student.value.province),
    regency: safeParse(student.value.regency),
    district: safeParse(student.value.district),
    village: safeParse(student.value.village),
    addressDetail: student.value.addressDetail || "",
    postalCode: student.value.postalCode || "",
  };

  // Fallback: If no detailed address but plain address exists, put it in addressDetail?
  // User can then refine it using the selector.
  if (
    !editForm.addressData.addressDetail &&
    student.value.address &&
    !editForm.addressData.province
  ) {
    // editForm.addressData.addressDetail = student.value.address;
    // Not forcing this as it might duplicate if not careful.
  }

  editForm.status = student.value.status || "active";

  editModal.show = true;
  editModal.error = "";
}

function closeEditModal() {
  editModal.show = false;
  editModal.error = "";
}

async function saveStudent() {
  // Validation
  if (!editForm.nis?.trim()) {
    editModal.error = "NIS wajib diisi";
    return;
  }
  if (!editForm.fullName?.trim()) {
    editModal.error = "Nama lengkap wajib diisi";
    return;
  }

  editModal.saving = true;
  editModal.error = "";

  try {
    // Construct full address string for legacy compatibility
    const addr = editForm.addressData;
    const parts = [];
    if (addr.addressDetail) parts.push(addr.addressDetail);
    if (addr.village?.name) parts.push(addr.village.name);
    if (addr.district?.name) parts.push("Kec. " + addr.district.name);
    if (addr.regency?.name) parts.push(addr.regency.name);
    if (addr.province?.name) parts.push(addr.province.name);
    if (addr.postalCode) parts.push(addr.postalCode);
    const fullAddressString = parts.join(", ");

    const updateData = {
      nis: editForm.nis.trim(),
      fullName: editForm.fullName.trim(),
      birthDate: editForm.birthDate || undefined,
      birthPlace: editForm.birthPlace?.trim() || undefined,
      gender: editForm.gender,
      phone: editForm.phone?.trim() || undefined,
      status: editForm.status,

      // Address Fields
      address: fullAddressString || undefined,
      province: addr.province ? JSON.stringify(addr.province) : undefined,
      regency: addr.regency ? JSON.stringify(addr.regency) : undefined,
      district: addr.district ? JSON.stringify(addr.district) : undefined,
      village: addr.village ? JSON.stringify(addr.village) : undefined,
      addressDetail: addr.addressDetail || undefined,
      postalCode: addr.postalCode || undefined,
    };

    const response = await studentsApi.update(student.value.id, updateData);

    if (response.success) {
      // Update local state
      student.value = { ...student.value, ...response.data };
      closeEditModal();

      statusModal.type = "success";
      statusModal.title = "Berhasil!";
      statusModal.message = "Data santri berhasil diperbarui";
      statusModal.isOpen = true;
    } else {
      editModal.error = response.message || "Gagal menyimpan data";
    }
  } catch (err) {
    console.error("Save student error:", err);
    editModal.error = err.message || "Terjadi kesalahan saat menyimpan";
  } finally {
    editModal.saving = false;
  }
}

async function fetchStudent() {
  loading.value = true;
  error.value = "";

  try {
    const id = route.params.id;
    if (!id) {
      throw new Error("ID santri tidak ditemukan");
    }

    // Fetch student data (includes parents from backend)
    const response = await studentsApi.getById(id);
    if (response.success && response.data) {
      student.value = response.data;
      parents.value = response.data.parents || [];
    } else {
      throw new Error(response.message || "Gagal memuat data santri");
    }
  } catch (err) {
    console.error("Fetch student error:", err);
    error.value = err.message || "Terjadi kesalahan saat memuat data";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchStudent();
});

// Parent Edit Modal Functions
function openParentEditModal(parent) {
  parentEditModal.parentId = parent.id;
  parentForm.fatherName = parent.fatherName || "";
  parentForm.motherName = parent.motherName || "";
  parentForm.fatherOccupation = parent.fatherOccupation || "";
  parentForm.motherOccupation = parent.motherOccupation || "";
  parentForm.phone = parent.phone || "";

  parentForm.addressData = {
    province: safeParse(parent.province),
    regency: safeParse(parent.regency),
    district: safeParse(parent.district),
    village: safeParse(parent.village),
    addressDetail: parent.addressDetail || "",
    postalCode: parent.postalCode || "",
  };
  parentEditModal.show = true;
  parentEditModal.error = "";
}

function closeParentEditModal() {
  parentEditModal.show = false;
  parentEditModal.error = "";
  parentEditModal.parentId = null;
}

async function saveParent() {
  parentEditModal.saving = true;
  parentEditModal.error = "";

  try {
    const updateData = {
      fatherName: parentForm.fatherName?.trim() || undefined,
      motherName: parentForm.motherName?.trim() || undefined,
      fatherOccupation: parentForm.fatherOccupation?.trim() || undefined,
      motherOccupation: parentForm.motherOccupation?.trim() || undefined,
      phone: parentForm.phone?.trim() || undefined,

      // Address Fields
      address: (() => {
        const addr = parentForm.addressData;
        const parts = [];
        if (addr.addressDetail) parts.push(addr.addressDetail);
        if (addr.village?.name) parts.push(addr.village.name);
        if (addr.district?.name) parts.push("Kec. " + addr.district.name);
        if (addr.regency?.name) parts.push(addr.regency.name);
        if (addr.province?.name) parts.push(addr.province.name);
        if (addr.postalCode) parts.push(addr.postalCode);
        return parts.join(", ") || undefined;
      })(),
      province: parentForm.addressData.province
        ? JSON.stringify(parentForm.addressData.province)
        : undefined,
      regency: parentForm.addressData.regency
        ? JSON.stringify(parentForm.addressData.regency)
        : undefined,
      district: parentForm.addressData.district
        ? JSON.stringify(parentForm.addressData.district)
        : undefined,
      village: parentForm.addressData.village
        ? JSON.stringify(parentForm.addressData.village)
        : undefined,
      addressDetail: parentForm.addressData.addressDetail || undefined,
      postalCode: parentForm.addressData.postalCode || undefined,
    };

    const response = await parentsApi.update(
      parentEditModal.parentId,
      updateData
    );

    if (response.success) {
      // Update local parents array
      const idx = parents.value.findIndex(
        (p) => p.id === parentEditModal.parentId
      );
      if (idx !== -1) {
        parents.value[idx] = { ...parents.value[idx], ...response.data };
      }
      closeParentEditModal();

      statusModal.type = "success";
      statusModal.title = "Berhasil!";
      statusModal.message = "Data orang tua berhasil diperbarui";
      statusModal.isOpen = true;
    } else {
      parentEditModal.error = response.message || "Gagal menyimpan data";
    }
  } catch (err) {
    console.error("Save parent error:", err);
    parentEditModal.error = err.message || "Terjadi kesalahan saat menyimpan";
  } finally {
    parentEditModal.saving = false;
  }
}
</script>

<style scoped>
/* Custom animations */
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>
