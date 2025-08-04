const express = require('express');
const router = express.Router();
const timeEntryController = require('../controllers/timeEntryController');
const { authenticate, isAdminOrTeacher } = require('../middleware/auth');
const { auditLoggers, capturePreviousValues } = require('../middleware/audit');

// All routes require authentication
router.use(authenticate);
router.use(isAdminOrTeacher);

// GET /api/time-entries - Get all time entries
router.get('/', timeEntryController.getTimeEntries);

// GET /api/time-entries/earnings-summary - Get earnings summary
router.get('/earnings-summary', timeEntryController.getEarningsSummary);

// GET /api/time-entries/:id - Get single time entry
router.get('/:id', timeEntryController.getTimeEntry);

// POST /api/time-entries - Create new time entry
router.post('/', auditLoggers.timeEntryCreate, timeEntryController.createTimeEntry);

// PUT /api/time-entries/:id - Update time entry
router.put('/:id', 
  capturePreviousValues('TimeEntry'),
  auditLoggers.timeEntryUpdate, 
  timeEntryController.updateTimeEntry
);

// DELETE /api/time-entries/:id - Delete time entry
router.delete('/:id', auditLoggers.timeEntryDelete, timeEntryController.deleteTimeEntry);

module.exports = router;
