const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const User = require('../models/User');
const { logAuditEntry } = require('../middleware/audit');

// Get all expenses
const getExpenses = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'admin') {
      // Admin can see all expenses or filter by submittedBy
      if (req.query.submittedBy) {
        query.submittedBy = req.query.submittedBy;
      }
      // If no submittedBy specified, show all expenses
    } else {
      // Teachers can only see their own expenses
      query.submittedBy = req.user._id;
    }
    
    // Add status filtering if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Add category filtering if provided
    if (req.query.category) {
      query.category = new RegExp(req.query.category, 'i');
    }
    
    // Add date filtering if provided
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) {
        query.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.date.$lte = new Date(req.query.endDate);
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const expenses = await Expense.find(query)
      .populate('submittedBy', 'profile.firstName profile.lastName email')
      .populate('approvedBy', 'profile.firstName profile.lastName email')
      .populate('rejectedBy', 'profile.firstName profile.lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single expense
const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('submittedBy', 'profile.firstName profile.lastName email')
      .populate('approvedBy', 'profile.firstName profile.lastName email')
      .populate('rejectedBy', 'profile.firstName profile.lastName email')
      .populate('parentExpenseId', 'description amount category');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.'
      });
    }

    // Check if user can access this expense
    if (req.user.role !== 'admin' && expense.submittedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own expenses.'
      });
    }

    res.json({
      success: true,
      data: {
        expense
      }
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new expense
const createExpense = async (req, res) => {
  try {
    const {
      category,
      amount,
      currency,
      description,
      date,
      receiptUrl,
      isRecurring,
      recurringFrequency,
      tags,
      notes
    } = req.body;

    // Validate required fields
    if (!category || !amount || !description || !date) {
      return res.status(400).json({
        success: false,
        message: 'Category, amount, description, and date are required.'
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0.'
      });
    }

    // Validate recurring frequency if expense is recurring
    if (isRecurring && !recurringFrequency) {
      return res.status(400).json({
        success: false,
        message: 'Recurring frequency is required for recurring expenses.'
      });
    }

    // Check if user requires approval
    const user = await User.findById(req.user._id);
    let status = 'pending';
    
    if (!user.expenseApprovalRequired) {
      status = 'approved';
    }

    // Create expense
    const expense = new Expense({
      submittedBy: req.user._id,
      category: category.trim(),
      amount: Number(amount),
      currency: currency || user.settings.currency || 'DZD',
      description: description.trim(),
      date: new Date(date),
      receiptUrl: receiptUrl?.trim(),
      status,
      isRecurring: isRecurring || false,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
      tags: tags || [],
      notes: notes?.trim()
    });

    // If auto-approved, set approval details
    if (status === 'approved') {
      expense.approvedBy = req.user._id;
      expense.approvedAt = new Date();
    }

    await expense.save();

    // Populate for response
    await expense.populate([
      { path: 'submittedBy', select: 'profile.firstName profile.lastName email' },
      { path: 'approvedBy', select: 'profile.firstName profile.lastName email' },
      { path: 'rejectedBy', select: 'profile.firstName profile.lastName email' }
    ]);

    res.status(201).json({
      success: true,
      message: status === 'approved' ? 'Expense created and approved automatically.' : 'Expense created and submitted for approval.',
      data: {
        expense
      }
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update expense
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.'
      });
    }

    // Check if user can update this expense
    if (req.user.role !== 'admin' && expense.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own expenses.'
      });
    }

    // Check if expense can be updated (only pending expenses can be updated by submitter)
    if (req.user.role !== 'admin' && expense.status !== 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Only pending expenses can be updated.'
      });
    }

    const {
      category,
      amount,
      currency,
      description,
      date,
      receiptUrl,
      isRecurring,
      recurringFrequency,
      tags,
      notes
    } = req.body;

    // Validate amount if provided
    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0.'
      });
    }

    // Validate recurring frequency if expense is being set to recurring
    if (isRecurring && !recurringFrequency) {
      return res.status(400).json({
        success: false,
        message: 'Recurring frequency is required for recurring expenses.'
      });
    }

    // Update fields
    if (category !== undefined) expense.category = category.trim();
    if (amount !== undefined) expense.amount = Number(amount);
    if (currency !== undefined) expense.currency = currency;
    if (description !== undefined) expense.description = description.trim();
    if (date !== undefined) expense.date = new Date(date);
    if (receiptUrl !== undefined) expense.receiptUrl = receiptUrl?.trim();
    if (isRecurring !== undefined) expense.isRecurring = isRecurring;
    if (recurringFrequency !== undefined) expense.recurringFrequency = recurringFrequency;
    if (tags !== undefined) expense.tags = tags;
    if (notes !== undefined) expense.notes = notes?.trim();

    await expense.save();

    // Populate for response
    await expense.populate([
      { path: 'submittedBy', select: 'profile.firstName profile.lastName email' },
      { path: 'approvedBy', select: 'profile.firstName profile.lastName email' },
      { path: 'rejectedBy', select: 'profile.firstName profile.lastName email' }
    ]);

    res.json({
      success: true,
      message: 'Expense updated successfully.',
      data: {
        expense
      }
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete expense
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.'
      });
    }

    // Check if user can delete this expense
    if (req.user.role !== 'admin' && expense.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own expenses.'
      });
    }

    // Check if expense can be deleted
    if (req.user.role !== 'admin' && expense.status === 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Approved expenses cannot be deleted.'
      });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Expense deleted successfully.'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Approve expense (Admin only)
const approveExpense = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can approve expenses.'
      });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.'
      });
    }

    // Check if expense is pending
    if (expense.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending expenses can be approved.'
      });
    }

    // Approve expense
    expense.approve(req.user._id);
    await expense.save();

    // Populate for response
    await expense.populate([
      { path: 'submittedBy', select: 'profile.firstName profile.lastName email' },
      { path: 'approvedBy', select: 'profile.firstName profile.lastName email' }
    ]);

    res.json({
      success: true,
      message: 'Expense approved successfully.',
      data: {
        expense
      }
    });
  } catch (error) {
    console.error('Approve expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve expense.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Reject expense (Admin only)
const rejectExpense = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can reject expenses.'
      });
    }

    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required.'
      });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.'
      });
    }

    // Check if expense is pending
    if (expense.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending expenses can be rejected.'
      });
    }

    // Reject expense
    expense.reject(req.user._id, reason.trim());
    await expense.save();

    // Populate for response
    await expense.populate([
      { path: 'submittedBy', select: 'profile.firstName profile.lastName email' },
      { path: 'rejectedBy', select: 'profile.firstName profile.lastName email' }
    ]);

    res.json({
      success: true,
      message: 'Expense rejected successfully.',
      data: {
        expense
      }
    });
  } catch (error) {
    console.error('Reject expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject expense.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get expense statistics
const getExpenseStats = async (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? (req.query.userId || req.user._id) : req.user._id;

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status: req.query.status
    };

    const stats = await Expense.getExpenseStats(userId, filters);
    const categoryBreakdown = await Expense.getExpensesByCategory(userId, filters);

    res.json({
      success: true,
      data: {
        stats,
        categoryBreakdown,
        period: {
          startDate: filters.startDate || 'All time',
          endDate: filters.endDate || 'All time'
        }
      }
    });
  } catch (error) {
    console.error('Get expense stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense statistics.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get pending expenses for admin
const getPendingExpenses = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can view pending expenses.'
      });
    }

    const filters = {
      submittedBy: req.query.submittedBy,
      category: req.query.category
    };

    const pendingExpenses = await Expense.getPendingExpenses(filters);

    res.json({
      success: true,
      data: {
        pendingExpenses,
        count: pendingExpenses.length
      }
    });
  } catch (error) {
    console.error('Get pending expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending expenses.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  getExpenseStats,
  getPendingExpenses
};
