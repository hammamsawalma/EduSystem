const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { auditLogger } = require('../middleware/audit');
const exportController = require('../controllers/exportController');

// Apply authentication middleware to all routes
router.use(authenticate);

// Apply audit logging to all routes with proper parameters
router.use(auditLogger('Data export accessed', 'system'));

/**
 * @route   GET /api/exports/students
 * @desc    Export students data
 * @access  Private (Teachers only)
 * @query   format (csv, excel, pdf), includeStats (boolean)
 */
router.get('/students', exportController.exportStudents);

/**
 * @route   GET /api/exports/payments
 * @desc    Export payments data
 * @access  Private (Teachers only)
 * @query   format (csv, excel, pdf), startDate, endDate
 */
router.get('/payments', exportController.exportPayments);

/**
 * @route   GET /api/exports/attendance
 * @desc    Export attendance data
 * @access  Private (Teachers only)
 * @query   format (csv, excel, pdf), startDate, endDate, studentId
 */
router.get('/attendance', exportController.exportAttendance);

/**
 * @route   GET /api/exports/time-entries
 * @desc    Export time entries data
 * @access  Private (Teachers only)
 * @query   format (csv, excel, pdf), startDate, endDate
 */
router.get('/time-entries', exportController.exportTimeEntries);

/**
 * @route   GET /api/exports/expenses
 * @desc    Export expenses data
 * @access  Private (Teachers only)
 * @query   format (csv, excel, pdf), startDate, endDate
 */
router.get('/expenses', exportController.exportExpenses);

/**
 * @route   POST /api/exports/cleanup
 * @desc    Clean up old export files
 * @access  Private (Teachers only)
 */
router.post('/cleanup', exportController.cleanupExports);

module.exports = router;
