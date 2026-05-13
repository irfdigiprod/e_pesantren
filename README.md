# e-Pesantren

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**e-Pesantren** adalah Sistem Informasi Manajemen Pesantren/Sekolah modern yang dirancang untuk mengelola data santri, akademik, kesehatan (klinik), asrama, dan operasional harian secara terintegrasi.

## 🚀 Fitur Utama

-   **Manajemen Santri**: Profil lengkap santri, riwayat akademik, dan data perilaku.
-   **Kesehatan (Klinik)**: Pencatatan rekam medis, kunjungan klinik, dan riwayat kesehatan santri.
-   **Manajemen Kamar (Rooms)**: Pengaturan asrama dan penempatan santri.
-   **Akademik**: Pengelolaan nilai, jadwal, dan laporan perkembangan santri.
-   **Push Notifications**: Notifikasi real-time melalui Web Push.
-   **Ekspor Data**: Mendukung ekspor ke format PDF (via Puppeteer/jsPDF) dan Excel (XLSX).

## 🛠️ Tech Stack

### Backend
-   **Runtime**: [Bun](https://bun.sh/)
-   **Framework**: [Hono](https://hono.dev/)
-   **Database**: MySQL
-   **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
-   **Validation**: [Zod](https://zod.dev/)

### Frontend
-   **Framework**: [Vue 3](https://vuejs.org/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **State Management**: Vue Composition API
-   **Charts**: Chart.js

## 📂 Struktur Proyek

```text
.
├── backend/          # Node.js/Bun API (Hono + Drizzle)
├── frontend/         # Vue.js 3 Application
├── docker-compose.yml # Konfigurasi Docker
└── README.md         # Dokumentasi ini
```

## ⚙️ Persiapan dan Instalasi

### Menggunakan Docker (Direkomendasikan)

1.  Pastikan Docker dan Docker Compose sudah terinstal.
2.  Salin file `.env.example` ke `.env` (jika tersedia) dan sesuaikan konfigurasinya.
3.  Jalankan perintah berikut:

    ```bash
    docker compose up -d
    ```

### Instalasi Manual

#### Backend
1.  Masuk ke direktori backend:
    ```bash
    cd backend
    ```
2.  Instal dependensi menggunakan Bun:
    ```bash
    bun install
    ```
3.  Konfigurasi `.env` untuk database MySQL.
4.  Jalankan migrasi database:
    ```bash
    bun run db:push
    ```
5.  Jalankan server:
    ```bash
    bun run dev
    ```

#### Frontend
1.  Masuk ke direktori frontend:
    ```bash
    cd frontend
    ```
2.  Instal dependensi:
    ```bash
    npm install
    ```
3.  Jalankan aplikasi:
    ```bash
    npm run dev
    ```

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

## 🤝 Kontribusi

Kontribusi selalu terbuka! Silakan buat *pull request* atau buka *issue* jika ada saran atau perbaikan.

---
Dikembangkan oleh **Irfan Alkhotiri**.
