const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate, isAdminOrTeacher, isAdmin } = require('../middleware/auth');
const { auditLoggers, capturePreviousValues } = require('../middleware/audit');

// All routes require authentication
router.use(authenticate);
router.use(isAdminOrTeacher);

// GET /api/expenses - Get all expenses
router.get('/', expenseController.getExpenses);

// GET /api/expenses/stats - Get expense statistics
router.get('/stats', expenseController.getExpenseStats);

// GET /api/expenses/pending - Get pending expenses (admin only)
router.get('/pending', isAdmin, expenseController.getPendingExpenses);

// GET /api/expenses/:id - Get single expense
router.get('/:id', expenseController.getExpense);

// POST /api/expenses - Create new expense
router.post('/', auditLoggers.expenseCreate, expenseController.createExpense);

// PUT /api/expenses/:id - Update expense
router.put('/:id', 
  capturePreviousValues('Expense'),
  auditLoggers.expenseUpdate, 
  expenseController.updateExpense
);

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', auditLoggers.expenseDelete, expenseController.deleteExpense);

// PUT /api/expenses/:id/approve - Approve expense (admin only)
router.put('/:id/approve', isAdmin, auditLoggers.expenseApprove, expenseController.approveExpense);

// PUT /api/expenses/:id/reject - Reject expense (admin only)
router.put('/:id/reject', isAdmin, auditLoggers.expenseReject, expenseController.rejectExpense);

module.exports = router;
