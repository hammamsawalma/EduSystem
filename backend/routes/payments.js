const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, isAdminOrTeacher, isAdmin } = require('../middleware/auth');
const { auditLoggers, capturePreviousValues } = require('../middleware/audit');

// All routes require authentication
router.use(authenticate);
router.use(isAdminOrTeacher);

// GET /api/payments - Get all payments
router.get('/', paymentController.getPayments);

// GET /api/payments/overview - Get teacher payment overview
router.get('/overview', paymentController.getTeacherPaymentOverview);

// GET /api/payments/analytics - Get payment analytics
router.get('/analytics', paymentController.getPaymentAnalytics);

// GET /api/payments/overdue - Get overdue payments
router.get('/overdue', paymentController.getOverduePayments);

// GET /api/payments/student/:studentId - Get student payment history
router.get('/student/:studentId', paymentController.getStudentPaymentHistory);

// POST /api/payments/bulk - Bulk create payments
router.post('/bulk', auditLoggers.paymentBulkCreate, paymentController.bulkCreatePayments);

// GET /api/payments/:id - Get single payment
router.get('/:id', paymentController.getPayment);

// POST /api/payments - Create new payment
router.post('/', auditLoggers.paymentCreate, paymentController.createPayment);

// PUT /api/payments/:id - Update payment
router.put('/:id', 
  capturePreviousValues('Payment'),
  auditLoggers.paymentUpdate, 
  paymentController.updatePayment
);

// DELETE /api/payments/:id - Delete payment
router.delete('/:id', auditLoggers.paymentDelete, paymentController.deletePayment);

// POST /api/payments/:id/refund - Process refund
router.post('/:id/refund', auditLoggers.paymentRefund, paymentController.processRefund);

module.exports = router;
