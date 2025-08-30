const User = require('../models/User');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const TimeEntry = require('../models/TimeEntry');
const AuditLog = require('../models/AuditLog');
const Expense = require('../models/Expense');

/**
 * Get dashboard statistics
 * @route GET /api/dashboard/stats
 * @access Private (Admin, Teacher)
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // Calculate basic counts
    const teacherCount = await User.countDocuments({ role: 'teacher' });
    const studentCount = await Student.countDocuments();
    
    // Get date ranges
    const now = new Date();
    
    // Daily range (today)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    // Weekly range (this week)
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Monthly range (this month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    // Calculate daily stats
    const dailyPayments = await Payment.find({
      paymentDate: { $gte: startOfDay, $lte: endOfDay },
      status: 'paid'
    });
    const dailyTimeEntries = await TimeEntry.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    let dailyRevenue = 0;
    let dailyHours = 0;
    dailyPayments.forEach(payment => {
      dailyRevenue += payment.amount;
    });
    dailyTimeEntries.forEach(entry => {
      if (entry.hoursWorked) {
        dailyHours += entry.hoursWorked;
      }
    });
    
    // Calculate weekly stats
    const weeklyPayments = await Payment.find({
      paymentDate: { $gte: startOfWeek, $lte: endOfWeek },
      status: 'paid'
    });
    const weeklyTimeEntries = await TimeEntry.find({
      date: { $gte: startOfWeek, $lte: endOfWeek }
    });
    
    let weeklyRevenue = 0;
    let weeklyHours = 0;
    weeklyPayments.forEach(payment => {
      weeklyRevenue += payment.amount;
    });
    weeklyTimeEntries.forEach(entry => {
      if (entry.hoursWorked) {
        weeklyHours += entry.hoursWorked;
      }
    });
    
    // Calculate monthly stats
    const monthlyPayments = await Payment.find({
      paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'paid'
    });
    const monthlyTimeEntries = await TimeEntry.find({
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    let monthlyRevenue = 0;
    let monthlyHours = 0;
    monthlyPayments.forEach(payment => {
      monthlyRevenue += payment.amount;
    });
    monthlyTimeEntries.forEach(entry => {
      if (entry.hoursWorked) {
        monthlyHours += entry.hoursWorked;
      }
    });
    
    // Return dashboard stats
    return res.status(200).json({
      success: true,
      data: {
        totalTeachers: teacherCount,
        totalStudents: studentCount,
        dailyStats: {
          revenue: Math.round(dailyRevenue * 100) / 100,
          hours: Math.round(dailyHours * 100) / 100
        },
        weeklyStats: {
          revenue: Math.round(weeklyRevenue * 100) / 100,
          hours: Math.round(weeklyHours * 100) / 100
        },
        monthlyStats: {
          revenue: Math.round(monthlyRevenue * 100) / 100,
          hours: Math.round(monthlyHours * 100) / 100
        },
        // Keep legacy fields for backwards compatibility
        monthlyRevenue,
        monthlyHours,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

/**
 * Get recent activities
 * @route GET /api/dashboard/activities
 * @access Private (Admin)
 */
exports.getRecentActivities = async (req, res) => {
  try {
    // Get the 10 most recent audit logs
    const recentLogs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'profile.firstName profile.lastName email role')
      .lean();

    // Format the activities for frontend display
    const activities = recentLogs.map(log => {
      let activity = {
        id: log._id,
        action: log.action,
        timestamp: log.createdAt,
        targetType: log.targetType,
        details: log.details || ''
      };

      // Add user information if available
      if (log.userId) {
        activity.user = {
          id: log.userId._id,
          name: `${log.userId.profile.firstName} ${log.userId.profile.lastName}`,
          email: log.userId.email,
          role: log.userId.role
        };
      }

      return activity;
    });

    return res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Recent activities error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching recent activities',
      error: error.message
    });
  }
};

/**
 * Get pending actions
 * @route GET /api/dashboard/pending-actions
 * @access Private (Admin)
 */
exports.getPendingActions = async (req, res) => {
  try {
    // Get count of pending teacher approvals
    const pendingTeacherCount = await User.countDocuments({ 
      role: 'teacher', 
      status: 'pending' 
    });

    // Get pending expenses
    const pendingExpenses = await Expense.find({ status: 'pending' })
      .select('amount')
      .lean();
    
    // Calculate total pending expense amount
    const pendingExpenseCount = pendingExpenses.length;
    const pendingExpenseAmount = pendingExpenses.reduce((total, expense) => total + expense.amount, 0);

    return res.status(200).json({
      success: true,
      data: {
        pendingTeacherApprovals: {
          count: pendingTeacherCount
        },
        pendingExpenseApprovals: {
          count: pendingExpenseCount,
          totalAmount: pendingExpenseAmount
        }
      }
    });
  } catch (error) {
    console.error('Pending actions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching pending actions',
      error: error.message
    });
  }
};

/**
 * Get teacher-specific dashboard statistics
 * @route GET /api/dashboard/teacher-stats
 * @access Private (Teacher)
 */
exports.getTeacherDashboardStats = async (req, res) => {
  try {
    const teacherId = req.user.id; // From auth middleware
    
    // Get teacher's students count
    const myStudents = await Student.countDocuments({ teacherId });
    
    // Get date ranges
    const now = new Date();
    
    // Daily range (today)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    // Weekly range (this week)
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Monthly range (this month)
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);
    
    // Calculate daily stats
    const dailyTimeEntries = await TimeEntry.find({
      teacherId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    let dailyHours = 0;
    let dailyEarnings = 0;
    dailyTimeEntries.forEach(entry => {
      if (entry.hoursWorked) {
        dailyHours += entry.hoursWorked;
      }
      if (entry.totalAmount) {
        dailyEarnings += entry.totalAmount;
      }
    });
    
    // Calculate weekly stats
    const weeklyTimeEntries = await TimeEntry.find({
      teacherId,
      date: { $gte: startOfWeek, $lte: endOfWeek }
    });
    
    let weeklyHours = 0;
    let weeklyEarnings = 0;
    weeklyTimeEntries.forEach(entry => {
      if (entry.hoursWorked) {
        weeklyHours += entry.hoursWorked;
      }
      if (entry.totalAmount) {
        weeklyEarnings += entry.totalAmount;
      }
    });
    
    // Calculate monthly stats
    const monthlyTimeEntries = await TimeEntry.find({
      teacherId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    let monthlyHours = 0;
    let monthlyEarnings = 0;
    monthlyTimeEntries.forEach(entry => {
      if (entry.hoursWorked) {
        monthlyHours += entry.hoursWorked;
      }
      if (entry.totalAmount) {
        monthlyEarnings += entry.totalAmount;
      }
    });
    
    // Calculate average hourly rate
    const avgRate = monthlyHours > 0 ? monthlyEarnings / monthlyHours : 0;
    
    // Get recent time entries (last 5)
    const recentTimeEntries = await TimeEntry.find({ teacherId })
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .lean();
    
    // Format recent entries for frontend
    const recentEntries = recentTimeEntries.map(entry => ({
      id: entry._id,
      className: 'Time Entry',
      hours: entry.hoursWorked,
      amount: entry.totalAmount,
      date: entry.date,
      dateString: getRelativeDateString(entry.date)
    }));
    
    // Return teacher dashboard stats
    return res.status(200).json({
      success: true,
      data: {
        myStudents,
        dailyStats: {
          hours: Math.round(dailyHours * 100) / 100,
          earnings: Math.round(dailyEarnings * 100) / 100
        },
        weeklyStats: {
          hours: Math.round(weeklyHours * 100) / 100,
          earnings: Math.round(weeklyEarnings * 100) / 100
        },
        monthlyStats: {
          hours: Math.round(monthlyHours * 100) / 100,
          earnings: Math.round(monthlyEarnings * 100) / 100
        },
        avgRate: Math.round(avgRate * 100) / 100,
        recentEntries,
        // Keep legacy fields for backwards compatibility
        weeklyHours: Math.round(weeklyHours * 100) / 100,
        monthlyEarnings: Math.round(monthlyEarnings * 100) / 100,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Teacher dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching teacher dashboard statistics',
      error: error.message
    });
  }
};

// Helper function to get relative date string
function getRelativeDateString(date) {
  const now = new Date();
  const entryDate = new Date(date);
  const diffTime = Math.abs(now - entryDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return entryDate.toLocaleDateString();
  }
}
