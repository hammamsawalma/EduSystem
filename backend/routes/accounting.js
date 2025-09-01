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
 * @route   POST /api/accounting/expenses
 * @desc    Create a new expense
 * @access  Private (Admin)
 */
router.post('/expenses', [
  body('category').notEmpty().withMessage('Category is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('description').notEmpty().withMessage('Description is required'),
  body('expenseDate').isISO8601().withMessage('Valid expense date is required'),
  body('paymentMethod').optional().isIn(['cash', 'bank_transfer', 'credit_card', 'debit_card', 'cheque', 'digital_wallet']).withMessage('Invalid payment method'),
  body('status').optional().isIn(['pending', 'approved', 'paid', 'rejected']).withMessage('Invalid status')
], accountingController.createExpense);

/**
 * @route   GET /api/accounting/expenses/:id
 * @desc    Get single expense details
 * @access  Private (Admin)
 */
router.get('/expenses/:id', accountingController.getExpenseById);

/**
 * @route   PUT /api/accounting/expenses/:id
 * @desc    Update an expense
 * @access  Private (Admin)
 */
router.put('/expenses/:id', [
  body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('expenseDate').optional().isISO8601().withMessage('Valid expense date is required'),
  body('status').optional().isIn(['pending', 'approved', 'paid', 'rejected']).withMessage('Invalid status')
], accountingController.updateExpense);

/**
 * @route   DELETE /api/accounting/expenses/:id
 * @desc    Delete an expense
 * @access  Private (Admin)
 */
router.delete('/expenses/:id', accountingController.deleteExpense);

/**
 * @route   PUT /api/accounting/expenses/:id/approve
 * @desc    Approve an expense
 * @access  Private (Admin)
 */
router.put('/expenses/:id/approve', accountingController.approveExpense);

/**
 * @route   PUT /api/accounting/expenses/:id/reject
 * @desc    Reject an expense
 * @access  Private (Admin)
 */
router.put('/expenses/:id/reject', [
  body('reason').notEmpty().withMessage('Rejection reason is required')
], accountingController.rejectExpense);

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
