const express = require('express');
const router = express.Router();
const attendanceController = require('../controller/attendanceController');
const authController = require('../controller/authController');
const authenticateJWT = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoint untuk otentikasi
 */

/**
 * @swagger
 * tags:
 *   name: Attendances
 *   description: Manajemen data presensi karyawan
 */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login untuk mendapatkan token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login berhasil dan mengembalikan token
 *       401:
 *         description: Kredensial tidak valid
 */
router.post('/login', authController.login);

// Middleware proteksi JWT untuk seluruh route di bawahnya
router.use(authenticateJWT);

/**
 * @swagger
 * /attendances:
 *   post:
 *     summary: Membuat rekam presensi baru
 *     description: Memasukkan data presensi karyawan (mematuhi aturan 1 data per karyawan per hari).
 *     tags: [Attendances]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_name
 *               - attendance_date
 *               - status
 *             properties:
 *               employee_name:
 *                 type: string
 *               attendance_date:
 *                 type: string
 *                 format: date
 *               check_in:
 *                 type: string
 *                 format: time
 *               check_out:
 *                 type: string
 *                 format: time
 *               status:
 *                 type: string
 *                 enum: [Present, Sick, Leave, Absent]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Data presensi berhasil dibuat
 *       400:
 *         description: Validasi gagal (misal karyawan sudah absen hari ini)
 *       401:
 *         description: Unauthorized (Token tidak valid/kedaluwarsa)
 */
router.post('/attendances', attendanceController.createAttendance);

/**
 * @swagger
 * /attendances:
 *   get:
 *     summary: Mendapatkan daftar presensi
 *     description: Mengambil data presensi dengan dukungan pencarian, penyaringan, pengurutan, dan pagination.
 *     tags: [Attendances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Cari berdasarkan nama karyawan
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Present, Sick, Leave, Absent]
 *         description: Filter berdasarkan status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Kolom untuk diurutkan (misal attendance_date)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Arah pengurutan
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Nomor halaman
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Jumlah data per halaman
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
 *       401:
 *         description: Unauthorized (Token tidak valid/kedaluwarsa)
 */
router.get('/attendances', attendanceController.getAttendances);

/**
 * @swagger
 * /attendances/{id}:
 *   get:
 *     summary: Mendapatkan detail presensi berdasarkan ID
 *     tags: [Attendances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID presensi
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
 *       404:
 *         description: Data presensi tidak ditemukan
 *       401:
 *         description: Unauthorized (Token tidak valid/kedaluwarsa)
 */
router.get('/attendances/:id', attendanceController.getAttendanceById);

/**
 * @swagger
 * /attendances/{id}:
 *   put:
 *     summary: Memperbarui data presensi
 *     description: Digunakan untuk mengubah status atau mencatat waktu pulang (clock out).
 *     tags: [Attendances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID presensi yang ingin diubah
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employee_name:
 *                 type: string
 *               attendance_date:
 *                 type: string
 *                 format: date
 *               check_in:
 *                 type: string
 *                 format: time
 *               check_out:
 *                 type: string
 *                 format: time
 *               status:
 *                 type: string
 *                 enum: [Present, Sick, Leave, Absent]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Data berhasil diperbarui
 *       404:
 *         description: Data presensi tidak ditemukan
 *       401:
 *         description: Unauthorized (Token tidak valid/kedaluwarsa)
 */
router.put('/attendances/:id', attendanceController.updateAttendance);

/**
 * @swagger
 * /attendances/{id}:
 *   delete:
 *     summary: Menghapus data presensi (Soft Delete)
 *     description: Menandai data presensi sebagai terhapus tanpa menghapus *record* asli dari *database*.
 *     tags: [Attendances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID presensi yang ingin dihapus
 *     responses:
 *       200:
 *         description: Data berhasil dihapus (soft delete)
 *       404:
 *         description: Data presensi tidak ditemukan
 *       401:
 *         description: Unauthorized (Token tidak valid/kedaluwarsa)
 */
router.delete('/attendances/:id', attendanceController.deleteAttendance);

module.exports = router;