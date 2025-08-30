const Student = require('../models/Student');
const Payment = require('../models/Payment');
const TeacherPayment = require('../models/TeacherPayment');
const User = require('../models/User');
const Expense = require('../models/Expense');
const FinancialReport = require('../models/FinancialReport');
const TimeEntry = require('../models/TimeEntry');

/**
 * Get student accounting overview (revenues)
 * @route GET /api/accounting/students
 * @access Private (Admin)
 */
const getStudentAccounting = async (req, res) => {
  try {
    const { startDate, endDate, teacherId } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Build student query
    const studentQuery = { status: 'active' };
    if (teacherId) {
      // studentQuery.teacherId = teacherId;
    }
    
    // Get all active students
    const students = await Student.find(studentQuery)
      .populate('teacherId', 'profile.firstName profile.lastName email')
      .lean();
    
    // Get payment data for each student
    const studentAccounting = await Promise.all(
      students.map(async (student) => {
        // Get payments for this student in the period
        const payments = await Payment.find({
          studentId: student._id,
          paymentDate: { $gte: start, $lte: end }
        }).lean();
        
        // Calculate totals
        const totalPaid = payments
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + p.amount, 0);
        
        const totalPending = payments
          .filter(p => p.status === 'pending')
          .reduce((sum, p) => sum + p.amount, 0);
        
        const totalOverdue = payments
          .filter(p => p.status === 'pending' && p.dueDate && new Date(p.dueDate) < new Date())
          .reduce((sum, p) => sum + p.amount, 0);
        
        // For this example, assume each student has a total fee
        // This could be enhanced to track actual enrollment fees
        const estimatedTotalFee = totalPaid + totalPending; // Estimate
        const remainingBalance = Math.max(0, estimatedTotalFee - totalPaid);
        
        return {
          student: {
            _id: student._id,
            name: `${student.firstName} ${student.lastName}`,
            email: student.email,
            level: student.level,
            enrollmentDate: student.enrollmentDate,
            teacher: student.teacherId
          },
          financials: {
            estimatedTotalFee,
            totalPaid,
            totalPending,
            totalOverdue,
            remainingBalance,
            paymentHistory: payments.length
          }
        };
      })
    );
    
    // Calculate overall totals
    const overallTotals = studentAccounting.reduce(
      (totals, student) => ({
        totalFees: totals.totalFees + student.financials.estimatedTotalFee,
        totalPaid: totals.totalPaid + student.financials.totalPaid,
        totalPending: totals.totalPending + student.financials.totalPending,
        totalOverdue: totals.totalOverdue + student.financials.totalOverdue,
        totalRemaining: totals.totalRemaining + student.financials.remainingBalance
      }),
      { totalFees: 0, totalPaid: 0, totalPending: 0, totalOverdue: 0, totalRemaining: 0 }
    );
    
    return res.status(200).json({
      success: true,
      data: {
        students: studentAccounting,
        totals: overallTotals,
        period: { start, end },
        studentCount: studentAccounting.length
      }
    });
    
  } catch (error) {
    console.error('Get student accounting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Get teacher accounting overview (expenses)
 * @route GET /api/accounting/teachers
 * @access Private (Admin)
 */
const getTeacherAccounting = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get ALL teachers (users with role 'teacher')
    const allTeachers = await User.find({ role: 'teacher' })
      .select('_id email profile')
      .lean();
        
    // Get accounting data for each teacher
    const teachersAccounting = await Promise.all(
      allTeachers.map(async (teacher) => {
        // Get time entries for this teacher in the period
        const timeEntries = await TimeEntry.find({
          teacherId: teacher._id,
          date: { $gte: start, $lte: end }
        }).lean();
        
        // Calculate hours and earnings from time entries
        let totalHours = 0;
        let totalEarnings = 0;
        
        timeEntries.forEach(entry => {
          const hours = entry.hoursWorked || 0;
          const rate = entry.hourlyRate || 0;
          totalHours += hours;
          totalEarnings += hours * rate;
        });
        
        // Get payments made to this teacher
        const teacherPayments = await TeacherPayment.find({
          teacherId: teacher._id,
          createdAt: { $gte: start, $lte: end }
        }).lean();
        
        // Calculate payment totals
        const totalPaid = teacherPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0);
        
        const totalPending = teacherPayments
          .filter(p => ['pending', 'approved'].includes(p.status))
          .reduce((sum, p) => sum + p.amount, 0);
        
        // Calculate unpaid earnings (what they earned but haven't been paid)
        const unpaidEarnings = Math.max(0, totalEarnings - totalPaid - totalPending);
        
        return {
          teacher: {
            _id: teacher._id,
            name: `${teacher.profile.firstName} ${teacher.profile.lastName}`,
            email: teacher.email
          },
          hours: {
            totalHours,
            totalEarnings
          },
          payments: {
            totalPaid,
            totalPending,
            unpaidEarnings
          },
          status: {
            isPaidUp: unpaidEarnings <= 0,
            deficitAmount: unpaidEarnings > 0 ? unpaidEarnings : 0
          }
        };
      })
    );
    
    // Calculate overall teacher totals
    const teacherTotals = teachersAccounting.reduce(
      (totals, teacher) => ({
        totalHours: totals.totalHours + teacher.hours.totalHours,
        totalEarnings: totals.totalEarnings + teacher.hours.totalEarnings,
        totalPaid: totals.totalPaid + teacher.payments.totalPaid,
        totalPending: totals.totalPending + teacher.payments.totalPending,
        totalUnpaid: totals.totalUnpaid + teacher.payments.unpaidEarnings,
        totalDeficit: totals.totalDeficit + teacher.status.deficitAmount
      }),
      { totalHours: 0, totalEarnings: 0, totalPaid: 0, totalPending: 0, totalUnpaid: 0, totalDeficit: 0 }
    );
    
    return res.status(200).json({
      success: true,
      data: {
        teachers: teachersAccounting,
        totals: teacherTotals,
        period: { start, end },
        teacherCount: teachersAccounting.length
      }
    });
    
  } catch (error) {
    console.error('Get teacher accounting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Get general expenses overview
 * @route GET /api/accounting/expenses
 * @access Private (Admin)
 */
const getGeneralExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category, status = 'approved' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Build expense query
    const expenseQuery = {
      date: { $gte: start, $lte: end },
      status
    };
    
    if (category) {
      expenseQuery.category = category;
    }
    
    // Get expenses
    const expenses = await Expense.find(expenseQuery)
      .populate('submittedBy', 'profile.firstName profile.lastName email')
      .populate('approvedBy', 'profile.firstName profile.lastName')
      .sort({ date: -1 });
    
    // Group by category
    const expensesByCategory = await Expense.aggregate([
      { $match: expenseQuery },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
    
    // Calculate monthly breakdown
    const monthlyExpenses = await Expense.aggregate([
      { $match: expenseQuery },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Calculate totals
    const totals = expenses.reduce(
      (acc, expense) => ({
        totalAmount: acc.totalAmount + expense.amount,
        count: acc.count + 1
      }),
      { totalAmount: 0, count: 0 }
    );
    
    return res.status(200).json({
      success: true,
      data: {
        expenses,
        byCategory: expensesByCategory,
        monthlyBreakdown: monthlyExpenses,
        totals,
        period: { start, end }
      }
    });
    
  } catch (error) {
    console.error('Get general expenses error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Generate comprehensive financial report
 * @route POST /api/accounting/reports
 * @access Private (Admin)
 */
const generateFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate, reportType = 'custom' } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const report = await FinancialReport.generateReport(start, end, req.user._id, reportType);
    
    return res.status(201).json({
      success: true,
      message: 'Financial report generated successfully',
      data: report
    });
    
  } catch (error) {
    console.error('Generate financial report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Get saved financial reports
 * @route GET /api/accounting/reports
 * @access Private (Admin)
 */
const getFinancialReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, reportType } = req.query;
    
    const query = { isArchived: false };
    if (reportType) {
      query.reportType = reportType;
    }
    
    const reports = await FinancialReport.find(query)
      .populate('generatedBy', 'profile.firstName profile.lastName email')
      .sort({ reportDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await FinancialReport.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
    
  } catch (error) {
    console.error('Get financial reports error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Get profit/loss summary
 * @route GET /api/accounting/profit-loss
 * @access Private (Admin)
 */
const getProfitLossSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get student revenue
    const studentRevenue = await Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: start, $lte: end },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          paymentCount: { $sum: 1 }
        }
      }
    ]);
    
    // Get teacher expenses
    const teacherExpenses = await TeacherPayment.aggregate([
      {
        $match: {
          paymentDate: { $gte: start, $lte: end },
          status: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          paymentCount: { $sum: 1 }
        }
      }
    ]);
    
    // Get general expenses
    const generalExpenses = await Expense.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          expenseCount: { $sum: 1 }
        }
      }
    ]);
    
    const totalRevenue = studentRevenue[0]?.totalRevenue || 0;
    const totalTeacherExpenses = teacherExpenses[0]?.totalExpenses || 0;
    const totalGeneralExpenses = generalExpenses[0]?.totalExpenses || 0;
    const totalExpenses = totalTeacherExpenses + totalGeneralExpenses;
    const netIncome = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
    
    // Get breakdown by category
    const expenseBreakdown = await Expense.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    const summary = {
      period: { start, end },
      revenue: {
        studentPayments: totalRevenue,
        otherIncome: 0, // Can be expanded
        total: totalRevenue
      },
      expenses: {
        teacherPayments: totalTeacherExpenses,
        generalExpenses: totalGeneralExpenses,
        breakdown: expenseBreakdown,
        total: totalExpenses
      },
      netIncome,
      profitMargin: Math.round(profitMargin * 100) / 100,
      status: netIncome > 0 ? 'profit' : netIncome < 0 ? 'loss' : 'breakeven',
      metrics: {
        revenueCount: studentRevenue[0]?.paymentCount || 0,
        teacherPaymentCount: teacherExpenses[0]?.paymentCount || 0,
        generalExpenseCount: generalExpenses[0]?.expenseCount || 0
      }
    };
    
    return res.status(200).json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    console.error('Get profit/loss summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Get financial comparison between periods
 * @route GET /api/accounting/comparison
 * @access Private (Admin)
 */
const getFinancialComparison = async (req, res) => {
  try {
    const { 
      currentStart, 
      currentEnd, 
      previousStart, 
      previousEnd 
    } = req.query;
    
    if (!currentStart || !currentEnd || !previousStart || !previousEnd) {
      return res.status(400).json({
        success: false,
        message: 'All date parameters are required for comparison'
      });
    }
    
    const comparison = await FinancialReport.getComparison(
      new Date(currentStart),
      new Date(currentEnd),
      new Date(previousStart),
      new Date(previousEnd)
    );
    
    return res.status(200).json({
      success: true,
      data: comparison
    });
    
  } catch (error) {
    console.error('Get financial comparison error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Get cash flow summary
 * @route GET /api/accounting/cashflow
 * @access Private (Admin)
 */
const getCashFlow = async (req, res) => {
  try {
    const { startDate, endDate, period = 'monthly' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Define grouping based on period
    let groupBy;
    switch (period) {
      case 'daily':
        groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } };
        break;
      case 'weekly':
        groupBy = { $week: '$paymentDate' };
        break;
      case 'monthly':
        groupBy = { $dateToString: { format: '%Y-%m', date: '$paymentDate' } };
        break;
      case 'yearly':
        groupBy = { $year: '$paymentDate' };
        break;
      default:
        groupBy = { $dateToString: { format: '%Y-%m', date: '$paymentDate' } };
    }
    
    // Get cash inflows (student payments)
    const cashInflows = await Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: start, $lte: end },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: groupBy,
          totalInflow: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get cash outflows (teacher payments + expenses)
    const teacherOutflows = await TeacherPayment.aggregate([
      {
        $match: {
          paymentDate: { $gte: start, $lte: end },
          status: 'paid'
        }
      },
      {
        $group: {
          _id: groupBy,
          totalOutflow: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const expenseOutflows = await Expense.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: period === 'daily' 
            ? { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
            : period === 'weekly'
            ? { $week: '$date' }
            : period === 'monthly'
            ? { $dateToString: { format: '%Y-%m', date: '$date' } }
            : { $year: '$date' },
          totalOutflow: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Combine and calculate net cash flow
    const allPeriods = new Set([
      ...cashInflows.map(item => item._id),
      ...teacherOutflows.map(item => item._id),
      ...expenseOutflows.map(item => item._id)
    ]);
    
    const cashFlow = Array.from(allPeriods).map(periodId => {
      const inflow = cashInflows.find(item => item._id === periodId)?.totalInflow || 0;
      const teacherOutflow = teacherOutflows.find(item => item._id === periodId)?.totalOutflow || 0;
      const expenseOutflow = expenseOutflows.find(item => item._id === periodId)?.totalOutflow || 0;
      const totalOutflow = teacherOutflow + expenseOutflow;
      const netCashFlow = inflow - totalOutflow;
      
      return {
        period: periodId,
        inflow,
        outflow: totalOutflow,
        netCashFlow,
        details: {
          teacherPayments: teacherOutflow,
          generalExpenses: expenseOutflow
        }
      };
    }).sort((a, b) => a.period.localeCompare(b.period));
    
    // Calculate running total
    let runningTotal = 0;
    cashFlow.forEach(item => {
      runningTotal += item.netCashFlow;
      item.runningTotal = runningTotal;
    });
    
    return res.status(200).json({
      success: true,
      data: {
        cashFlow,
        period: { start, end },
        summary: {
          totalInflow: cashFlow.reduce((sum, item) => sum + item.inflow, 0),
          totalOutflow: cashFlow.reduce((sum, item) => sum + item.outflow, 0),
          netCashFlow: cashFlow.reduce((sum, item) => sum + item.netCashFlow, 0),
          finalBalance: runningTotal
        }
      }
    });
    
  } catch (error) {
    console.error('Get cash flow error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  getStudentAccounting,
  getTeacherAccounting,
  getGeneralExpenses,
  generateFinancialReport,
  getFinancialReports,
  getProfitLossSummary,
  getFinancialComparison,
  getCashFlow
};
