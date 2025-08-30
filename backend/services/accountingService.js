const Student = require('../models/Student');
const Payment = require('../models/Payment');
const TeacherPayment = require('../models/TeacherPayment');
const User = require('../models/User');
const Expense = require('../models/Expense');
const FinancialReport = require('../models/FinancialReport');
const TimeEntry = require('../models/TimeEntry');

class AccountingService {
  /**
   * Get comprehensive student accounting data
   * @param {Date} startDate - Start date for the period
   * @param {Date} endDate - End date for the period
   * @param {String} teacherId - Optional teacher filter
   * @returns {Object} Student accounting data
   */
  async getStudentAccountingData(startDate, endDate, teacherId = null) {
    try {
      // Build student query
      const studentQuery = { status: 'active' };
      if (teacherId) {
        studentQuery.teacherId = teacherId;
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
            paymentDate: { $gte: startDate, $lte: endDate }
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
          
          // Calculate estimated total fee (this could be enhanced with actual fee structure)
          const estimatedTotalFee = totalPaid + totalPending + (totalPaid * 0.2);
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
      const totals = studentAccounting.reduce(
        (acc, student) => ({
          totalFees: acc.totalFees + student.financials.estimatedTotalFee,
          totalPaid: acc.totalPaid + student.financials.totalPaid,
          totalPending: acc.totalPending + student.financials.totalPending,
          totalOverdue: acc.totalOverdue + student.financials.totalOverdue,
          totalRemaining: acc.totalRemaining + student.financials.remainingBalance
        }),
        { totalFees: 0, totalPaid: 0, totalPending: 0, totalOverdue: 0, totalRemaining: 0 }
      );
      
      return {
        students: studentAccounting,
        totals,
        period: { start: startDate, end: endDate },
        studentCount: studentAccounting.length
      };
      
    } catch (error) {
      throw new Error(`Failed to get student accounting data: ${error.message}`);
    }
  }

  /**
   * Get comprehensive teacher accounting data
   * @param {Date} startDate - Start date for the period
   * @param {Date} endDate - End date for the period
   * @returns {Object} Teacher accounting data
   */
  async getTeacherAccountingData(startDate, endDate) {
    try {
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
            date: { $gte: startDate, $lte: endDate }
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
            createdAt: { $gte: startDate, $lte: endDate }
          }).lean();
          
          // Calculate payment totals
          const totalPaid = teacherPayments
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + p.amount, 0);
          
          const totalPending = teacherPayments
            .filter(p => ['pending', 'approved'].includes(p.status))
            .reduce((sum, p) => sum + p.amount, 0);
          
          // Calculate unpaid earnings
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
            },
            timeEntries: timeEntries.length
          };
        })
      );
      
      // Calculate overall teacher totals
      const totals = teachersAccounting.reduce(
        (acc, teacher) => ({
          totalHours: acc.totalHours + teacher.hours.totalHours,
          totalEarnings: acc.totalEarnings + teacher.hours.totalEarnings,
          totalPaid: acc.totalPaid + teacher.payments.totalPaid,
          totalPending: acc.totalPending + teacher.payments.totalPending,
          totalUnpaid: acc.totalUnpaid + teacher.payments.unpaidEarnings,
          totalDeficit: acc.totalDeficit + teacher.status.deficitAmount
        }),
        { totalHours: 0, totalEarnings: 0, totalPaid: 0, totalPending: 0, totalUnpaid: 0, totalDeficit: 0 }
      );
      
      return {
        teachers: teachersAccounting,
        totals,
        period: { start: startDate, end: endDate },
        teacherCount: teachersAccounting.length
      };
      
    } catch (error) {
      throw new Error(`Failed to get teacher accounting data: ${error.message}`);
    }
  }

  /**
   * Get general expenses data
   * @param {Date} startDate - Start date for the period
   * @param {Date} endDate - End date for the period
   * @param {String} category - Optional category filter
   * @param {String} status - Expense status filter
   * @returns {Object} Expenses data
   */
  async getGeneralExpensesData(startDate, endDate, category = null, status = 'approved') {
    try {
      // Build expense query
      const expenseQuery = {
        date: { $gte: startDate, $lte: endDate },
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
      
      return {
        expenses,
        byCategory: expensesByCategory,
        monthlyBreakdown: monthlyExpenses,
        totals,
        period: { start: startDate, end: endDate }
      };
      
    } catch (error) {
      throw new Error(`Failed to get general expenses data: ${error.message}`);
    }
  }

  /**
   * Get profit and loss summary
   * @param {Date} startDate - Start date for the period
   * @param {Date} endDate - End date for the period
   * @returns {Object} Profit and loss data
   */
  async getProfitLossSummary(startDate, endDate) {
    try {
      // Get student revenue
      const studentRevenue = await Payment.aggregate([
        {
          $match: {
            paymentDate: { $gte: startDate, $lte: endDate },
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
            paymentDate: { $gte: startDate, $lte: endDate },
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
            date: { $gte: startDate, $lte: endDate },
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
      
      // Get expense breakdown by category
      const expenseBreakdown = await Expense.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
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
      
      const totalRevenue = studentRevenue[0]?.totalRevenue || 0;
      const totalTeacherExpenses = teacherExpenses[0]?.totalExpenses || 0;
      const totalGeneralExpenses = generalExpenses[0]?.totalExpenses || 0;
      const totalExpenses = totalTeacherExpenses + totalGeneralExpenses;
      const netIncome = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
      
      return {
        period: { start: startDate, end: endDate },
        revenue: {
          studentPayments: totalRevenue,
          otherIncome: 0,
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
      
    } catch (error) {
      throw new Error(`Failed to get profit/loss summary: ${error.message}`);
    }
  }

  /**
   * Create a payment record
   * @param {Object} paymentData - Payment data
   * @param {String} paymentType - Type of payment (student, teacher, expense)
   * @returns {Object} Created payment
   */
  async createPayment(paymentData, paymentType) {
    try {
      let payment;
      
      switch (paymentType) {
        case 'student':
          payment = new Payment(paymentData);
          break;
        case 'teacher':
          payment = new TeacherPayment(paymentData);
          break;
        case 'expense':
          payment = new Expense(paymentData);
          break;
        default:
          throw new Error('Invalid payment type');
      }
      
      await payment.save();
      return payment;
      
    } catch (error) {
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  /**
   * Get cash flow data
   * @param {Date} startDate - Start date for the period
   * @param {Date} endDate - End date for the period
   * @param {String} period - Grouping period (daily, weekly, monthly, yearly)
   * @returns {Object} Cash flow data
   */
  async getCashFlowData(startDate, endDate, period = 'monthly') {
    try {
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
            paymentDate: { $gte: startDate, $lte: endDate },
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
            paymentDate: { $gte: startDate, $lte: endDate },
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
            date: { $gte: startDate, $lte: endDate },
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
      
      return {
        cashFlow,
        period: { start: startDate, end: endDate },
        summary: {
          totalInflow: cashFlow.reduce((sum, item) => sum + item.inflow, 0),
          totalOutflow: cashFlow.reduce((sum, item) => sum + item.outflow, 0),
          netCashFlow: cashFlow.reduce((sum, item) => sum + item.netCashFlow, 0),
          finalBalance: runningTotal
        }
      };
      
    } catch (error) {
      throw new Error(`Failed to get cash flow data: ${error.message}`);
    }
  }

  /**
   * Get financial metrics for dashboard
   * @param {Date} startDate - Start date for the period
   * @param {Date} endDate - End date for the period
   * @returns {Object} Financial metrics
   */
  async getFinancialMetrics(startDate, endDate) {
    try {
      const [studentData, teacherData, expenseData, profitLoss] = await Promise.all([
        this.getStudentAccountingData(startDate, endDate),
        this.getTeacherAccountingData(startDate, endDate),
        this.getGeneralExpensesData(startDate, endDate),
        this.getProfitLossSummary(startDate, endDate)
      ]);
      
      return {
        revenue: {
          total: profitLoss.revenue.total,
          growth: 0, // Would need previous period comparison
          studentCount: studentData.studentCount
        },
        expenses: {
          total: profitLoss.expenses.total,
          teacherPayments: profitLoss.expenses.teacherPayments,
          generalExpenses: profitLoss.expenses.generalExpenses
        },
        netIncome: profitLoss.netIncome,
        profitMargin: profitLoss.profitMargin,
        teachers: {
          count: teacherData.teacherCount,
          totalHours: teacherData.totals.totalHours,
          totalOwed: teacherData.totals.totalUnpaid
        },
        students: {
          count: studentData.studentCount,
          totalOwed: studentData.totals.totalRemaining,
          overdue: studentData.totals.totalOverdue
        }
      };
      
    } catch (error) {
      throw new Error(`Failed to get financial metrics: ${error.message}`);
    }
  }
}

module.exports = new AccountingService();
