# Pusdatik Attendance REST API

API ini dibangun sebagai pemenuhan tugas Technical Test Backend Developer Intern di Pusdatik Kemnaker. Aplikasi ini dirancang untuk mencatat data kehadiran pegawai, mendukung proses CRUD dengan aturan bisnis yang ketat, serta mengimplementasikan berbagai fitur tambahan untuk memastikan keandalan dan keamanan sistem.

---

## 1. Teknologi yang Digunakan

- **Node.js & Express.js:** Framework utama untuk membangun REST API yang cepat dan terstruktur.
- **PostgreSQL:** Relational Database Management System (RDBMS) utama penyimpan data.
- **pg (node-postgres):** Driver native untuk menghubungkan aplikasi Node.js dengan database PostgreSQL menggunakan raw query murni.
- **JSON Web Token (JWT):** Mekanisme autentikasi endpoint dengan masa berlaku token (kedaluwarsa dalam 30 menit).
- **Swagger (swagger-ui-express & swagger-jsdoc):** Modul untuk men-generate Antarmuka Web Dokumentasi OpenAPI secara otomatis berdasarkan anotasi di dalam kode.
- **Morgan:** Middleware untuk mencatat (logging) setiap aktivitas HTTP request yang masuk ke server.

---

## 2. Struktur Folder

Proyek ini mengadopsi pola arsitektur MVC (Model-View-Controller) tanpa _View_ (karena ini adalah REST API) untuk memastikan pemisahan _concern_ yang bersih.

```text
pusdatik-attendance/
├── config/
│   ├── db.js                 # Konfigurasi dan koneksi pool PostgreSQL
│   └── initDb.js             # Script otomatisasi migrasi database dan seeder
├── controller/
│   ├── attendanceController.js # Logika bisnis untuk entitas presensi
│   └── authController.js       # Logika bisnis untuk proses login dan otentikasi
├── database/
│   ├── schema.sql            # Script DDL untuk membuat tabel dan constraint
│   └── seeder.sql            # Script DML untuk memasukkan data awal (dummy)
├── middleware/
│   └── auth.js               # Middleware untuk memvalidasi token JWT
├── routes/
│   └── attendanceRoutes.js   # Definisi endpoint API dan anotasi Swagger
├── .env                      # Variabel environment (tidak di-commit ke Git)
├── app.js                    # Entry point aplikasi utama
├── package.json              # Daftar dependencies aplikasi
└── README.md                 # Dokumentasi proyek
```

## 3. Penjelasan Desain Aplikasi

- Arsitektur RESTful: Semua antarmuka komunikasi didesain mematuhi standar REST, menggunakan HTTP verbs (GET, POST, PUT, DELETE) secara semantik.

- Integritas Database (Constraint): Aturan bisnis seperti "1 kehadiran per pegawai per hari" dan validasi status presensi (Present, Sick, Leave, Absent) tidak hanya ditangani di level kode (Node.js), melainkan ditegakkan secara kuat di level database menggunakan fitur UNIQUE constraint dan CHECK logic pada file migrasi manual SQL.

- Fitur Pencarian & Penyaringan (Bonus): Endpoint pengambilan data dilengkapi dengan parameter kueri (req.query) untuk mendukung pencarian berdasarkan nama, penyaringan berdasarkan status, pengurutan data, serta pagination untuk mengoptimalkan response data dalam jumlah besar.

- Soft Delete: Penghapusan data tidak dilakukan secara permanen (hard delete), melainkan memanfaatkan kolom deleted_at. Data yang telah dihapus akan disembunyikan dari hasil query utama.

- Keamanan: Rute API dilindungi menggunakan token JWT yang harus dikirimkan melalui header `Authorization: Bearer <token>`.

## 4. Pemilihan Tipe Data

- `id` menggunakan `SERIAL` (atau `INT GENERATED ALWAYS AS IDENTITY`) sebagai Primary Key agar mendapatkan angka urut (auto-increment) unik secara otomatis.

- `employee_name` menggunakan `VARCHAR(100)` dengan batas panjang karakter yang wajar untuk efisiensi indeks dan memadai untuk nama lengkap.

- `attendance_date` menggunakan tipe data `DATE` (tanpa jam/menit). Hal ini sangat penting agar validasi data per hari menjadi presisi tanpa terpengaruh zona waktu atau jam check-in.

- `check_in` dan `check_out` menggunakan tipe data TIME karena hanya membutuhkan informasi jam kedatangan/kepulangan tanpa memerlukan data tanggal yang sudah terwakili di `attendance_date`.

- status menggunakan `VARCHAR(20)`. Batas karakter dibuat kecil (20) untuk optimasi memori karena hanya digunakan untuk menampung status pendek (Present, Sick, Leave, Absent).

- `created_at` menggunakan `TIMESTAMP` dengan nilai default `CURRENT_TIMESTAMP` untuk mencatat waktu (tanggal dan jam) secara otomatis kapan data presensi pertama kali dibuat (audit trail).

- `updated_at` menggunakan `TIMESTAMP` dengan nilai default `CURRENT_TIMESTAMP` untuk melacak kapan terakhir kali baris data tersebut mengalami perubahan (misalnya saat check-out).

- `deleted_at` menggunakan `TIMESTAMP` (atau `TIMESTAMP WITH TIME ZONE`) untuk merekam dengan akurat kapan sebuah baris data dihapus (mendukung fitur soft delete).

## 5. Mencegah Data Presensi Ganda

- Level Aplikasi (Node.js): Sebelum mengeksekusi query `INSERT`, controller akan melakukan pengecekan `SELECT` untuk memastikan tidak ada data atas nama karyawan tersebut pada tanggal yang diinputkan.

- Level Database (PostgreSQL): Diimplementasikan mekanisme Partial Unique Index. Script DDL mengeksekusi:
  `CREATE UNIQUE INDEX unique_attendance_per_day ON attendances (employee_name, attendance_date) WHERE deleted_at IS NULL;`
  Dengan cara ini, database secara absolut akan menolak insert data ganda pada hari yang sama, namun tetap mengizinkan pembuatan data baru jika presensi sebelumnya telah di-soft-delete (karena data yang di-soft-delete tidak dihitung oleh indeks unik tersebut).

## 6. Cara menajalankan Aplikasi

- Lakukan clone repositori ini ke mesin lokal Anda.

- Buka terminal pada direktori root proyek dan jalankan perintah npm install untuk mengunduh seluruh dependencies.

- Buat database baru di PostgreSQL lokal Anda (misal: pusdatik_attendance).

- Eksekusi script SQL yang terdapat di dalam folder database/schema.sql terlebih dahulu, disusul dengan database/seeder.sql ke dalam database tersebut.

- Buat file bernama .env di root folder dan isi dengan konfigurasi berikut:

```code
PORT=3000
DB_USER=postgres
DB_PASS=password_anda
DB_HOST=localhost
DB_NAME=pusdatik_attendance
DB_PORT=5432
JWT_SECRET=secret_key_anda
ADMIN_USERNAME=username_anda
ADMIN_PASSWORD=password_anda
```

- Mengganti isi scripts di file pacakge.json menjadi berikut:

```
  "scripts": {
    "dev": "nodemon src/app.js",
    "start": "node src/app.js",
    "migrate": "node config/initDb.js"
  },
```

- Jalankan `npm run dev` di terminal dengan letak terminal berada setara dengan file app.js

## 7. Dokumentasi API

Aplikasi ini dilengkapi dengan antarmuka dokumentasi API interaktif. Setelah server berjalan, Anda dapat melihat spesifikasi OpenAPI dan menguji seluruh endpoint langsung melalui browser.

- Buka URL berikut di browser Anda: `http://localhost:3000/api-docs`

## 8. Kendala yang ditemui dan Solusinya

- Pemblokiran Akses UI Swagger oleh Middleware Auth: Halaman dokumentasi /api-docs mengembalikan pesan Access Denied (No token provided) karena ikut terproteksi oleh middleware validasi JWT global di aplikasi. Solusinya yaitu dengan memperbaiki urutan mounting route di app.js. Rute untuk UI Swagger dipindahkan ke baris atas, sebelum pemanggilan router aplikasi utama, sehingga dokumentasi tetap bersifat publik (public access) sementara rute API lainnya tetap aman terlindungi JWT.
- Pemblokiran Akses UI Swagger oleh Middleware Auth: Halaman dokumentasi /api-docs mengembalikan pesan Access Denied (No token provided) karena ikut terproteksi oleh middleware validasi JWT global di aplikasi. Solusinya yaitu memperbaiki urutan mounting route di app.js. Rute untuk UI Swagger dipindahkan ke baris atas, sebelum pemanggilan router aplikasi utama, sehingga dokumentasi tetap bersifat publik (public access) sementara rute API lainnya tetap aman terlindungi JWT.
