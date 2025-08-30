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

// PUT /api/students/bulk-update - Bulk update students (Admin only, must be before /:id)
router.put('/bulk-update', isAdmin, auditLoggers.studentBulkUpdate, studentController.bulkUpdateStudents);

// POST /api/students/assign-class - Assign student to class (Admin only)
router.post('/assign-class', isAdmin, studentController.assignStudentToClass);

// POST /api/students/remove-class - Remove student from class (Admin only)
router.post('/remove-class', isAdmin, studentController.removeStudentFromClass);

// GET /api/students/:id - Get single student
router.get('/:id', studentController.getStudent);

// POST /api/students - Create new student (Admin only)
router.post('/', isAdmin, auditLoggers.studentCreate, studentController.createStudent);

// PUT /api/students/:id - Update student (Admin only)
router.put('/:id', 
  isAdmin,
  capturePreviousValues('Student'),
  auditLoggers.studentUpdate, 
  studentController.updateStudent
);

// DELETE /api/students/:id - Delete student (Admin only)
router.delete('/:id', isAdmin, auditLoggers.studentDelete, studentController.deleteStudent);

module.exports = router;
