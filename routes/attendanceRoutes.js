const express = require('express');
const router = express.Router();
const attendanceController = require('../controller/attendanceController');
const authController = require('../controller/authController');
const authenticateJWT = require('../middleware/auth');

router.post('/login', authController.login);

router.use(authenticateJWT);

router.post('/attendances', attendanceController.createAttendance);
router.get('/attendances', attendanceController.getAttendances);
router.get('/attendances/:id', attendanceController.getAttendanceById);
router.put('/attendances/:id', attendanceController.updateAttendance);
router.delete('/attendances/:id', attendanceController.deleteAttendance);

module.exports = router;