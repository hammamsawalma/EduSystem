const Payment = require('../models/Payment');
const TeacherPayment = require('../models/TeacherPayment');
const Expense = require('../models/Expense');
const Student = require('../models/Student');
const User = require('../models/User');
const TimeEntry = require('../models/TimeEntry');

class PaymentService {
  /**
   * Create a student payment
   * @param {Object} paymentData - Payment data
   * @param {String} createdBy - User ID who created the payment
   * @returns {Object} Created payment
   */
  async createStudentPayment(paymentData, createdBy) {
    try {
      // Validate student exists
      const student = await Student.findById(paymentData.studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      const payment = new Payment({
        ...paymentData,
        createdBy,
        status: 'pending'
      });

      await payment.save();
      await payment.populate('studentId', 'firstName lastName email');
      
      return payment;
    } catch (error) {
      throw new Error(`Failed to create student payment: ${error.message}`);
    }
  }

  /**
   * Create a teacher payment
   * @param {Object} paymentData - Payment data
   * @param {String} createdBy - User ID who created the payment
   * @returns {Object} Created payment
   */
  async createTeacherPayment(paymentData, createdBy) {
    try {
      // Validate teacher exists
      const teacher = await User.findOne({ _id: paymentData.teacherId, role: 'teacher' });
      if (!teacher) {
        throw new Error('Teacher not found');
      }

      // Calculate amount from hours if not provided
      if (!paymentData.amount && paymentData.hoursWorked && paymentData.hourlyRate) {
        paymentData.amount = paymentData.hoursWorked * paymentData.hourlyRate;
      }

      const payment = new TeacherPayment({
        ...paymentData,
        submittedBy: createdBy,
        status: 'pending'
      });

      await payment.save();
      await payment.populate('teacherId', 'profile.firstName profile.lastName email');
      
      return payment;
    } catch (error) {
      throw new Error(`Failed to create teacher payment: ${error.message}`);
    }
  }

  /**
   * Create an expense record
   * @param {Object} expenseData - Expense data
   * @param {String} createdBy - User ID who created the expense
   * @returns {Object} Created expense
   */
  async createExpense(expenseData, createdBy) {
    try {
      const expense = new Expense({
        ...expenseData,
        submittedBy: createdBy,
        status: 'pending'
      });

      await expense.save();
      await expense.populate('submittedBy', 'profile.firstName profile.lastName email');
      
      return expense;
    } catch (error) {
      throw new Error(`Failed to create expense: ${error.message}`);
    }
  }

  /**
   * Approve a teacher payment
   * @param {String} paymentId - Payment ID
   * @param {String} approvedBy - User ID who approved the payment
   * @returns {Object} Updated payment
   */
  async approveTeacherPayment(paymentId, approvedBy) {
    try {
      const payment = await TeacherPayment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'pending') {
        throw new Error('Payment is not in pending status');
      }

      payment.status = 'approved';
      payment.approvedBy = approvedBy;
      payment.approvedAt = new Date();

      await payment.save();
      await payment.populate([
        { path: 'teacherId', select: 'profile.firstName profile.lastName email' },
        { path: 'approvedBy', select: 'profile.firstName profile.lastName' }
      ]);
      
      return payment;
    } catch (error) {
      throw new Error(`Failed to approve teacher payment: ${error.message}`);
    }
  }

  /**
   * Process (mark as paid) a teacher payment
   * @param {String} paymentId - Payment ID
   * @param {String} processedBy - User ID who processed the payment
   * @param {Object} paymentDetails - Additional payment details
   * @returns {Object} Updated payment
   */
  async processTeacherPayment(paymentId, processedBy, paymentDetails = {}) {
    try {
      const payment = await TeacherPayment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (!['approved', 'pending'].includes(payment.status)) {
        throw new Error('Payment cannot be processed');
      }

      payment.status = 'paid';
      payment.paymentDate = paymentDetails.paymentDate || new Date();
      payment.paymentMethod = paymentDetails.paymentMethod || payment.paymentMethod;
      payment.transactionReference = paymentDetails.transactionReference;
      payment.notes = paymentDetails.notes || payment.notes;

      await payment.save();
      await payment.populate([
        { path: 'teacherId', select: 'profile.firstName profile.lastName email' },
        { path: 'approvedBy', select: 'profile.firstName profile.lastName' }
      ]);
      
      return payment;
    } catch (error) {
      throw new Error(`Failed to process teacher payment: ${error.message}`);
    }
  }

  /**
   * Process a student payment
   * @param {String} paymentId - Payment ID
   * @param {String} processedBy - User ID who processed the payment
   * @param {Object} paymentDetails - Additional payment details
   * @returns {Object} Updated payment
   */
  async processStudentPayment(paymentId, processedBy, paymentDetails = {}) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      payment.status = 'completed';
      payment.paymentDate = paymentDetails.paymentDate || new Date();
      payment.paymentMethod = paymentDetails.paymentMethod || payment.paymentMethod;
      payment.transactionReference = paymentDetails.transactionReference;

      await payment.save();
      await payment.populate('studentId', 'firstName lastName email');
      
      return payment;
    } catch (error) {
      throw new Error(`Failed to process student payment: ${error.message}`);
    }
  }

  /**
   * Approve an expense
   * @param {String} expenseId - Expense ID
   * @param {String} approvedBy - User ID who approved the expense
   * @returns {Object} Updated expense
   */
  async approveExpense(expenseId, approvedBy) {
    try {
      const expense = await Expense.findById(expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }

      if (expense.status !== 'pending') {
        throw new Error('Expense is not in pending status');
      }

      expense.status = 'approved';
      expense.approvedBy = approvedBy;
      expense.approvedAt = new Date();

      await expense.save();
      await expense.populate([
        { path: 'submittedBy', select: 'profile.firstName profile.lastName email' },
        { path: 'approvedBy', select: 'profile.firstName profile.lastName' }
      ]);
      
      return expense;
    } catch (error) {
      throw new Error(`Failed to approve expense: ${error.message}`);
    }
  }

  /**
   * Reject a teacher payment
   * @param {String} paymentId - Payment ID
   * @param {String} rejectedBy - User ID who rejected the payment
   * @param {String} reason - Rejection reason
   * @returns {Object} Updated payment
   */
  async rejectTeacherPayment(paymentId, rejectedBy, reason) {
    try {
      const payment = await TeacherPayment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      payment.status = 'cancelled';
      payment.rejectedBy = rejectedBy;
      payment.rejectedAt = new Date();
      payment.rejectionReason = reason;

      await payment.save();
      return payment;
    } catch (error) {
      throw new Error(`Failed to reject teacher payment: ${error.message}`);
    }
  }

  /**
   * Reject an expense
   * @param {String} expenseId - Expense ID
   * @param {String} rejectedBy - User ID who rejected the expense
   * @param {String} reason - Rejection reason
   * @returns {Object} Updated expense
   */
  async rejectExpense(expenseId, rejectedBy, reason) {
    try {
      const expense = await Expense.findById(expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }

      expense.status = 'rejected';
      expense.rejectedBy = rejectedBy;
      expense.rejectedAt = new Date();
      expense.rejectionReason = reason;

      await expense.save();
      return expense;
    } catch (error) {
      throw new Error(`Failed to reject expense: ${error.message}`);
    }
  }

  /**
   * Get pending payments for approval
   * @param {String} type - Payment type (teacher, student, expense)
   * @returns {Array} Pending payments
   */
  async getPendingPayments(type = 'all') {
    try {
      const results = {};

      if (type === 'all' || type === 'teacher') {
        results.teacherPayments = await TeacherPayment.find({ status: 'pending' })
          .populate('teacherId', 'profile.firstName profile.lastName email')
          .populate('submittedBy', 'profile.firstName profile.lastName')
          .sort({ createdAt: -1 });
      }

      if (type === 'all' || type === 'student') {
        results.studentPayments = await Payment.find({ status: 'pending' })
          .populate('studentId', 'firstName lastName email')
          .sort({ createdAt: -1 });
      }

      if (type === 'all' || type === 'expense') {
        results.expenses = await Expense.find({ status: 'pending' })
          .populate('submittedBy', 'profile.firstName profile.lastName email')
          .sort({ createdAt: -1 });
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to get pending payments: ${error.message}`);
    }
  }

  /**
   * Get payment history for a teacher
   * @param {String} teacherId - Teacher ID
   * @param {Object} options - Query options
   * @returns {Object} Payment history
   */
  async getTeacherPaymentHistory(teacherId, options = {}) {
    try {
      const { startDate, endDate, status, limit = 50, page = 1 } = options;
      
      const query = { teacherId };
      
      if (startDate && endDate) {
        query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      
      if (status) {
        query.status = status;
      }

      const payments = await TeacherPayment.find(query)
        .populate('approvedBy', 'profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);

      const total = await TeacherPayment.countDocuments(query);

      // Calculate summary
      const summary = await TeacherPayment.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        payments,
        summary,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      };
    } catch (error) {
      throw new Error(`Failed to get teacher payment history: ${error.message}`);
    }
  }

  /**
   * Get payment history for a student
   * @param {String} studentId - Student ID
   * @param {Object} options - Query options
   * @returns {Object} Payment history
   */
  async getStudentPaymentHistory(studentId, options = {}) {
    try {
      const { startDate, endDate, status, limit = 50, page = 1 } = options;
      
      const query = { studentId };
      
      if (startDate && endDate) {
        query.paymentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      
      if (status) {
        query.status = status;
      }

      const payments = await Payment.find(query)
        .sort({ paymentDate: -1 })
        .limit(limit)
        .skip((page - 1) * limit);

      const total = await Payment.countDocuments(query);

      // Calculate summary
      const summary = await Payment.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        payments,
        summary,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      };
    } catch (error) {
      throw new Error(`Failed to get student payment history: ${error.message}`);
    }
  }

  /**
   * Generate payment from time entries
   * @param {String} teacherId - Teacher ID
   * @param {Date} startDate - Start date for time entries
   * @param {Date} endDate - End date for time entries
   * @param {String} createdBy - User ID who created the payment
   * @returns {Object} Created payment
   */
  async generatePaymentFromTimeEntries(teacherId, startDate, endDate, createdBy) {
    try {
      // Get time entries for the period
      const timeEntries = await TimeEntry.find({
        teacherId,
        date: { $gte: startDate, $lte: endDate },
        status: 'approved'
      });

      if (timeEntries.length === 0) {
        throw new Error('No approved time entries found for the specified period');
      }

      // Calculate total hours and amount
      let totalHours = 0;
      let totalAmount = 0;
      let hourlyRate = 0;

      timeEntries.forEach(entry => {
        totalHours += entry.hoursWorked;
        totalAmount += entry.hoursWorked * entry.hourlyRate;
        hourlyRate = entry.hourlyRate; // Assuming same rate for all entries
      });

      // Create the payment
      const paymentData = {
        teacherId,
        amount: totalAmount,
        currency: 'USD',
        paymentType: 'hourly',
        paymentMethod: 'bank_transfer',
        paymentDate: endDate,
        hoursWorked: totalHours,
        hourlyRate,
        description: `Payment for ${totalHours} hours worked from ${startDate.toDateString()} to ${endDate.toDateString()}`,
        timeEntries: timeEntries.map(entry => entry._id)
      };

      return await this.createTeacherPayment(paymentData, createdBy);
    } catch (error) {
      throw new Error(`Failed to generate payment from time entries: ${error.message}`);
    }
  }
}

module.exports = new PaymentService();
