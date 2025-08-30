const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticate, isAdminOrTeacher, authorize } = require('../middleware/auth');
const { auditLoggers, capturePreviousValues } = require('../middleware/audit');

// All routes require authentication
router.use(authenticate);
router.use(isAdminOrTeacher);

// Get all classes
router.get('/', classController.getClasses);

// Get single class
router.get('/:id', classController.getClass);

// Create class
router.post('/', auditLoggers.classCreate, classController.createClass);

// Update class
router.put('/:id', 
  capturePreviousValues('Class'),
  auditLoggers.classUpdate, 
  classController.updateClass
);

// Delete class
router.delete('/:id', auditLoggers.classDelete, classController.deleteClass);

// Assign students to class (admin only)
router.post('/assign-students', authorize('admin'), auditLoggers.classAssignStudents, classController.assignStudentsToClass);

// Get students assigned to a class
router.get('/:id/students', classController.getClassStudents);

// Remove student from class (admin only)
router.delete('/:classId/students/:studentId', authorize('admin'), auditLoggers.classRemoveStudent, classController.removeStudentFromClass);

module.exports = router;
