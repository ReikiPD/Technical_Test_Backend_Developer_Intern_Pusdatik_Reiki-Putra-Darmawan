# Pusdatik Attendance REST API

API ini dibangun untuk Technical Test Backend Developer Intern Pusdatik Kemnaker. Aplikasi ini digunakan untuk mencatat data kehadiran pegawai yang meliputi proses CRUD dengan aturan bisnis yang ketat serta dilengkapi dengan fitur JWT Authentication, Pagination, Filtering, Search, dan Sorting.

## 1. Teknologi yang Digunakan
- **Node.js & Express.js:** Framework utama untuk membangun REST API.
- **PostgreSQL:** Database relational utama.
- **pg (node-postgres):** Driver untuk menghubungkan aplikasi Node.js dengan database PostgreSQL secara native dengan query murni.
- **JSON Web Token (JWT):** Digunakan untuk autentikasi endpoint.
- **Morgan:** Middleware untuk logging aktivitas HTTP request.

## 2. Cara Menjalankan Aplikasi

1. Clone repositori ini.
2. Jalankan perintah `npm install` untuk mengunduh semua dependencies.
3. Buat database di PostgreSQL lokal Anda (misal: `pusdatik_attendance`).
4. Jalankan script SQL yang ada di dalam folder `database/schema.sql` dan `database/seeder.sql` ke dalam database Anda.
5. Buat file `.env` di root folder dengan konfigurasi berikut:
   ```env
   PORT=3000
   DB_USER=postgres
   DB_PASS=password_anda
   DB_HOST=localhost
   DB_NAME=pusdatik_attendance
   DB_PORT=5432
   JWT_SECRET=secret_key_anda