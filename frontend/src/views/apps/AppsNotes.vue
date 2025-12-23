<template>
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
    <div class="bg-white dark:bg-gray-800 p-2 py-6 rounded-lg shadow-md w-full">
      <div
        class="relative mx-auto border-default bg-base border-[14px] rounded-[2.5rem] h-[600px] w-[300px]"
      >
        <div
          class="h-[32px] w-[3px] bg-base absolute -start-[17px] top-[72px] rounded-s-lg"
        ></div>
        <div
          class="h-[46px] w-[3px] bg-base absolute -start-[17px] top-[124px] rounded-s-lg"
        ></div>
        <div
          class="h-[46px] w-[3px] bg-base absolute -start-[17px] top-[178px] rounded-s-lg"
        ></div>
        <div
          class="h-[64px] w-[3px] bg-base absolute -end-[17px] top-[142px] rounded-e-lg"
        ></div>
        <div
          class="rounded-[2rem] overflow-hidden w-[272px] h-[572px] bg-neutral-primary"
        >
          <img
            src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/hero/mockup-1-light.png"
            class="dark:hidden w-[272px] h-[572px]"
            alt=""
          />
          <img
            src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/hero/mockup-1-dark.png"
            class="hidden dark:block w-[272px] h-[572px]"
            alt=""
          />
        </div>
      </div>
      <div
        class="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden text-text-light dark:text-text-dark"
      >
        <div
          class="sticky top-0 z-10 flex flex-col bg-background-light dark:bg-background-dark pt-4"
        >
          <!-- TopAppBar -->
          <div class="flex items-center px-4 pb-2 justify-between">
            <button
              class="flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5"
            >
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <h2
              class="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center"
            >
              Agustus 2024
            </h2>
            <button
              class="flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5"
            >
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          <!-- CalendarPicker Modified -->
          <div class="flex flex-col px-4">
            <div class="grid grid-cols-7 text-center">
              <p
                class="text-text-secondary-light dark:text-text-secondary-dark text-[13px] font-bold leading-normal tracking-[0.015em] flex h-10 w-full items-center justify-center"
              >
                S
              </p>
              <p
                class="text-text-secondary-light dark:text-text-secondary-dark text-[13px] font-bold leading-normal tracking-[0.015em] flex h-10 w-full items-center justify-center"
              >
                S
              </p>
              <p
                class="text-text-secondary-light dark:text-text-secondary-dark text-[13px] font-bold leading-normal tracking-[0.015em] flex h-10 w-full items-center justify-center"
              >
                R
              </p>
              <p
                class="text-text-secondary-light dark:text-text-secondary-dark text-[13px] font-bold leading-normal tracking-[0.015em] flex h-10 w-full items-center justify-center"
              >
                K
              </p>
              <p
                class="text-text-secondary-light dark:text-text-secondary-dark text-[13px] font-bold leading-normal tracking-[0.015em] flex h-10 w-full items-center justify-center"
              >
                J
              </p>
              <p
                class="text-text-secondary-light dark:text-text-secondary-dark text-[13px] font-bold leading-normal tracking-[0.015em] flex h-10 w-full items-center justify-center"
              >
                S
              </p>
              <p
                class="text-text-secondary-light dark:text-text-secondary-dark text-[13px] font-bold leading-normal tracking-[0.015em] flex h-10 w-full items-center justify-center"
              >
                M
              </p>
            </div>
            <div class="grid grid-cols-7">
              <!-- Empty days -->
              <div class="h-12 w-full"></div>
              <div class="h-12 w-full"></div>
              <div class="h-12 w-full"></div>
              <div class="h-12 w-full"></div>
              <!-- Calendar days -->
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div class="absolute date-ring date-ring-full"></div>
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  1
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div class="absolute date-ring date-ring-half"></div>
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  2
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  3
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div class="absolute date-ring date-ring-warning"></div>
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  4
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  5
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div class="absolute date-ring date-ring-full"></div>
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  6
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  7
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  8
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  9
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  10
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  11
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  12
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  13
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  14
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  15
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  16
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal text-white"
              >
                <div class="absolute inset-1.5 rounded-full bg-accent"></div>
                <span class="relative z-10">17</span>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  18
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  19
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  20
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  21
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  22
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  23
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  24
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  25
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  26
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  27
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  28
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  29
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  30
                </div>
              </button>
              <button
                class="relative h-12 w-full text-sm font-medium leading-normal"
              >
                <div
                  class="flex size-full items-center justify-center rounded-full"
                >
                  31
                </div>
              </button>
            </div>
          </div>
        </div>
        <!-- Main Content Area -->
        <div class="flex-1 bg-white dark:bg-[#1C2C24] pt-4 rounded-t-xl mt-4">
          <!-- SectionHeader -->
          <h3
            class="text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2"
          >
            Peserta - 17 Agustus 2024
          </h3>
          <!-- ListItem 1 -->
          <div
            class="flex items-center gap-4 px-4 min-h-[72px] py-2 justify-between"
          >
            <div class="flex items-center gap-4">
              <img
                class="aspect-square rounded-full h-12 w-12 object-cover"
                data-alt="Portrait of a man with glasses smiling"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBl2f704cMKSwmhK1DNzOsHyf1BNWWpOzLfiXPB3EOL0cEVIaDKfk-pUGa57HPjOPVXUdpvyyC_HzN1yqvEueaeFoqupUVxnj28zN56qworRdBmdYLhsYTQSgAf9YpLsGO_sPagBVlQXC-9YDrnocTOa9EHED5pR3kSV_vT1qe6E4q40fsqiNu9Ev392Nt2koW2lKmeueSaqWH2BSUHes4YJghnHOuQ5QPMfRmBe4g0wotpTVuc-OvNaMsuCt17lrQQi10xUDHWI_NQ"
              />
              <div class="flex flex-col justify-center">
                <p class="text-base font-medium leading-normal line-clamp-1">
                  Ahmad Fauzan
                </p>
                <p
                  class="text-primary text-sm font-normal leading-normal line-clamp-2"
                >
                  Al-Baqarah: 1-5
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <div class="size-2.5 rounded-full bg-primary"></div>
              <p class="text-base font-normal leading-normal">Selesai</p>
            </div>
          </div>
          <!-- ListItem 2 -->
          <div
            class="flex items-center gap-4 px-4 min-h-[72px] py-2 justify-between"
          >
            <div class="flex items-center gap-4">
              <img
                class="aspect-square rounded-full h-12 w-12 object-cover"
                data-alt="Portrait of a man in a beanie"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuByVLMo_2UxtCiLXlYgF9ivnS0gS9T_fWhTU35s9P-y4KN04zlU3P8MfLoJL-U4n3ljf2f60eiN6mYZL5f53LxIh6MDEG5AIPXYyuGbfCNeTmifKch3aXWIre1iEvSsiqE-AF6V_M4Xf1mOG8XEXajxI4-s75kCJr7jWlbYEPRXSlRRDPipc8X7Y1_NfsGdAUemDTXJphmaH_vSFLLxTe2Ov7TY5XzQ0d_1Mes5jVepWMEf4BmVLMihOg0HYt4Udu9EPWCPYEU7hFtq"
              />
              <div class="flex flex-col justify-center">
                <p class="text-base font-medium leading-normal line-clamp-1">
                  Budi Santoso
                </p>
                <p
                  class="text-text-secondary-light dark:text-text-secondary-dark text-sm font-normal leading-normal line-clamp-2"
                >
                  -
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <div
                class="size-2.5 rounded-full bg-text-secondary-light dark:bg-text-secondary-dark"
              ></div>
              <p class="text-base font-normal leading-normal">Belum</p>
            </div>
          </div>
          <!-- ListItem 3 -->
          <div
            class="flex items-center gap-4 px-4 min-h-[72px] py-2 justify-between"
          >
            <div class="flex items-center gap-4">
              <img
                class="aspect-square rounded-full h-12 w-12 object-cover"
                data-alt="Portrait of a smiling woman"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPOfS6kpuhgfoMDaHWHjrvGWmslWrl1ubOSJ9CEOsK_5VdGpq2nol2EGiTQqjR-vSg_5gq0Dk3f3wUmvMUBvF-ScTBfpnv6ZnBKdhfqsjvTLwETJPNVWDRJoyZimosOcZSSJpikkRJXPjmvntU5uS1kkFgsf65gKu3E6wFcYh2Ebgp4Ttq-73XvY3Ao5mDsDTAuO12nQsZbE-PRWaV89CqKyUctQKU60OdjYgDulu03S3rvXOe3P6YW8m208FrrO86beq6Q2w5AaYl"
              />
              <div class="flex flex-col justify-center">
                <p class="text-base font-medium leading-normal line-clamp-1">
                  Citra Lestari
                </p>
                <p
                  class="text-warning text-sm font-normal leading-normal line-clamp-2"
                >
                  Sakit
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <div class="size-2.5 rounded-full bg-warning"></div>
              <p class="text-base font-normal leading-normal">Izin</p>
            </div>
          </div>
          <!-- ListItem 4 -->
          <div
            class="flex items-center gap-4 px-4 min-h-[72px] py-2 justify-between"
          >
            <div class="flex items-center gap-4">
              <img
                class="aspect-square rounded-full h-12 w-12 object-cover"
                data-alt="Portrait of a smiling man with a beard"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDz38wfQnhsGZGMG9TvNMndG7eyJLnvqbnq9SsQ7QwzOD-NWVOcHF8Ae3L1oGwCTHoi26Ba9qZRDD4i90QJUpQMZvPPFQQmR2giGZ7-po-GXzMVKdbfTYf33Go8BBfAgnKZYTXNL2JeRm7IXRjgUlTJESMUA2m-_KXjfJwvAuPiJeW8Ofgd_NgLqwHcD423hoAXDsbDudYY7WpDd6ACIczsEw-8IlrdaFGnRcyJ7sq-GQuyCmGW1_JlhFFYDQu62v5fOOa_aHS2KkHu"
              />
              <div class="flex flex-col justify-center">
                <p class="text-base font-medium leading-normal line-clamp-1">
                  Dharma Wirawan
                </p>
                <p
                  class="text-primary text-sm font-normal leading-normal line-clamp-2"
                >
                  An-Nisa: 20-25
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <div class="size-2.5 rounded-full bg-primary"></div>
              <p class="text-base font-normal leading-normal">Selesai</p>
            </div>
          </div>
        </div>
      </div>
      <h1 class="text-2xl font-semibold mb-2 text-slate-800">Apps - Notes</h1>
      <p class="text-slate-600">
        Ini adalah halaman Notes. Halaman ini dapat digunakan untuk mencatat,
        menyimpan, dan mengelola catatan penting pengguna.
      </p>
    </div>
  </div>
</template>
