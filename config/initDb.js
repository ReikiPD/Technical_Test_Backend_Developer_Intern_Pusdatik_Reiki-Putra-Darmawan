const pool = require("../config/db"); // Sesuaikan jika path konfigurasi db.js berbeda
const fs = require("fs");
const path = require("path");

const initDatabase = async () => {
  try {
    // Menentukan lokasi absolut untuk schema dan seeder
    // Menggunakan '../database' berasumsi initDb.js berada di dalam sub-folder (seperti /config atau /scripts)
    const schemaPath = path.join(__dirname, "../database/schema.sql");
    const seederPath = path.join(__dirname, "../database/seeder.sql");

    // Membaca isi file SQL
    const schemaSql = fs.readFileSync(schemaPath).toString();
    const seederSql = fs.readFileSync(seederPath).toString();

    console.log("Menjalankan migrasi skema database (schema.sql)...");
    await pool.query(schemaSql);
    console.log("✅ Migrasi skema database berhasil!");

    console.log("Menyiapkan data dummy (seeder.sql)...");
    await pool.query(seederSql);
    console.log("✅ Seeding data dummy berhasil!");

    console.log("Inisialisasi database selesai sepenuhnya.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Gagal melakukan inisialisasi database:", error);
    process.exit(1);
  }
};

initDatabase();