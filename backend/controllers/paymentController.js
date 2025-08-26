const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { logAuditEntry } = require('../middleware/audit');

// Get all payments
const getPayments = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'admin') {
      // Admin can see all payments or filter by teacherId
      if (req.query.teacherId) {
        query.teacherId = req.query.teacherId;
      }
    } else {
      // Teachers can only see their own payments
      query.teacherId = req.user._id;
    }
    
    // Add filtering options
    if (req.query.studentId) {
      query.studentId = req.query.studentId;
    }
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.paymentMethod) {
      query.paymentMethod = req.query.paymentMethod;
    }
    
    if (req.query.paymentType) {
      query.paymentType = req.query.paymentType;
    }
    
    if (req.query.academicPeriod) {
      query.academicPeriod = req.query.academicPeriod;
    }
    
    // Date filtering
    if (req.query.startDate || req.query.endDate) {
      query.paymentDate = {};
      if (req.query.startDate) {
        query.paymentDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.paymentDate.$lte = new Date(req.query.endDate);
      }
    }
    
    // Amount filtering
    if (req.query.minAmount) {
      query.amount = { ...query.amount, $gte: parseFloat(req.query.minAmount) };
    }
    if (req.query.maxAmount) {
      query.amount = { ...query.amount, $lte: parseFloat(req.query.maxAmount) };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const sortBy = req.query.sortBy || 'paymentDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const payments = await Payment.find(query)
      .populate('studentId', 'personalInfo.firstName personalInfo.lastName personalInfo.email')
      .populate('teacherId', 'profile.firstName profile.lastName email')
      .populate('relatedAttendance', 'lessonDate lessonType status')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single payment
const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('studentId', 'personalInfo.firstName personalInfo.lastName personalInfo.email parentInfo')
      .populate('teacherId', 'profile.firstName profile.lastName email')
      .populate('relatedAttendance', 'lessonDate lessonType status duration notes');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found.'
      });
    }

    // Check if user can access this payment
    if (req.user.role !== 'admin' && payment.teacherId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own payments.'
      });
    }

    res.json({
      success: true,
      data: {
        payment
      }
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new payment
const createPayment = async (req, res) => {
  try {
    const {
      studentId,
      amount,
      currency,
      paymentMethod,
      paymentDate,
      paymentType,
      reference,
      notes,
      academicPeriod,
      relatedAttendance,
      dueDate,
      status
    } = req.body;

    // Validate required fields
    if (!studentId || !amount || !paymentDate) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, amount, and payment date are required.'
      });
    }

    // Validate student exists and belongs to teacher
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    if (req.user.role !== 'admin' && student.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only create payments for your own students.'
      });
    }

    // Validate related attendance if provided
    if (relatedAttendance) {
      const attendance = await Attendance.findById(relatedAttendance);
      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: 'Related attendance record not found.'
        });
      }
      
      if (attendance.teacherId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Related attendance must belong to you.'
        });
      }
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0.'
      });
    }

    // Validate payment date
    const paymentDateObj = new Date(paymentDate);
    if (isNaN(paymentDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment date format.'
      });
    }

    // Check for duplicate reference if provided
    if (reference) {
      const existingPayment = await Payment.findOne({
        teacherId: req.user._id,
        reference: reference.trim()
      });
      
      if (existingPayment) {
        return res.status(409).json({
          success: false,
          message: 'A payment with this reference already exists.'
        });
      }
    }

    // Create payment
    const payment = new Payment({
      studentId,
      teacherId: req.user._id,
      amount: parseFloat(amount),
      currency: currency || 'DZD',
      paymentMethod: paymentMethod || 'cash',
      paymentDate: paymentDateObj,
      paymentType: paymentType || 'lesson_payment',
      reference: reference?.trim(),
      notes: notes?.trim(),
      academicPeriod: academicPeriod?.trim(),
      relatedAttendance: relatedAttendance || undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: status || 'completed'
    });

    await payment.save();

    // Update student's payment info
    await updateStudentPaymentInfo(studentId);

    // Populate for response
    await payment.populate([
      { path: 'studentId', select: 'personalInfo.firstName personalInfo.lastName personalInfo.email' },
      { path: 'teacherId', select: 'profile.firstName profile.lastName email' },
      { path: 'relatedAttendance', select: 'lessonDate lessonType status' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Payment created successfully.',
      data: {
        payment
      }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update payment
const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found.'
      });
    }

    // Check if user can update this payment
    if (req.user.role !== 'admin' && payment.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own payments.'
      });
    }

    const {
      amount,
      currency,
      paymentMethod,
      paymentDate,
      paymentType,
      reference,
      notes,
      academicPeriod,
      relatedAttendance,
      dueDate,
      status
    } = req.body;

    // Validate amount if provided
    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Payment amount must be greater than 0.'
        });
      }
      payment.amount = parseFloat(amount);
    }

    // Validate payment date if provided
    if (paymentDate !== undefined) {
      const paymentDateObj = new Date(paymentDate);
      if (isNaN(paymentDateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment date format.'
        });
      }
      payment.paymentDate = paymentDateObj;
    }

    // Check for duplicate reference if provided
    if (reference !== undefined && reference !== payment.reference) {
      const existingPayment = await Payment.findOne({
        _id: { $ne: payment._id },
        teacherId: req.user._id,
        reference: reference.trim()
      });
      
      if (existingPayment) {
        return res.status(409).json({
          success: false,
          message: 'A payment with this reference already exists.'
        });
      }
    }

    // Update fields
    if (currency !== undefined) payment.currency = currency;
    if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod;
    if (paymentType !== undefined) payment.paymentType = paymentType;
    if (reference !== undefined) payment.reference = reference?.trim();
    if (notes !== undefined) payment.notes = notes?.trim();
    if (academicPeriod !== undefined) payment.academicPeriod = academicPeriod?.trim();
    if (relatedAttendance !== undefined) payment.relatedAttendance = relatedAttendance || undefined;
    if (dueDate !== undefined) payment.dueDate = dueDate ? new Date(dueDate) : undefined;
    if (status !== undefined) payment.status = status;

    await payment.save();

    // Update student's payment info
    await updateStudentPaymentInfo(payment.studentId);

    // Populate for response
    await payment.populate([
      { path: 'studentId', select: 'personalInfo.firstName personalInfo.lastName personalInfo.email' },
      { path: 'teacherId', select: 'profile.firstName profile.lastName email' },
      { path: 'relatedAttendance', select: 'lessonDate lessonType status' }
    ]);

    res.json({
      success: true,
      message: 'Payment updated successfully.',
      data: {
        payment
      }
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete payment
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found.'
      });
    }

    // Check if user can delete this payment
    if (req.user.role !== 'admin' && payment.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own payments.'
      });
    }

    const studentId = payment.studentId;

    await Payment.findByIdAndDelete(req.params.id);

    // Update student's payment info
    await updateStudentPaymentInfo(studentId);

    res.json({
      success: true,
      message: 'Payment deleted successfully.'
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get student payment history
const getStudentPaymentHistory = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    
    // Validate student exists and user has access
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    if (req.user.role !== 'admin' && student.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own students\' payments.'
      });
    }

    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const stats = await Payment.getStudentPaymentStats(studentId, startDate, endDate);
    
    // Get payment history
    let query = { studentId: new mongoose.Types.ObjectId(studentId) };
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('teacherId', 'profile.firstName profile.lastName email')
      .populate('relatedAttendance', 'lessonDate lessonType status')
      .sort({ paymentDate: -1 });

    res.json({
      success: true,
      data: {
        studentId,
        stats,
        payments,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || 'All time'
        }
      }
    });
  } catch (error) {
    console.error('Get student payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student payment history.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get teacher payment overview
const getTeacherPaymentOverview = async (req, res) => {
  try {
    const teacherId = req.user.role === 'admin' ? (req.query.teacherId || req.user._id) : req.user._id;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const overview = await Payment.getTeacherPaymentOverview(teacherId, startDate, endDate);

    res.json({
      success: true,
      data: {
        teacherId,
        overview,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || 'All time'
        }
      }
    });
  } catch (error) {
    console.error('Get teacher payment overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher payment overview.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get payment analytics
const getPaymentAnalytics = async (req, res) => {
  try {
    const teacherId = req.user.role === 'admin' ? (req.query.teacherId || req.user._id) : req.user._id;
    const period = req.query.period || 'month';

    const analytics = await Payment.getPaymentAnalytics(teacherId, period);

    res.json({
      success: true,
      data: {
        teacherId,
        analytics,
        period
      }
    });
  } catch (error) {
    console.error('Get payment analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment analytics.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get overdue payments
const getOverduePayments = async (req, res) => {
  try {
    const teacherId = req.user.role === 'admin' ? (req.query.teacherId || req.user._id) : req.user._id;

    const overduePayments = await Payment.getOverduePayments(teacherId);

    res.json({
      success: true,
      data: {
        teacherId,
        overduePayments,
        count: overduePayments.length
      }
    });
  } catch (error) {
    console.error('Get overdue payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue payments.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Process refund
const processRefund = async (req, res) => {
  try {
    const { refundAmount, reason, method } = req.body;

    if (!refundAmount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount and reason are required.'
      });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found.'
      });
    }

    // Check if user can process refund for this payment
    if (req.user.role !== 'admin' && payment.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only process refunds for your own payments.'
      });
    }

    await payment.processRefund(parseFloat(refundAmount), reason.trim(), method);

    // Update student's payment info
    await updateStudentPaymentInfo(payment.studentId);

    // Populate for response
    await payment.populate([
      { path: 'studentId', select: 'personalInfo.firstName personalInfo.lastName personalInfo.email' },
      { path: 'teacherId', select: 'profile.firstName profile.lastName email' }
    ]);

    res.json({
      success: true,
      message: 'Refund processed successfully.',
      data: {
        payment
      }
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process refund.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Bulk create payments
const bulkCreatePayments = async (req, res) => {
  try {
    const { payments } = req.body;

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Payments array is required and must not be empty.'
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const paymentData of payments) {
      try {
        const { studentId, amount, paymentDate, ...otherData } = paymentData;

        // Validate student exists and belongs to teacher
        const student = await Student.findById(studentId);
        if (!student) {
          results.failed.push({
            studentId,
            error: 'Student not found'
          });
          continue;
        }

        if (req.user.role !== 'admin' && student.teacherId.toString() !== req.user._id.toString()) {
          results.failed.push({
            studentId,
            error: 'Access denied. Student does not belong to you'
          });
          continue;
        }

        // Create payment
        const payment = new Payment({
          studentId,
          teacherId: req.user._id,
          amount: parseFloat(amount),
          paymentDate: new Date(paymentDate),
          ...otherData
        });

        await payment.save();
        await updateStudentPaymentInfo(studentId);

        results.successful.push({
          studentId,
          paymentId: payment._id,
          amount: payment.amount
        });
      } catch (error) {
        results.failed.push({
          studentId: paymentData.studentId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Bulk payment processing completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
      data: results
    });
  } catch (error) {
    console.error('Bulk create payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk payments.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to update student payment info
const updateStudentPaymentInfo = async (studentId) => {
  try {
    const stats = await Payment.getStudentPaymentStats(studentId);
    const student = await Student.findById(studentId);
    
    if (student) {
      student.paymentInfo.totalPaid = stats.totalAmount;
      student.paymentInfo.lastPaymentDate = stats.lastPaymentDate;
      
      // Calculate current balance (this would need integration with lesson fees)
      // For now, we'll keep the existing balance logic
      
      await student.save();
    }
  } catch (error) {
    console.error('Error updating student payment info:', error);
  }
};

module.exports = {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  getStudentPaymentHistory,
  getTeacherPaymentOverview,
  getPaymentAnalytics,
  getOverduePayments,
  processRefund,
  bulkCreatePayments
};
