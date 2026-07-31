const pool = require("./database"); // Sesuaikan dengan path koneksi DB Anda
const fs = require("fs");
const path = require("path");

const initDatabase = async () => {
  try {
    const schemaPath = path.join(__dirname, "../../database/schema.sql");
    const sql = fs.readFileSync(schemaPath).toString();

    console.log("Menjalankan migrasi database...");
    await pool.query(sql);
    console.log("Migrasi database berhasil!");
    process.exit(0);
  } catch (error) {
    console.error("Gagal melakukan migrasi:", error);
    process.exit(1);
  }
};

initDatabase();
