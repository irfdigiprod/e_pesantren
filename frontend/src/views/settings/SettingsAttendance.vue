<template>
  <div class="max-w-4xl mx-auto">
    <!-- Skeleton -->
    <div v-if="loading" class="space-y-6 animate-pulse">
      <!-- Location Skeleton -->
      <div
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div class="h-16 bg-slate-100 border-b border-slate-200"></div>
        <div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="h-16 bg-slate-200 rounded-lg"></div>
            <div class="h-16 bg-slate-200 rounded-lg"></div>
            <div class="h-16 bg-slate-200 rounded-lg"></div>
          </div>
          <div class="h-24 bg-slate-100 rounded-lg"></div>
        </div>
      </div>

      <!-- Activities Skeleton -->
      <div
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div class="h-16 bg-slate-100 border-b border-slate-200"></div>
        <div class="p-6 space-y-4">
          <div class="h-12 bg-slate-200 rounded-lg w-1/3"></div>
          <div class="space-y-2">
            <div class="h-10 bg-slate-100 rounded-lg"></div>
            <div class="h-10 bg-slate-100 rounded-lg"></div>
            <div class="h-10 bg-slate-100 rounded-lg"></div>
          </div>
        </div>
      </div>

      <!-- Holidays Skeleton -->
      <div
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div class="h-16 bg-slate-100 border-b border-slate-200"></div>
        <div>
          <div class="flex gap-4">
            <div
              v-for="i in 7"
              :key="i"
              class="h-10 w-20 bg-slate-200 rounded-lg"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <div
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <!-- Header -->
        <div
          class="px-4 md:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4"
        >
          <div class="flex-1">
            <h1 class="text-xl font-semibold text-slate-800">
              Pengaturan Lokasi Absensi
            </h1>
            <p class="text-sm text-slate-500 mt-1">
              Tentukan titik koordinat pusat untuk validasi lokasi absensi guru.
            </p>
          </div>
          <div class="p-2 bg-amber-50 text-amber-900 rounded-lg">
            <Icon icon="lucide:map-pin" class="w-6 h-6" />
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 md:p-6">
          <form @submit.prevent="saveSettings" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Latitude -->
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-700"
                  >Latitude (Garis Lintang)</label
                >
                <div class="relative">
                  <input
                    v-model.number="settings.latitude"
                    type="number"
                    step="any"
                    inputmode="decimal"
                    placeholder="-6.123456"
                    :class="[
                      'w-full pl-10 pr-4 py-2.5 rounded-lg border transition-all outline-none',
                      settings.latitude == null
                        ? 'border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200',
                    ]"
                  />
                  <Icon
                    icon="lucide:globe"
                    class="absolute left-3 top-3 w-4 h-4 text-slate-400"
                  />
                </div>
                <p
                  v-if="settings.latitude == null"
                  class="text-xs text-rose-600 font-medium"
                >
                  ⚠️ Belum dikonfigurasi - wajib diisi!
                </p>
                <p v-else class="text-xs text-slate-500">Contoh: -6.9175</p>
              </div>

              <!-- Longitude -->
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-700"
                  >Longitude (Garis Bujur)</label
                >
                <div class="relative">
                  <input
                    v-model.number="settings.longitude"
                    type="number"
                    step="any"
                    inputmode="decimal"
                    placeholder="106.123456"
                    :class="[
                      'w-full pl-10 pr-4 py-2.5 rounded-lg border transition-all outline-none',
                      settings.longitude == null
                        ? 'border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200',
                    ]"
                  />
                  <Icon
                    icon="lucide:globe"
                    class="absolute left-3 top-3 w-4 h-4 text-slate-400"
                  />
                </div>
                <p
                  v-if="settings.longitude == null"
                  class="text-xs text-rose-600 font-medium"
                >
                  ⚠️ Belum dikonfigurasi - wajib diisi!
                </p>
                <p v-else class="text-xs text-slate-500">Contoh: 107.6191</p>
              </div>

              <!-- Radius -->
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-700"
                  >Maksimal Jarak (Meter)</label
                >
                <div class="relative">
                  <input
                    v-model.number="settings.radius"
                    type="number"
                    min="0"
                    inputmode="numeric"
                    placeholder="100"
                    class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                  />
                  <Icon
                    icon="lucide:circle-dashed"
                    class="absolute left-3 top-3 w-4 h-4 text-slate-400"
                  />
                </div>
                <p class="text-xs text-slate-500">
                  Jarak toleransi absensi dari titik pusat.
                </p>
              </div>

              <!-- Accuracy Tolerance -->
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-700"
                  >Toleransi Akurasi GPS (Meter)</label
                >
                <div class="relative">
                  <input
                    v-model.number="settings.accuracyTolerance"
                    type="number"
                    min="0"
                    max="500"
                    inputmode="numeric"
                    placeholder="50"
                    class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                  />
                  <Icon
                    icon="lucide:satellite"
                    class="absolute left-3 top-3 w-4 h-4 text-slate-400"
                  />
                </div>
                <p class="text-xs text-slate-500">
                  Toleransi maksimum untuk GPS dengan akurasi rendah (maks
                  500m). Jika akurasi lebih buruk dari ini, absensi tidak
                  diizinkan.
                </p>
              </div>
            </div>

            <!-- Current Location Helper -->
            <div
              class="bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-start gap-3"
            >
              <Icon
                icon="lucide:info"
                class="w-5 h-5 text-amber-900 shrink-0 mt-0.5"
              />
              <div class="flex-1">
                <h4 class="text-sm font-medium text-amber-800">
                  Bantuan Penetapan Lokasi
                </h4>
                <p class="text-sm text-amber-900 mt-1 mb-3">
                  Anda dapat menggunakan lokasi perangkat Anda saat ini sebagai
                  titik pusat absensi.
                </p>
                <button
                  type="button"
                  @click="useCurrentLocation"
                  class="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-900 hover:bg-amber-400 text-white rounded-md text-sm font-medium transition-colors"
                >
                  <Icon
                    v-if="loadingLoc"
                    icon="lucide:loader-2"
                    class="w-4 h-4 animate-spin"
                  />
                  <Icon v-else icon="lucide:crosshair" class="w-4 h-4" />
                  Ambil Lokasi Saat Ini
                </button>
                <p v-if="locError" class="text-xs text-red-600 mt-2">
                  {{ locError }}
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div
              class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100"
            >
              <div
                v-if="saved"
                class="flex items-center gap-2 text-green-600 text-sm font-medium mr-auto transition-all"
              >
                <Icon icon="lucide:check-circle" class="w-5 h-5" />
                Pengaturan berhasil disimpan
              </div>

              <button
                type="submit"
                class="px-5 py-2.5 bg-amber-900 hover:bg-amber-400 text-white rounded-lg font-medium shadow-sm hover:shadow transition-all flex items-center gap-2"
              >
                <Icon icon="lucide:save" class="w-4 h-4" />
                Simpan Pengaturan
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Activity Types Section -->
      <div
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6"
      >
        <div
          class="px-4 md:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4"
        >
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-slate-800">Jenis Kegiatan</h2>
            <p class="text-sm text-slate-500 mt-1">
              Daftar jenis kegiatan yang dapat dipilih saat absensi masuk.
            </p>
          </div>
          <div class="p-2 bg-amber-50 text-amber-900 rounded-lg">
            <Icon icon="lucide:list-checks" class="w-6 h-6" />
          </div>
        </div>

        <div class="p-4 md:p-6">
          <!-- Add new activity -->
          <div class="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              v-model="newActivity"
              type="text"
              placeholder="Nama kegiatan baru..."
              @keyup.enter="addActivity"
              class="flex-1 w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none"
            />
            <button
              type="button"
              @click="addActivity"
              :disabled="!newActivity.trim()"
              class="w-full sm:w-auto px-6 py-2.5 bg-amber-900 hover:bg-amber-400 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Icon icon="lucide:plus" class="w-4 h-4" />
              Tambah
            </button>
          </div>

          <!-- Activity list -->
          <div class="space-y-2">
            <div
              v-for="(activity, index) in settings.activityTypes"
              :key="index"
              class="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg border border-slate-200"
            >
              <span class="text-sm font-medium text-slate-700">{{
                activity
              }}</span>
              <button
                type="button"
                @click="removeActivity(index)"
                class="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              >
                <Icon icon="lucide:trash-2" class="w-4 h-4" />
              </button>
            </div>
            <div
              v-if="settings.activityTypes.length === 0"
              class="text-center py-6 text-slate-400 text-sm"
            >
              Belum ada jenis kegiatan. Tambahkan kegiatan baru di atas.
            </div>
          </div>
        </div>
      </div>

      <!-- Weekly Holidays Section -->
      <div
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6"
      >
        <div
          class="px-4 md:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4"
        >
          <div class="flex-1">
            <h2
              class="text-xl font-semibold text-slate-800 flex items-center gap-2"
            >
              Hari Libur Pekanan
            </h2>
            <p class="text-sm text-slate-500 mt-1">
              Pilih hari-hari yang merupakan hari libur pekanan. Hari-hari ini
              akan ditandai merah di tabel absensi.
            </p>
          </div>
          <div class="p-2 bg-amber-50 text-amber-900 rounded-lg">
            <Icon icon="lucide:calendar-off" class="w-6 h-6" />
          </div>
        </div>

        <div class="p-4 md:p-6">
          <div class="flex flex-wrap gap-4">
            <label
              v-for="(day, index) in [
                'Minggu',
                'Senin',
                'Selasa',
                'Rabu',
                'Kamis',
                'Jumat',
                'Sabtu',
              ]"
              :key="index"
              class="flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors"
              :class="
                settings.holidays.includes(index)
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              "
            >
              <input
                type="checkbox"
                :value="index"
                v-model="settings.holidays"
                @change="saveSettings(false)"
                class="rounded text-rose-600 focus:ring-rose-500 border-gray-300"
              />
              <span class="text-sm font-medium">{{ day }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Payroll Period Section -->
      <div
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6"
      >
        <div
          class="px-4 md:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4"
        >
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-slate-800">Periode Gaji</h2>
            <p class="text-sm text-slate-500 mt-1">
              Tentukan rentang tanggal (tanggal mulai - selesai) untuk periode
              perhitungan absensi bulanan.
            </p>
          </div>
          <div class="p-2 bg-amber-50 text-amber-900 rounded-lg">
            <Icon icon="lucide:calendar-range" class="w-6 h-6" />
          </div>
        </div>

        <div class="p-4 md:p-6">
          <!-- Period Type Selection -->
          <div class="mb-6">
            <label class="text-sm font-medium text-slate-700 block mb-2"
              >Tipe Periode</label
            >
            <div class="flex flex-col sm:flex-row gap-4">
              <label
                class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors"
                :class="
                  settings.periodType === 'same_month'
                    ? 'bg-amber-50 border-amber-200 ring-amber-200'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                "
              >
                <input
                  type="radio"
                  value="same_month"
                  v-model="settings.periodType"
                  @change="saveSettings(false)"
                  class="w-4 h-4 text-amber-600 focus:ring-amber-500 border-gray-300"
                />
                <div>
                  <span class="block text-sm font-medium text-slate-900"
                    >Bulan yang Sama</span
                  >
                  <span class="block text-xs text-slate-500"
                    >Contoh: 1 Jan - 31 Jan</span
                  >
                </div>
              </label>
              <label
                class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors"
                :class="
                  settings.periodType === 'cross_month'
                    ? 'bg-amber-50 border-amber-200 ring-amber-200'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                "
              >
                <input
                  type="radio"
                  value="cross_month"
                  v-model="settings.periodType"
                  @change="saveSettings(false)"
                  class="w-4 h-4 text-amber-600 focus:ring-amber-500 border-gray-300"
                />
                <div>
                  <span class="block text-sm font-medium text-slate-900"
                    >Lintas Bulan</span
                  >
                  <span class="block text-xs text-slate-500"
                    >Contoh: 25 Jan - 24 Feb</span
                  >
                </div>
              </label>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700"
                >Tanggal Mulai</label
              >
              <select
                v-model.number="settings.periodStart"
                @change="saveSettings(false)"
                class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none"
              >
                <option v-for="n in 31" :key="n" :value="n">{{ n }}</option>
              </select>
              <p
                class="text-xs text-slate-500"
                v-if="settings.periodType === 'cross_month'"
              >
                Contoh: 25 (mulai bulan sebelumnya)
              </p>
              <p class="text-xs text-slate-500" v-else>
                Contoh: 1 (mulai awal bulan)
              </p>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700"
                >Tanggal Selesai</label
              >
              <select
                v-model.number="settings.periodEnd"
                @change="saveSettings(false)"
                class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none"
              >
                <option v-for="n in 31" :key="n" :value="n">{{ n }}</option>
              </select>
              <p
                class="text-xs text-slate-500"
                v-if="settings.periodType === 'cross_month'"
              >
                Contoh: 24 (selesai bulan ini)
              </p>
              <p class="text-xs text-slate-500" v-else>
                Contoh: 31 (selesai akhir bulan)
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Custom Location per Division Section -->
      <div
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6"
      >
        <div
          class="px-4 md:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4"
        >
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-slate-800">
              Pengaturan Custom Lokasi per Divisi
            </h2>
            <p class="text-sm text-slate-500 mt-1">
              Atur koordinat pusat absensi yang berbeda untuk divisi tertentu. Jika tidak diatur, divisi akan menggunakan lokasi default di atas.
            </p>
          </div>
          <div class="p-2 bg-indigo-50 text-indigo-900 rounded-lg">
            <Icon icon="lucide:layers" class="w-6 h-6" />
          </div>
        </div>

        <div class="p-4 md:p-6 space-y-4">
          <div v-if="loadingDivisions" class="flex items-center justify-center py-6">
            <Icon icon="lucide:loader-2" class="w-8 h-8 animate-spin text-indigo-500" />
            <span class="ml-2 text-sm text-slate-500 font-medium">Memuat data divisi...</span>
          </div>

          <div v-else-if="divisions.length === 0" class="text-center py-8 text-slate-400 text-sm">
            Tidak ada divisi yang terdaftar.
          </div>

          <div v-else class="grid grid-cols-1 gap-4">
            <div
              v-for="division in divisions"
              :key="division.id"
              class="border rounded-xl p-4 transition-all duration-200"
              :class="[
                editingDivisionId === division.id
                  ? 'border-indigo-500 bg-indigo-50/10 shadow-sm'
                  : division.latitude != null && division.longitude != null
                  ? 'border-emerald-200 bg-emerald-50/10'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              ]"
            >
              <!-- Info Header -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex-1">
                  <h3 class="text-base font-semibold text-slate-800 flex flex-wrap items-center gap-2">
                    {{ division.name }}
                    <span
                      v-if="division.latitude != null && division.longitude != null"
                      class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Custom Lokasi
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600"
                    >
                      Lokasi Global
                    </span>
                  </h3>
                  <p class="text-xs text-slate-500 mt-1">
                    {{ division.description || 'Tidak ada deskripsi.' }}
                  </p>
                  <div
                    v-if="division.latitude != null && division.longitude != null"
                    class="text-xs font-mono text-slate-500 mt-2 flex flex-wrap gap-x-4 gap-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100 w-fit"
                  >
                    <span><strong>Lat:</strong> {{ parseFloat(division.latitude).toFixed(6) }}</span>
                    <span><strong>Lng:</strong> {{ parseFloat(division.longitude).toFixed(6) }}</span>
                    <span><strong>Radius:</strong> {{ division.radius || 100 }}m</span>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <button
                    v-if="editingDivisionId !== division.id"
                    type="button"
                    @click="editDivision(division)"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-500 text-slate-700 hover:text-indigo-600 rounded-lg text-sm font-medium transition-all"
                  >
                    <Icon icon="lucide:edit-2" class="w-4 h-4" />
                    Atur Lokasi
                  </button>
                </div>
              </div>

              <!-- Edit Form Specific to division -->
              <div
                v-if="editingDivisionId === division.id"
                class="mt-6 pt-6 border-t border-slate-100 space-y-4"
              >
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <!-- Latitude -->
                  <div class="space-y-1.5">
                    <label class="text-xs font-semibold text-slate-700">Latitude</label>
                    <input
                      v-model.number="editForm.latitude"
                      type="number"
                      step="any"
                      placeholder="Contoh: -6.9175"
                      class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm outline-none"
                    />
                  </div>

                  <!-- Longitude -->
                  <div class="space-y-1.5">
                    <label class="text-xs font-semibold text-slate-700">Longitude</label>
                    <input
                      v-model.number="editForm.longitude"
                      type="number"
                      step="any"
                      placeholder="Contoh: 107.6191"
                      class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm outline-none"
                    />
                  </div>

                  <!-- Radius -->
                  <div class="space-y-1.5">
                    <label class="text-xs font-semibold text-slate-700">Radius (Meter)</label>
                    <input
                      v-model.number="editForm.radius"
                      type="number"
                      min="1"
                      placeholder="Default global (100)"
                      class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm outline-none"
                    />
                  </div>
                </div>

                <!-- Division Geolocation Helper -->
                <div class="flex flex-wrap items-center justify-between gap-3 bg-amber-50/50 border border-amber-100/50 rounded-lg p-3">
                  <div class="flex items-center gap-2 text-xs text-amber-900">
                    <Icon icon="lucide:info" class="w-4 h-4 shrink-0 text-amber-700" />
                    <span>Gunakan koordinat GPS perangkat Anda saat ini sebagai koordinat divisi.</span>
                  </div>
                  <button
                    type="button"
                    @click="useCurrentLocationForDivision"
                    class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-900 hover:bg-amber-800 text-white rounded-md text-xs font-medium transition-colors"
                  >
                    <Icon v-if="loadingDivLoc" icon="lucide:loader-2" class="w-3 h-3 animate-spin" />
                    <Icon v-else icon="lucide:crosshair" class="w-3 h-3" />
                    Gunakan Lokasi Saya
                  </button>
                  <p v-if="divLocError" class="text-xs text-rose-600 w-full mt-1">
                    {{ divLocError }}
                  </p>
                </div>

                <!-- Actions -->
                <div class="flex flex-wrap items-center justify-end gap-2 pt-2">
                  <button
                    v-if="division.latitude != null && division.longitude != null"
                    type="button"
                    @click="resetDivisionLocation(division)"
                    class="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-medium mr-auto transition-colors"
                  >
                    Hapus Custom (Gunakan Global)
                  </button>

                  <button
                    type="button"
                    @click="cancelEditDivision"
                    class="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    Batal
                  </button>

                  <button
                    type="button"
                    @click="saveDivisionLocation(division)"
                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Icon icon="lucide:save" class="w-4 h-4" />
                    Simpan Lokasi Divisi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
import { ref, onMounted, reactive } from "vue";
import { Icon } from "@iconify/vue";
import { settingsApi, divisionsApi } from "@/services/api";
import StatusModal from "@/components/ui/StatusModal.vue";

const settings = ref({
  latitude: null, // Null = belum dikonfigurasi
  longitude: null, // Null = belum dikonfigurasi
  radius: 100,
  accuracyTolerance: 50, // Default 50m tolerance for low accuracy GPS
  activityTypes: ["Mengajar", "Piket", "Rapat", "Kegiatan Lainnya"],
  periodStart: 25,
  periodEnd: 25,
  periodType: "cross_month",
  holidays: [0], // Default Sunday
});

const loading = ref(true);
const loadingLoc = ref(false);
const locError = ref("");
const saved = ref(false);
const newActivity = ref("");
const error = ref("");

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

async function fetchSettings() {
  loading.value = true;
  try {
    const res = await settingsApi.getAll([
      "attendance_latitude",
      "attendance_longitude",
      "attendance_radius",
      "attendance_accuracy_tolerance",
      "attendance_activities",
      "attendance_period_start",
      "attendance_period_end",
      "attendance_period_type",
      "attendance_holidays",
    ]);

    if (res.data) {
      // Use != null to properly handle "0" string values
      if (
        res.data.attendance_latitude != null &&
        res.data.attendance_latitude !== ""
      )
        settings.value.latitude = parseFloat(res.data.attendance_latitude);
      if (
        res.data.attendance_longitude != null &&
        res.data.attendance_longitude !== ""
      )
        settings.value.longitude = parseFloat(res.data.attendance_longitude);
      if (
        res.data.attendance_radius != null &&
        res.data.attendance_radius !== ""
      )
        settings.value.radius = parseInt(res.data.attendance_radius);
      if (
        res.data.attendance_accuracy_tolerance != null &&
        res.data.attendance_accuracy_tolerance !== ""
      )
        settings.value.accuracyTolerance = parseInt(
          res.data.attendance_accuracy_tolerance,
        );
      if (res.data.attendance_activities)
        settings.value.activityTypes = JSON.parse(
          res.data.attendance_activities,
        );
      if (
        res.data.attendance_period_start != null &&
        res.data.attendance_period_start !== ""
      )
        settings.value.periodStart = parseInt(res.data.attendance_period_start);
      if (
        res.data.attendance_period_end != null &&
        res.data.attendance_period_end !== ""
      )
        settings.value.periodEnd = parseInt(res.data.attendance_period_end);
      if (res.data.attendance_period_type)
        settings.value.periodType = res.data.attendance_period_type;

      try {
        if (res.data.attendance_holidays) {
          settings.value.holidays = JSON.parse(res.data.attendance_holidays);
        }
      } catch (e) {
        settings.value.holidays = [0];
      }
    }
  } catch (e) {
    console.error("Failed to fetch settings:", e);
    // Silent fail, use defaults
  } finally {
    loading.value = false;
  }
}

// Helper to get current position with promise and fallback
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
          "High accuracy location failed in settings, retrying with low accuracy...",
          err.message,
        );
        // Fallback: Low accuracy (Network/WiFi) - Faster, more reliable indoors
        // Allow cached positions up to 2 minutes old
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          (err2) => reject(err2),
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 },
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}

function useCurrentLocation() {
  loadingLoc.value = true;
  locError.value = "";

  if (!navigator.geolocation) {
    locError.value = "Browser tidak mendukung geolocation.";
    loadingLoc.value = false;
    return;
  }

  getCurrentPosition()
    .then((position) => {
      settings.value.latitude = position.coords.latitude;
      settings.value.longitude = position.coords.longitude;
      // Also update map if we have one? (Currently just inputs)
    })
    .catch((err) => {
      console.error(err);
      let msg = err.message;
      if (err.code === 1) msg = "Izin lokasi ditolak.";
      else if (err.code === 2) msg = "Lokasi tidak tersedia.";
      else if (err.code === 3) msg = "Waktu permintaan lokasi habis.";

      locError.value = "Gagal mengambil lokasi: " + msg;
    })
    .finally(() => {
      loadingLoc.value = false;
    });
}

async function addActivity() {
  const name = newActivity.value.trim();
  if (name && !settings.value.activityTypes.includes(name)) {
    settings.value.activityTypes.push(name);
    newActivity.value = "";
    await saveSettings(true); // Save immediately
  }
}

async function removeActivity(index) {
  settings.value.activityTypes.splice(index, 1);
  await saveSettings(true); // Save immediately
}

async function saveSettings(silent = false) {
  loading.value = true;
  error.value = "";

  // Validation (skip for silent saves like activity changes)
  if (!silent) {
    // Validate latitude
    if (settings.value.latitude == null || isNaN(settings.value.latitude)) {
      showStatus(
        "error",
        "Validasi Gagal",
        "Latitude harus diisi dengan angka yang valid.",
      );
      loading.value = false;
      return;
    }
    if (settings.value.latitude < -90 || settings.value.latitude > 90) {
      showStatus(
        "error",
        "Validasi Gagal",
        "Latitude harus antara -90 dan 90.",
      );
      loading.value = false;
      return;
    }

    // Validate longitude
    if (settings.value.longitude == null || isNaN(settings.value.longitude)) {
      showStatus(
        "error",
        "Validasi Gagal",
        "Longitude harus diisi dengan angka yang valid.",
      );
      loading.value = false;
      return;
    }
    if (settings.value.longitude < -180 || settings.value.longitude > 180) {
      showStatus(
        "error",
        "Validasi Gagal",
        "Longitude harus antara -180 dan 180.",
      );
      loading.value = false;
      return;
    }

    // Validate radius
    if (settings.value.radius == null || settings.value.radius <= 0) {
      showStatus("error", "Validasi Gagal", "Radius harus lebih dari 0 meter.");
      loading.value = false;
      return;
    }
  }

  try {
    const payload = [
      {
        key: "attendance_latitude",
        value: settings.value.latitude.toString(),
      },
      {
        key: "attendance_longitude",
        value: settings.value.longitude.toString(),
      },
      {
        key: "attendance_radius",
        value: settings.value.radius.toString(),
      },
      {
        key: "attendance_accuracy_tolerance",
        value: settings.value.accuracyTolerance.toString(),
      },
      {
        key: "attendance_activities",
        value: JSON.stringify(settings.value.activityTypes),
      },
      {
        key: "attendance_period_start",
        value: settings.value.periodStart.toString(),
      },
      {
        key: "attendance_period_end",
        value: settings.value.periodEnd.toString(),
      },
      {
        key: "attendance_period_type",
        value: settings.value.periodType,
      },
      {
        key: "attendance_holidays",
        value: JSON.stringify(settings.value.holidays),
      },
    ];

    await settingsApi.update(payload);

    // Feedback
    if (silent) {
      // Check if called from activity add/remove, shows implicit success?
      // User requested status modal for "klik tambah maka jenis pekerjaan langsung tersimpan"
      showStatus("success", "Berhasil", "Data kegiatan berhasil disimpan.");
    } else {
      // Manual save button click
      showStatus("success", "Berhasil", "Pengaturan lokasi berhasil disimpan.");
    }

    saved.value = true;
    setTimeout(() => (saved.value = false), 3000);
  } catch (e) {
    console.error("Failed to save settings:", e);
    error.value = "Gagal menyimpan pengaturan: " + e.message;
    showStatus("error", "Gagal", "Gagal menyimpan pengaturan: " + e.message);
  } finally {
    loading.value = false;
  }
}

// ==========================================
// Division Location Custom Settings Logic
// ==========================================
const divisions = ref([]);
const loadingDivisions = ref(false);
const editingDivisionId = ref(null);
const editForm = ref({
  latitude: null,
  longitude: null,
  radius: null,
});

async function fetchDivisions() {
  loadingDivisions.value = true;
  try {
    const res = await divisionsApi.getAll();
    divisions.value = res.data || [];
  } catch (e) {
    console.error("Gagal memuat divisi:", e);
  } finally {
    loadingDivisions.value = false;
  }
}

function editDivision(div) {
  editingDivisionId.value = div.id;
  editForm.value = {
    latitude: div.latitude != null ? parseFloat(div.latitude) : null,
    longitude: div.longitude != null ? parseFloat(div.longitude) : null,
    radius: div.radius != null ? parseInt(div.radius) : null,
  };
}

function cancelEditDivision() {
  editingDivisionId.value = null;
  editForm.value = {
    latitude: null,
    longitude: null,
    radius: null,
  };
}

const loadingDivLoc = ref(false);
const divLocError = ref("");

function getDivPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Browser tidak mendukung Geolocation"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          (err2) => reject(err2),
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

function useCurrentLocationForDivision() {
  loadingDivLoc.value = true;
  divLocError.value = "";

  getDivPosition()
    .then((position) => {
      editForm.value.latitude = position.coords.latitude;
      editForm.value.longitude = position.coords.longitude;
    })
    .catch((err) => {
      console.error(err);
      let msg = err.message;
      if (err.code === 1) msg = "Izin lokasi ditolak.";
      else if (err.code === 2) msg = "Lokasi tidak tersedia.";
      else if (err.code === 3) msg = "Waktu permintaan lokasi habis.";
      divLocError.value = "Gagal mengambil lokasi: " + msg;
    })
    .finally(() => {
      loadingDivLoc.value = false;
    });
}

async function saveDivisionLocation(division) {
  const hasLat = editForm.value.latitude != null && !isNaN(editForm.value.latitude);
  const hasLng = editForm.value.longitude != null && !isNaN(editForm.value.longitude);
  
  if ((hasLat && !hasLng) || (!hasLat && hasLng)) {
    showStatus(
      "error",
      "Validasi Gagal",
      "Kedua Latitude dan Longitude harus diisi atau dikosongkan bersamaan."
    );
    return;
  }

  if (hasLat) {
    if (editForm.value.latitude < -90 || editForm.value.latitude > 90) {
      showStatus("error", "Validasi Gagal", "Latitude harus antara -90 dan 90.");
      return;
    }
    if (editForm.value.longitude < -180 || editForm.value.longitude > 180) {
      showStatus("error", "Validasi Gagal", "Longitude harus antara -180 dan 180.");
      return;
    }
    if (editForm.value.radius != null && editForm.value.radius <= 0) {
      showStatus("error", "Validasi Gagal", "Radius harus lebih dari 0 meter.");
      return;
    }
  }

  try {
    loading.value = true;
    await divisionsApi.update(division.id, {
      name: division.name,
      description: division.description || undefined,
      latitude: editForm.value.latitude,
      longitude: editForm.value.longitude,
      radius: editForm.value.radius,
    });

    showStatus("success", "Berhasil", `Lokasi custom untuk divisi "${division.name}" berhasil disimpan.`);
    editingDivisionId.value = null;
    await fetchDivisions();
  } catch (e) {
    console.error("Gagal menyimpan lokasi divisi:", e);
    showStatus("error", "Gagal", "Gagal menyimpan lokasi divisi: " + e.message);
  } finally {
    loading.value = false;
  }
}

async function resetDivisionLocation(division) {
  try {
    loading.value = true;
    await divisionsApi.update(division.id, {
      name: division.name,
      description: division.description || undefined,
      latitude: null,
      longitude: null,
      radius: null,
    });

    showStatus("success", "Berhasil", `Lokasi divisi "${division.name}" direset ke Pengaturan Global.`);
    editingDivisionId.value = null;
    await fetchDivisions();
  } catch (e) {
    console.error("Gagal mereset lokasi divisi:", e);
    showStatus("error", "Gagal", "Gagal mereset lokasi divisi: " + e.message);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchSettings();
  fetchDivisions();
});
</script>
