const User = require('../models/User');
const Student = require('../models/Student');
const TimeEntry = require('../models/TimeEntry');
const TeacherPayment = require('../models/TeacherPayment');
const Payment = require('../models/Payment');
const { validationResult } = require('express-validator');

/**
 * Get all teachers with their payment summaries
 * @route GET /api/teachers
 * @access Private (Admin)
 */
const getAllTeachers = async (req, res) => {
  try {
    const { search, status } = req.query;
    
    // Build query for teachers
    const query = { role: 'teacher' };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }
    
    const teachers = await User.find(query).select('-password');
    
    // Get payment summaries for each teacher
    const teachersWithPaymentSummary = await Promise.all(
      teachers.map(async (teacher) => {
        const teacherObj = teacher.toObject();
        
        // Get teacher payment summary (payments TO teachers)
        const teacherPaymentSummary = await TeacherPayment.getTeacherPaymentSummary(teacher._id);
        
        // Get student payment summary (payments FROM students)
        const studentPaymentSummary = await Payment.getTeacherPaymentOverview(teacher._id);
        
        // Get hours worked summary
        const currentMonth = new Date();
        currentMonth.setDate(1);
        const nextMonth = new Date(currentMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        const hoursSummary = await TimeEntry.getEarningsSummary(
          teacher._id,
          currentMonth,
          nextMonth
        );
        
        // Get student count
        const studentCount = await Student.countDocuments({
          teacherId: teacher._id,
          status: 'active'
        });
        
        return {
          ...teacherObj,
          paymentSummary: {
            toTeacher: teacherPaymentSummary,
            fromStudents: studentPaymentSummary,
            netBalance: (studentPaymentSummary.totalReceived || 0) - (teacherPaymentSummary.totalPaid || 0)
          },
          hoursSummary,
          studentCount
        };
      })
    );
    
    return res.status(200).json({
      success: true,
      count: teachersWithPaymentSummary.length,
      data: teachersWithPaymentSummary
    });
    
  } catch (error) {
    console.error('Get all teachers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Get teacher details with comprehensive payment tracking
 * @route GET /api/teachers/:id
 * @access Private (Admin)
 */
const getTeacherById = async (req, res) => {
  try {
    const teacherId = req.params.id;
    
    const teacher = await User.findOne({
      _id: teacherId,
      role: 'teacher'
    }).select('-password');
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    // Get comprehensive payment data
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Teacher payments (TO teacher)
    const teacherPayments = await TeacherPayment.find({
      teacherId,
      paymentDate: { $gte: start, $lte: end }
    }).populate('submittedBy', 'profile.firstName profile.lastName')
      .populate('approvedBy', 'profile.firstName profile.lastName')
      .sort({ paymentDate: -1 });
    
    const teacherPaymentSummary = await TeacherPayment.getTeacherPaymentSummary(teacherId, start, end);
    
    // Student payments (FROM students to teacher)
    const studentPayments = await Payment.find({
      teacherId,
      paymentDate: { $gte: start, $lte: end }
    }).populate('studentId', 'firstName lastName email')
      .sort({ paymentDate: -1 });
    
    const studentPaymentSummary = await Payment.getTeacherPaymentOverview(teacherId, start, end);
    
    // Time entries
    const timeEntries = await TimeEntry.find({
      teacherId,
      date: { $gte: start, $lte: end }
    }).populate('classId', 'name level')
      .sort({ date: -1 });
    
    const hoursSummary = await TimeEntry.getEarningsSummary(teacherId, start, end);
    
    // Students assigned to teacher
    const students = await Student.find({
      teacherId,
      status: 'active'
    }).select('firstName lastName email status enrollmentDate');
    
    // Calculate pending payments based on hours worked
    const totalEarnedFromHours = hoursSummary.totalEarnings || 0;
    const totalPaidToTeacher = teacherPaymentSummary.totalPaid || 0;
    const pendingPaymentAmount = Math.max(0, totalEarnedFromHours - totalPaidToTeacher);
    
    return res.status(200).json({
      success: true,
      data: {
        teacher: teacher.toObject(),
        paymentSummary: {
          toTeacher: {
            ...teacherPaymentSummary,
            pendingFromHours: pendingPaymentAmount
          },
          fromStudents: studentPaymentSummary,
          netBalance: (studentPaymentSummary.totalReceived || 0) - (teacherPaymentSummary.totalPaid || 0)
        },
        hoursSummary,
        teacherPayments,
        studentPayments,
        timeEntries,
        students,
        studentCount: students.length
      }
    });
    
  } catch (error) {
    console.error('Get teacher by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Get teacher payment history
 * @route GET /api/teachers/:id/payments
 * @access Private (Admin/Teacher)
 */
const getTeacherPayments = async (req, res) => {
  try {
    const teacherId = req.params.id;
    
    // Check authorization
    if (req.user.role !== 'admin' && req.user._id.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this teacher\'s payments'
      });
    }
    
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    
    const query = { teacherId };
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }
    
    const payments = await TeacherPayment.find(query)
      .populate('submittedBy', 'profile.firstName profile.lastName')
      .populate('approvedBy', 'profile.firstName profile.lastName')
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await TeacherPayment.countDocuments(query);
    
    const summary = await TeacherPayment.getTeacherPaymentSummary(teacherId, startDate, endDate);
    
    return res.status(200).json({
      success: true,
      data: payments,
      summary,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
    
  } catch (error) {
    console.error('Get teacher payments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Create teacher payment
 * @route POST /api/teachers/:id/payments
 * @access Private (Admin)
 */
const createTeacherPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }
    
    const teacherId = req.params.id;
    const {
      amount,
      currency = 'DZD',
      paymentMethod,
      paymentDate,
      paymentType,
      hoursWorked,
      hourlyRate,
      description,
      reference
    } = req.body;
    
    // Verify teacher exists
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    const payment = new TeacherPayment({
      teacherId,
      amount,
      currency,
      paymentMethod,
      paymentDate: paymentDate || new Date(),
      paymentType,
      hoursWorked,
      hourlyRate,
      description,
      reference,
      submittedBy: req.user._id,
      status: 'pending'
    });
    
    await payment.save();
    
    await payment.populate([
      { path: 'teacherId', select: 'profile.firstName profile.lastName email' },
      { path: 'submittedBy', select: 'profile.firstName profile.lastName' }
    ]);
    
    return res.status(201).json({
      success: true,
      message: 'Teacher payment created successfully',
      data: payment
    });
    
  } catch (error) {
    console.error('Create teacher payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Approve teacher payment
 * @route PUT /api/teachers/payments/:paymentId/approve
 * @access Private (Admin)
 */
const approveTeacherPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await TeacherPayment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Payment is not in pending status'
      });
    }
    
    payment.status = 'approved';
    payment.approvedBy = req.user._id;
    payment.approvedAt = new Date();
    
    await payment.save();
    
    await payment.populate([
      { path: 'teacherId', select: 'profile.firstName profile.lastName email' },
      { path: 'approvedBy', select: 'profile.firstName profile.lastName' }
    ]);
    
    return res.status(200).json({
      success: true,
      message: 'Payment approved successfully',
      data: payment
    });
    
  } catch (error) {
    console.error('Approve teacher payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Reject teacher payment
 * @route PUT /api/teachers/payments/:paymentId/reject
 * @access Private (Admin)
 */
const rejectTeacherPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const payment = await TeacherPayment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Payment is not in pending status'
      });
    }
    
    payment.status = 'rejected';
    payment.rejectedBy = req.user._id;
    payment.rejectedAt = new Date();
    payment.rejectionReason = reason;
    
    await payment.save();
    
    await payment.populate([
      { path: 'teacherId', select: 'profile.firstName profile.lastName email' },
      { path: 'rejectedBy', select: 'profile.firstName profile.lastName' }
    ]);
    
    return res.status(200).json({
      success: true,
      message: 'Payment rejected successfully',
      data: payment
    });
    
  } catch (error) {
    console.error('Reject teacher payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Mark teacher payment as paid
 * @route PUT /api/teachers/payments/:paymentId/pay
 * @access Private (Admin)
 */
const markTeacherPaymentPaid = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { paidAt } = req.body;
    
    const payment = await TeacherPayment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    if (!['pending', 'approved'].includes(payment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Payment must be pending or approved to mark as paid'
      });
    }
    
    payment.status = 'paid';
    payment.paidAt = paidAt || new Date();
    
    if (!payment.approvedBy) {
      payment.approvedBy = req.user._id;
      payment.approvedAt = payment.paidAt;
    }
    
    await payment.save();
    
    await payment.populate([
      { path: 'teacherId', select: 'profile.firstName profile.lastName email' },
      { path: 'approvedBy', select: 'profile.firstName profile.lastName' }
    ]);
    
    return res.status(200).json({
      success: true,
      message: 'Payment marked as paid successfully',
      data: payment
    });
    
  } catch (error) {
    console.error('Mark teacher payment paid error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Get overdue teacher payments
 * @route GET /api/teachers/payments/overdue
 * @access Private (Admin)
 */
const getOverdueTeacherPayments = async (req, res) => {
  try {
    const overduePayments = await TeacherPayment.getOverduePayments();
    
    return res.status(200).json({
      success: true,
      count: overduePayments.length,
      data: overduePayments
    });
    
  } catch (error) {
    console.error('Get overdue teacher payments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Get teacher hours vs payments analysis
 * @route GET /api/teachers/:id/hours-analysis
 * @access Private (Admin)
 */
const getTeacherHoursAnalysis = async (req, res) => {
  try {
    const teacherId = req.params.id;
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get hours worked
    const hoursSummary = await TimeEntry.getEarningsSummary(teacherId, start, end);
    
    // Get payments made to teacher
    const paymentSummary = await TeacherPayment.getTeacherPaymentSummary(teacherId, start, end);
    
    // Calculate analysis
    const totalEarned = hoursSummary.totalEarnings || 0;
    const totalPaid = paymentSummary.totalPaid || 0;
    const totalPending = paymentSummary.totalPending || 0;
    const unpaidEarnings = Math.max(0, totalEarned - totalPaid - totalPending);
    
    const analysis = {
      period: { start, end },
      hours: {
        totalHours: hoursSummary.totalHours || 0,
        totalEarnings: totalEarned
      },
      payments: {
        totalPaid,
        totalPending,
        unpaidEarnings
      },
      status: {
        isPaidUp: unpaidEarnings <= 0,
        owedAmount: unpaidEarnings,
        paymentCoverage: totalEarned > 0 ? ((totalPaid + totalPending) / totalEarned) * 100 : 100
      }
    };
    
    return res.status(200).json({
      success: true,
      data: analysis
    });
    
  } catch (error) {
    console.error('Get teacher hours analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  getAllTeachers,
  getTeacherById,
  getTeacherPayments,
  createTeacherPayment,
  approveTeacherPayment,
  rejectTeacherPayment,
  markTeacherPaymentPaid,
  getOverdueTeacherPayments,
  getTeacherHoursAnalysis
};
