// Mengimpor konfigurasi koneksi pool PostgreSQL dari folder config
const pool = require('../config/db');

const createAttendance = async (req, res) => {
  try {
    // Mendestrukturisasi data yang dikirimkan dari body request (payload) client
    const { employee_name, attendance_date, check_in, check_out, status, notes } = req.body;
    const errors = {}; // Membuat objek kosong untuk menampung pesan error validasi

    // 1. Validasi Business Rules
    // Mengecek apakah nama pegawai diisi
    if (!employee_name) errors.employee_name = ["Employee name is required."];
    // Mengecek apakah tanggal presensi diisi
    if (!attendance_date) errors.attendance_date = ["Attendance date is required."];

    // Daftar status presensi yang diizinkan oleh sistem
    const validStatuses = ['Present', 'Sick', 'Leave', 'Absent'];
    // Memastikan status diisi dan nilainya sesuai dengan daftar validStatuses
    if (!status || !validStatuses.includes(status)) {
      errors.status = ["Status must be Present, Sick, Leave, or Absent."];
    }

    // Jika statusnya hadir (Present), maka waktu check-in wajib diisi
    if (status === 'Present' && !check_in) {
      errors.check_in = ["Check-in time is required when status is Present."];
    }

    // Jika waktu check-in dan check-out ada, pastikan check-out tidak lebih awal dari check-in
    if (check_in && check_out && check_out < check_in) {
        errors.check_out = ["Check-out time cannot be earlier than check-in time."];
    }

    // Jika objek errors memiliki isi (ada yang gagal validasi), kembalikan respons 400 (Bad Request)
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors // Mengembalikan daftar detail error ke client
      });
    }

    // 2. Insert ke Database
    // Menyusun raw query SQL. Klausa RETURNING * digunakan agar PostgreSQL langsung mengembalikan data yang baru saja disisipkan
    const query = `
      INSERT INTO attendances (employee_name, attendance_date, check_in, check_out, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    // Menyiapkan array nilai untuk mencegah serangan SQL Injection. Menggunakan null jika nilai undefined/kosong
    const values = [employee_name, attendance_date, check_in || null, check_out || null, status, notes || null];

    // Mengeksekusi query ke database
    const result = await pool.query(query, values);

    // 3. Respons Berhasil
    // Mengembalikan kode HTTP 201 (Created) menandakan data baru sukses dibuat
    return res.status(201).json({
      success: true,
      message: "Attendance created successfully",
      data: result.rows[0] // Mengambil baris pertama dari hasil kembalian database
    });

  } catch (error) {
    // Menangkap error Unique Constraint dari PostgreSQL (Kode 23505) saat mencoba insert presensi ganda di hari yang sama
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: {
          attendance_date: ["Attendance data for this employee on this date already exists."]
        }
      });
    }

    // Mencetak error teknis ke konsol server untuk keperluan debugging
    console.error(error);
    // Mengembalikan HTTP 500 (Internal Server Error) ke client jika terjadi masalah tak terduga
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const getAttendances = async (req, res) => {
  try {
    // Mengambil parameter kueri dari URL (req.query) dengan memberikan nilai default jika tidak dikirim
    let { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      date, 
      sortBy = 'created_at', 
      sortOrder = 'DESC' 
    } = req.query;

    // Persiapan Pagination: Mengonversi string dari query URL menjadi angka integer (bilangan bulat)
    page = parseInt(page);
    limit = parseInt(limit);
    // Menghitung titik awal data yang akan diambil (offset) berdasarkan halaman saat ini
    const offset = (page - 1) * limit;

    // Variabel untuk menyusun parameter kondisi (WHERE) query SQL secara dinamis
    // Selalu filter data yang kolom deleted_at-nya NULL (Implementasi pembacaan data Soft Delete)
    let whereClauses = ['deleted_at IS NULL']; 
    let values = []; // Array untuk menampung nilai parameter SQL
    let valueIndex = 1; // Variabel counter untuk urutan parameter (contoh: $1, $2, dst.)

    // 1. Fitur Bonus: Search berdasarkan nama karyawan menggunakan pencocokan parsial (ILIKE untuk case-insensitive)
    if (search) {
      whereClauses.push(`employee_name ILIKE $${valueIndex}`);
      values.push(`%${search}%`); // Menambahkan % agar cocok dengan string di posisi manapun
      valueIndex++;
    }

    // 2. Fitur Bonus: Filtering persis berdasarkan status kehadiran
    if (status) {
      whereClauses.push(`status = $${valueIndex}`);
      values.push(status);
      valueIndex++;
    }

    // 3. Fitur Bonus: Filtering persis berdasarkan tanggal tertentu
    if (date) {
      whereClauses.push(`attendance_date = $${valueIndex}`);
      values.push(date);
      valueIndex++;
    }

    // Menggabungkan semua klausa WHERE yang ada dalam array menggunakan operator AND
    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 4. Fitur Bonus: Sorting (Pengurutan Data)
    // Whitelist: Mendefinisikan kolom dan arah pengurutan yang diizinkan untuk mencegah celah SQL Injection
    const validSortColumns = ['employee_name', 'attendance_date', 'check_in', 'status', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];
    
    // Fallback: Jika nilai sorting tidak valid, kembalikan ke nilai default
    if (!validSortColumns.includes(sortBy)) sortBy = 'created_at';
    if (!validSortOrders.includes(sortOrder.toUpperCase())) sortOrder = 'DESC';

    // Query 1: Menghitung total seluruh data yang cocok dengan filter (dibutuhkan untuk membuat meta data pagination)
    const countQuery = `SELECT COUNT(*) FROM attendances ${whereString}`;
    const countResult = await pool.query(countQuery, values);
    const totalItems = parseInt(countResult.rows[0].count); // Total baris keseluruhan
    const totalPages = Math.ceil(totalItems / limit); // Menghitung total halaman pembagian pembulatan ke atas

    // Query 2: Mengambil data aktual dengan batasan jumlah (LIMIT) dan lompatan baris (OFFSET)
    const query = `
      SELECT * FROM attendances 
      ${whereString} 
      ORDER BY ${sortBy} ${sortOrder} 
      LIMIT $${valueIndex} OFFSET $${valueIndex + 1};
    `;
    
    // Menyisipkan nilai limit dan offset ke dalam urutan array values ($ parameter)
    const queryValues = [...values, limit, offset];
    const result = await pool.query(query, queryValues);

    // Mengembalikan respons HTTP 200 (OK) dengan format rapi beserta meta data pagination
    return res.status(200).json({
      success: true,
      message: "Attendances retrieved successfully",
      data: result.rows,
      meta: {
        total_items: totalItems,
        total_pages: totalPages,
        current_page: page,
        limit: limit
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const getAttendanceById = async (req, res) => {
  try {
    // Mengambil parameter id dari URL /attendances/:id
    const { id } = req.params;
    
    // Melakukan query pencarian berdasarkan id. Ditambahkan klausa deleted_at IS NULL agar data yang ter-soft-delete tidak bisa diakses
    const query = `SELECT * FROM attendances WHERE id = $1 AND deleted_at IS NULL`;
    const result = await pool.query(query, [id]);

    // Jika database mengembalikan array kosong, berarti data tidak ditemukan
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found"
      });
    }

    // Mengembalikan data tunggal yang ditemukan
    return res.status(200).json({
      success: true,
      message: "Attendance retrieved successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const updateAttendance = async (req, res) => {
  try {
    // Mengambil ID dari parameter URL
    const { id } = req.params;
    // Mendestrukturisasi nilai terbaru dari body request
    const { employee_name, attendance_date, check_in, check_out, status, notes } = req.body;
    const errors = {};

    // 1. Validasi Business Rules (Logika ini sama persis seperti pada fungsi POST)
    if (!employee_name) errors.employee_name = ["Employee name is required."];
    if (!attendance_date) errors.attendance_date = ["Attendance date is required."];
    
    const validStatuses = ['Present', 'Sick', 'Leave', 'Absent'];
    if (!status || !validStatuses.includes(status)) {
      errors.status = ["Status must be Present, Sick, Leave, or Absent."];
    }

    if (status === 'Present' && !check_in) {
      errors.check_in = ["Check-in time is required when status is Present."];
    }

    if (check_in && check_out && check_out < check_in) {
        errors.check_out = ["Check-out time cannot be earlier than check-in time."];
    }

    // Kembalikan error 400 jika ada input yang tidak lolos validasi
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors
      });
    }

    // 2. Cek eksistensi data sebelum di-update
    // Pastikan data dengan ID tersebut memang ada dan belum dalam kondisi terhapus (soft delete)
    const checkQuery = `SELECT * FROM attendances WHERE id = $1 AND deleted_at IS NULL`;
    const checkResult = await pool.query(checkQuery, [id]);
    
    // Jika data tidak ditemukan, batalkan proses update dan kembalikan 404
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found"
      });
    }

    // 3. Lakukan Update Data
    // Menyusun query UPDATE, sekaligus memperbarui nilai updated_at dengan fungsi CURRENT_TIMESTAMP bawaan Postgres
    const updateQuery = `
      UPDATE attendances 
      SET employee_name = $1, attendance_date = $2, check_in = $3, check_out = $4, status = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *;
    `;
    // Memasukkan array urutan nilai, diakhiri dengan ID sebagai penentu ($7)
    const values = [employee_name, attendance_date, check_in || null, check_out || null, status, notes || null, id];
    
    // Mengeksekusi proses update ke database
    const result = await pool.query(updateQuery, values);

    // Mengembalikan data hasil pembaruan ke client
    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data: result.rows[0]
    });

  } catch (error) {
    // Menangani error pelanggaran Unique Constraint saat proses update (jika mengubah tanggal/nama menjadi ganda)
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: {
          attendance_date: ["Attendance data for this employee on this date already exists."]
        }
      });
    }
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteAttendance = async (req, res) => {
  try {
    // Mengambil parameter ID dari URL
    const { id } = req.params;

    // 1. Cek eksistensi data yang BELUM dihapus
    const checkQuery = `SELECT * FROM attendances WHERE id = $1 AND deleted_at IS NULL`;
    const checkResult = await pool.query(checkQuery, [id]);
    
    // Kembalikan respons 404 jika data memang tidak ada atau sudah pernah di-soft-delete sebelumnya
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found"
      });
    }

    // 2. Lakukan Soft Delete 
    // Data tidak di-DELETE (hard delete) dari tabel, melainkan kolom deleted_at diisi dengan waktu saat ini (CURRENT_TIMESTAMP)
    const deleteQuery = `UPDATE attendances SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`;
    await pool.query(deleteQuery, [id]);

    // Mengembalikan respons HTTP 200 (OK) untuk menandakan proses hapus berhasil
    return res.status(200).json({
      success: true,
      message: "Attendance deleted successfully"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Mengekspor semua fungsi agar dapat di-import dan digunakan sebagai endpoint di dalam file routes (attendanceRoutes.js)
module.exports = {
  createAttendance,
  getAttendances,
  getAttendanceById,
  updateAttendance,
  deleteAttendance
};