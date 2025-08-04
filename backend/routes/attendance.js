const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, isAdminOrTeacher, isAdmin } = require('../middleware/auth');
const { auditLoggers, capturePreviousValues } = require('../middleware/audit');

// All routes require authentication
router.use(authenticate);
router.use(isAdminOrTeacher);

// GET /api/attendance - Get all attendance records
router.get('/', attendanceController.getAttendanceRecords);

// GET /api/attendance/overview - Get teacher attendance overview
router.get('/overview', attendanceController.getTeacherAttendanceOverview);

// GET /api/attendance/patterns - Get attendance patterns
router.get('/patterns', attendanceController.getAttendancePatterns);

// GET /api/attendance/pending-makeups - Get pending makeups
router.get('/pending-makeups', attendanceController.getPendingMakeups);

// GET /api/attendance/student/:studentId/stats - Get student attendance statistics
router.get('/student/:studentId/stats', attendanceController.getStudentAttendanceStats);

// GET /api/attendance/:id - Get single attendance record
router.get('/:id', attendanceController.getAttendanceRecord);

// POST /api/attendance - Create new attendance record
router.post('/', auditLoggers.attendanceCreate, attendanceController.createAttendanceRecord);

// PUT /api/attendance/:id - Update attendance record
router.put('/:id', 
  capturePreviousValues('Attendance'),
  auditLoggers.attendanceUpdate, 
  attendanceController.updateAttendanceRecord
);

// DELETE /api/attendance/:id - Delete attendance record
router.delete('/:id', auditLoggers.attendanceDelete, attendanceController.deleteAttendanceRecord);

module.exports = router;
