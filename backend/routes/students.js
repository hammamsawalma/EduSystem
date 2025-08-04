const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate, isAdminOrTeacher, isAdmin } = require('../middleware/auth');
const { auditLoggers, capturePreviousValues } = require('../middleware/audit');

// All routes require authentication
router.use(authenticate);
router.use(isAdminOrTeacher);

// GET /api/students - Get all students
router.get('/', studentController.getStudents);

// GET /api/students/stats - Get student statistics
router.get('/stats', studentController.getStudentStats);

// PUT /api/students/bulk-update - Bulk update students (must be before /:id)
router.put('/bulk-update', auditLoggers.studentBulkUpdate, studentController.bulkUpdateStudents);

// GET /api/students/:id - Get single student
router.get('/:id', studentController.getStudent);

// POST /api/students - Create new student
router.post('/', auditLoggers.studentCreate, studentController.createStudent);

// PUT /api/students/:id - Update student
router.put('/:id', 
  capturePreviousValues('Student'),
  auditLoggers.studentUpdate, 
  studentController.updateStudent
);

// DELETE /api/students/:id - Delete student
router.delete('/:id', auditLoggers.studentDelete, studentController.deleteStudent);

module.exports = router;
