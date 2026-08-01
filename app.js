// Mengimpor library Express.js sebagai framework utama backend
const express = require("express");

// Mengimpor library untuk merender antarmuka web dokumentasi API
const swaggerUi = require("swagger-ui-express");
// Mengimpor library untuk membaca anotasi komentar di kode dan mengubahnya menjadi format spesifikasi OpenAPI
const swaggerJsdoc = require("swagger-jsdoc");

// Mengimpor Morgan, middleware untuk mencatat (logging) setiap HTTP request yang masuk ke terminal
const morgan = require("morgan");

// Mengimpor pool koneksi PostgreSQL untuk menguji apakah database sudah siap
const pool = require("./config/db");

// Mengimpor kumpulan rute (endpoint) khusus untuk entitas presensi
const attendanceRoutes = require("./routes/attendanceRoutes");

// Menginisialisasi aplikasi Express
const app = express();

// Memasang middleware Morgan dengan format 'dev' (menampilkan method, status code, dan waktu respons dengan warna)
app.use(morgan("dev"));
// Memasang middleware bawaan Express untuk mem-parsing body request yang berformat JSON (application/json)
app.use(express.json());

// Menguji koneksi ke database saat server pertama kali dijalankan
pool
  .query("SELECT NOW()")
  .then((res) => console.log("DB Connected:", res.rows[0])) // Jika sukses, cetak waktu dari database
  .catch((err) => console.error(err)); // Jika gagal, cetak pesan error

// ============================================================================
// 1. Konfigurasi Swagger Option
// ============================================================================
const swaggerOptions = {
  definition: {
    openapi: "3.0.0", // Versi spesifikasi OpenAPI yang digunakan
    info: {
      title: "Attendance API - Pusdatik Intern Test",
      version: "1.0.0",
      description: "Dokumentasi REST API untuk sistem manajemen presensi.",
    },
    servers: [
      {
        url: "http://localhost:3000", // Base URL server saat tahap pengembangan lokal
        description: "Local server",
      },
    ],
    // Mendefinisikan mekanisme keamanan (Security Scheme) yang digunakan aplikasi
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT", // Memberi tahu Swagger bahwa kita menggunakan JSON Web Token
        },
      },
    },
    // Mengaplikasikan skema keamanan bearerAuth ke seluruh endpoint secara global secara default
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Memberitahu Swagger di mana letak file yang berisi anotasi dokumentasi (@swagger)
  apis: ["./routes/*.js"],
};

// ============================================================================
// 2. Inisialisasi Swagger JSDoc
// ============================================================================
// Men-generate spesifikasi JSON OpenAPI berdasarkan opsi dan file yang sudah ditentukan di atas
const swaggerSpecs = swaggerJsdoc(swaggerOptions);

// ============================================================================
// 3. MOUNTING ROUTE UI SWAGGER
// ============================================================================
// PENTING: Rute ini HARUS diletakkan di atas rute aplikasi utama (attendanceRoutes).
// Hal ini bertujuan agar endpoint '/api-docs' tidak ikut terblokir oleh middleware validasi JWT
// yang mungkin terpasang secara global atau dipasang di dalam attendanceRoutes.
// Dengan urutan ini, Swagger dapat diakses secara publik (Public Access).
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// ============================================================================
// 4. MOUNTING ROUTER APLIKASI
// ============================================================================
// Mendaftarkan semua endpoint yang ada di dalam attendanceRoutes ke root URL ('/')
app.use("/", attendanceRoutes);

// Membuat endpoint root sederhana untuk mengecek apakah server merespons (Health Check)
app.get("/", (req, res) => {
  res.send("API Running...");
});

// ============================================================================
// 5. START SERVER
// ============================================================================
// Menjalankan aplikasi server pada port 3000
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
