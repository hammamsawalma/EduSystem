const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, isAdminOrTeacher, isAdmin } = require('../middleware/auth');
const teacherController = require('../controllers/teacherController');

// Middleware to ensure only admin can access most routes
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

router.use(authenticate);
router.use(isAdminOrTeacher);

/**
 * @route   GET /api/teachers
 * @desc    Get all teachers with payment summaries
 * @access  Private (Admin)
 */
router.get('/', teacherController.getAllTeachers);

/**
 * @route   GET /api/teachers/payments/overdue
 * @desc    Get overdue teacher payments
 * @access  Private (Admin)
 */
router.get('/payments/overdue', teacherController.getOverdueTeacherPayments);

/**
 * @route   GET /api/teachers/:id
 * @desc    Get teacher details with comprehensive payment tracking
 * @access  Private (Admin)
 */
router.get('/:id',  teacherController.getTeacherById);

/**
 * @route   GET /api/teachers/:id/payments
 * @desc    Get teacher payment history
 * @access  Private (Admin/Teacher)
 */
router.get('/:id/payments', teacherController.getTeacherPayments);

/**
 * @route   GET /api/teachers/:id/hours-analysis
 * @desc    Get teacher hours vs payments analysis
 * @access  Private (Admin)
 */
router.get('/:id/hours-analysis',  teacherController.getTeacherHoursAnalysis);

/**
 * @route   POST /api/teachers/:id/payments
 * @desc    Create teacher payment
 * @access  Private (Admin)
 */
router.post('/:id/payments', [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('paymentMethod').isIn(['cash', 'bank_transfer', 'check', 'online', 'card', 'mobile_payment']).withMessage('Invalid payment method'),
  body('paymentType').isIn(['salary', 'hourly_payment', 'bonus', 'commission', 'reimbursement', 'advance', 'other']).withMessage('Invalid payment type'),
  body('periodCovered.startDate').isISO8601().withMessage('Valid start date is required'),
  body('periodCovered.endDate').isISO8601().withMessage('Valid end date is required'),
  body('hoursWorked').optional().isFloat({ min: 0 }).withMessage('Hours worked must be positive'),
  body('hourlyRate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be positive')
], teacherController.createTeacherPayment);

/**
 * @route   PUT /api/teachers/payments/:paymentId/approve
 * @desc    Approve teacher payment
 * @access  Private (Admin)
 */
router.put('/payments/:paymentId/approve',  teacherController.approveTeacherPayment);

/**
 * @route   PUT /api/teachers/payments/:paymentId/pay
 * @desc    Mark teacher payment as paid
 * @access  Private (Admin)
 */
router.put('/payments/:paymentId/pay', [
  body('paidAt').optional().isISO8601().withMessage('Valid paid date is required')
], teacherController.markTeacherPaymentPaid);

module.exports = router;
