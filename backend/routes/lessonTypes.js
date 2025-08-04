const express = require('express');
const router = express.Router();
const lessonTypeController = require('../controllers/lessonTypeController');
const { authenticate, isAdminOrTeacher } = require('../middleware/auth');
const { auditLoggers, capturePreviousValues } = require('../middleware/audit');

// All routes require authentication
router.use(authenticate);
router.use(isAdminOrTeacher);

// GET /api/lesson-types - Get all lesson types
router.get('/', lessonTypeController.getLessonTypes);

// GET /api/lesson-types/stats - Get lesson type statistics
router.get('/stats', lessonTypeController.getLessonTypeStats);

// GET /api/lesson-types/:id - Get single lesson type
router.get('/:id', lessonTypeController.getLessonType);

// POST /api/lesson-types - Create new lesson type
router.post('/', auditLoggers.lessonTypeCreate, lessonTypeController.createLessonType);

// PUT /api/lesson-types/:id - Update lesson type
router.put('/:id', 
  capturePreviousValues('LessonType'),
  auditLoggers.lessonTypeUpdate, 
  lessonTypeController.updateLessonType
);

// DELETE /api/lesson-types/:id - Delete lesson type
router.delete('/:id', auditLoggers.lessonTypeDelete, lessonTypeController.deleteLessonType);

module.exports = router;
