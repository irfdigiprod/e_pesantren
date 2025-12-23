# Sistem Informasi Manajemen Pesantren - REST API

RESTful API untuk aplikasi manajemen sistem informasi pesantren/sekolah.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Hono](https://hono.dev/)
- **Validation**: [Zod](https://zod.dev/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: MySQL
- **Authentication**: JWT

## Fitur

- ✅ User Authentication (Register, Login, Logout)
- ✅ Pendataan Siswa
- ✅ Pendataan Guru/Pegawai
- ✅ Pendataan Orang Tua
- ✅ Pendataan Hafalan Al-Quran
- ✅ Absensi Siswa
- ✅ Absensi Guru/Pegawai
- ✅ Reward & Punishment Siswa
- ✅ Klinik Kesehatan (Obat, Rawat Inap, Pemeriksaan)
- ✅ Rapor Online Siswa
- ✅ Jadwal Pelajaran & Jadwal Mengajar

## Setup

### 1. Prasyarat

- **Bun** - https://bun.sh/
- **MySQL Server** - Pastikan MySQL sudah terinstall dan berjalan

### 2. Buat Database MySQL

Buka MySQL client (bisa pakai phpMyAdmin, MySQL Workbench, atau command line):

```sql
CREATE DATABASE pesantren CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Install Dependencies

```bash
bun install
```

### 4. Environment Configuration

Copy file `.env.example` ke `.env`:

```bash
copy .env.example .env
```

Edit `.env` sesuai konfigurasi MySQL Anda:

```env
# Database MySQL
DATABASE_URL=mysql://root:password@localhost:3306/pesantren

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Server
PORT=3000

# CORS - Comma separated allowed origins
CORS_ORIGINS=http://localhost:5173,http://localhost:3001
```

**Format DATABASE_URL:**
```
mysql://username:password@host:port/database
```

**Contoh:**
- Local: `mysql://root:mypassword@localhost:3306/pesantren`
- Remote: `mysql://user:pass@192.168.1.100:3306/pesantren`

### 5. Setup Database Schema

```bash
# Push schema ke database
bunx drizzle-kit push

# Atau generate & run migrations
bun run db:generate
bun run db:migrate
```

### 6. Run Development Server

```bash
bun run dev
```

Server akan berjalan di `http://localhost:3000`

## CORS Configuration

API ini sudah dikonfigurasi untuk mendukung akses lintas port dan external URL. Edit `CORS_ORIGINS` di file `.env`:

```env
CORS_ORIGINS=http://localhost:5173,https://frontend.yourdomain.com
```

## API Endpoints

### Base URL
`http://localhost:3000`

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user baru |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user profile |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | Get all students |
| GET | `/api/students/:id` | Get student by ID |
| POST | `/api/students` | Create new student |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |

### Parents, Teachers, Quran, Attendance, Rewards, Clinic, Academic
Lihat file `postman_collection.json` untuk dokumentasi lengkap semua endpoints.

## Authentication

Gunakan JWT Token yang didapat dari login sebagai Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3000/api/students
```

## User Roles

- `admin` - Full access
- `teacher` - Access to students, attendance, grades, quran
- `staff` - Administrative access
- `student` - Limited access to own data
- `parent` - Access to children's data
- `clinic` - Access to clinic features

## Scripts

```bash
bun run dev          # Run development server with hot reload
bun run start        # Run production server
bun run db:generate  # Generate database migrations
bun run db:migrate   # Run migrations
bun run db:push      # Push schema directly to database
bun run db:studio    # Open Drizzle Studio
```

## Testing di Postman

Import file `postman_collection.json` ke Postman untuk testing semua endpoints.

## License

MIT
