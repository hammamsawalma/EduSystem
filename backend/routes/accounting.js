const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, isAdmin } = require('../middleware/auth');
const accountingController = require('../controllers/accountingController');

// Middleware to ensure only admin can access accounting routes
router.use(authenticate);
router.use(isAdmin);

/**
 * @route   GET /api/accounting/students
 * @desc    Get student accounting overview (revenues)
 * @access  Private (Admin)
 */
router.get('/students',  accountingController.getStudentAccounting);

/**
 * @route   GET /api/accounting/teachers
 * @desc    Get teacher accounting overview (expenses)
 * @access  Private (Admin)
 */
router.get('/teachers',  accountingController.getTeacherAccounting);

/**
 * @route   GET /api/accounting/expenses
 * @desc    Get general expenses overview
 * @access  Private (Admin)
 */
router.get('/expenses',  accountingController.getGeneralExpenses);

/**
 * @route   POST /api/accounting/reports
 * @desc    Generate comprehensive financial report
 * @access  Private (Admin)
 */
router.post('/reports', [
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('reportType').optional().isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']).withMessage('Invalid report type')
], accountingController.generateFinancialReport);

/**
 * @route   GET /api/accounting/reports
 * @desc    Get saved financial reports
 * @access  Private (Admin)
 */
router.get('/reports',  accountingController.getFinancialReports);

/**
 * @route   GET /api/accounting/profit-loss
 * @desc    Get profit/loss summary
 * @access  Private (Admin)
 */
router.get('/profit-loss',  accountingController.getProfitLossSummary);

/**
 * @route   GET /api/accounting/comparison
 * @desc    Get financial comparison between periods
 * @access  Private (Admin)
 */
router.get('/comparison',  accountingController.getFinancialComparison);

/**
 * @route   GET /api/accounting/cashflow
 * @desc    Get cash flow summary
 * @access  Private (Admin)
 */
router.get('/cashflow',  accountingController.getCashFlow);

module.exports = router;
