const pool = require('../config/db');

const createAttendance = async (req, res) => {
  try {
    const { employee_name, attendance_date, check_in, check_out, status, notes } = req.body;
    const errors = {};

    // 1. Validasi Business Rules
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

    // Jika ada error validasi, kembalikan respons 400 sesuai format
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors
      });
    }

    // 2. Insert ke Database
    const query = `
      INSERT INTO attendances (employee_name, attendance_date, check_in, check_out, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [employee_name, attendance_date, check_in || null, check_out || null, status, notes || null];

    const result = await pool.query(query, values);

    // 3. Respons Berhasil
    return res.status(201).json({
      success: true,
      message: "Attendance created successfully",
      data: result.rows[0]
    });

  } catch (error) {
    // Menangkap error Unique Constraint dari PostgreSQL (Kode 23505)
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
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ... (kode createAttendance yang sudah ada sebelumnya) ...

const getAttendances = async (req, res) => {
  try {
    // Menangkap query parameter untuk fitur bonus
    let { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      date, 
      sortBy = 'created_at', 
      sortOrder = 'DESC' 
    } = req.query;

    // Persiapan Pagination
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    // Variabel untuk menyusun query SQL dinamis
    let whereClauses = [];
    let values = [];
    let valueIndex = 1;

    // 1. Fitur Bonus: Search berdasarkan nama karyawan
    if (search) {
      whereClauses.push(`employee_name ILIKE $${valueIndex}`); // ILIKE agar case-insensitive
      values.push(`%${search}%`);
      valueIndex++;
    }

    // 2. Fitur Bonus: Filtering berdasarkan status
    if (status) {
      whereClauses.push(`status = $${valueIndex}`);
      values.push(status);
      valueIndex++;
    }

    // 3. Fitur Bonus: Filtering berdasarkan tanggal
    if (date) {
      whereClauses.push(`attendance_date = $${valueIndex}`);
      values.push(date);
      valueIndex++;
    }

    // Menggabungkan semua klausa WHERE
    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 4. Fitur Bonus: Sorting
    // Whitelist kolom yang diizinkan untuk mencegah SQL Injection
    const validSortColumns = ['employee_name', 'attendance_date', 'check_in', 'status', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (!validSortColumns.includes(sortBy)) sortBy = 'created_at';
    if (!validSortOrders.includes(sortOrder.toUpperCase())) sortOrder = 'DESC';

    // Query 1: Menghitung total data (untuk metadata pagination)
    const countQuery = `SELECT COUNT(*) FROM attendances ${whereString}`;
    const countResult = await pool.query(countQuery, values);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // Query 2: Mengambil data aktual dengan Limit dan Offset
    const query = `
      SELECT * FROM attendances 
      ${whereString} 
      ORDER BY ${sortBy} ${sortOrder} 
      LIMIT $${valueIndex} OFFSET $${valueIndex + 1};
    `;
    
    const queryValues = [...values, limit, offset];
    const result = await pool.query(query, queryValues);

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
    const { id } = req.params;
    
    const query = `SELECT * FROM attendances WHERE id = $1`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found"
      });
    }

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
    const { id } = req.params;
    const { employee_name, attendance_date, check_in, check_out, status, notes } = req.body;
    const errors = {};

    // 1. Validasi Business Rules (Sama seperti POST)
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

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors
      });
    }

    // 2. Cek eksistensi data berdasarkan ID
    const checkQuery = `SELECT * FROM attendances WHERE id = $1`;
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found"
      });
    }

    // 3. Lakukan Update Data
    const updateQuery = `
      UPDATE attendances 
      SET employee_name = $1, attendance_date = $2, check_in = $3, check_out = $4, status = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *;
    `;
    const values = [employee_name, attendance_date, check_in || null, check_out || null, status, notes || null, id];
    
    const result = await pool.query(updateQuery, values);

    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data: result.rows[0]
    });

  } catch (error) {
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
    const { id } = req.params;

    // Cek eksistensi data
    const checkQuery = `SELECT * FROM attendances WHERE id = $1`;
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found"
      });
    }

    // Hapus data
    const deleteQuery = `DELETE FROM attendances WHERE id = $1`;
    await pool.query(deleteQuery, [id]);

    return res.status(200).json({
      success: true,
      message: "Attendance deleted successfully"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Jangan lupa update module.exports di bagian paling bawah file
module.exports = {
  createAttendance,
  getAttendances,
  getAttendanceById,
  updateAttendance,
  deleteAttendance
};
