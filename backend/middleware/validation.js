const { body, validationResult } = require('express-validator');

// Validation for creating teacher payment
const validateTeacherPayment = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0')
    .custom((value) => {
      // Check if amount has at most 2 decimal places
      return Math.round(value * 100) / 100 === value;
    })
    .withMessage('Amount must have at most 2 decimal places'),
  
  body('currency')
    .optional()
    .isIn(['DZD', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'TRY'])
    .withMessage('Invalid currency'),
  
  body('paymentMethod')
    .isIn(['cash', 'bank_transfer', 'check', 'online', 'card', 'mobile_payment'])
    .withMessage('Invalid payment method'),
  
  body('paymentType')
    .isIn(['salary', 'hourly_payment', 'bonus', 'commission', 'reimbursement', 'advance', 'other'])
    .withMessage('Invalid payment type'),
  
  body('paymentDate')
    .optional()
    .isISO8601()
    .withMessage('Valid payment date is required'),
  
  body('hoursWorked')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hours worked must be positive')
    .custom((value, { req }) => {
      // If payment type is hourly_payment, hours worked is required
      if (req.body.paymentType === 'hourly_payment' && (!value || value <= 0)) {
        throw new Error('Hours worked is required for hourly payments');
      }
      // Check if it's a multiple of 0.25 (15-minute intervals)
      if (value && (value * 4) % 1 !== 0) {
        throw new Error('Hours must be in 15-minute intervals (0.25, 0.5, 0.75, etc.)');
      }
      return true;
    }),
  
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be positive')
    .custom((value, { req }) => {
      // If payment type is hourly_payment, hourly rate is required
      if (req.body.paymentType === 'hourly_payment' && (!value || value <= 0)) {
        throw new Error('Hourly rate is required for hourly payments');
      }
      return true;
    }),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),
  
  body('reference')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Reference cannot exceed 100 characters')
    .trim()
];

// Validation for financial report generation
const validateFinancialReport = [
  body('startDate')
    .isISO8601()
    .withMessage('Valid start date is required')
    .custom((value, { req }) => {
      const startDate = new Date(value);
      const endDate = new Date(req.body.endDate);
      if (startDate >= endDate) {
        throw new Error('Start date must be before end date');
      }
      return true;
    }),
  
  body('endDate')
    .isISO8601()
    .withMessage('Valid end date is required'),
  
  body('reportType')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'])
    .withMessage('Invalid report type')
];

// Validation for general expense with enhanced categories
const validateGeneralExpense = [
  body('category')
    .isIn([
      'rent',
      'utilities',
      'supplies',
      'marketing',
      'maintenance',
      'insurance',
      'salaries',
      'transportation',
      'communication',
      'software',
      'equipment',
      'training',
      'legal',
      'accounting',
      'other'
    ])
    .withMessage('Invalid expense category'),
  
  body('subcategory')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Subcategory cannot exceed 50 characters')
    .trim(),
  
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be positive')
    .custom((value) => {
      // Check if amount has at most 2 decimal places
      return Math.round(value * 100) / 100 === value;
    })
    .withMessage('Amount must have at most 2 decimal places'),
  
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),
  
  body('date')
    .isISO8601()
    .withMessage('Valid date is required')
    .custom((value) => {
      const expenseDate = new Date(value);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      if (expenseDate > thirtyDaysFromNow) {
        throw new Error('Date cannot be more than 30 days in the future');
      }
      return true;
    }),
  
  body('receiptUrl')
    .optional()
    .isURL()
    .withMessage('Please provide a valid URL for the receipt')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  validateTeacherPayment,
  validateFinancialReport,
  validateGeneralExpense,
  handleValidationErrors
};
