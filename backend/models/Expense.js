const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Submitted by is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
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
    ],
    default: 'other'
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: [50, 'Subcategory cannot exceed 50 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  currency: {
    type: String,
    default: 'DZD',
    uppercase: true,
    maxlength: [3, 'Currency code cannot exceed 3 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  receiptUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        // Basic URL validation
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Please provide a valid URL for the receipt'
    }
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    validate: {
      validator: function(value) {
        // Allow expenses up to 30 days in the future for recurring expenses
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return value <= thirtyDaysFromNow;
      },
      message: 'Date cannot be more than 30 days in the future'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.status === 'approved';
    }
  },
  approvedAt: {
    type: Date,
    required: function() {
      return this.status === 'approved';
    }
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.status === 'rejected';
    }
  },
  rejectedAt: {
    type: Date,
    required: function() {
      return this.status === 'rejected';
    }
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
    required: function() {
      return this.status === 'rejected';
    }
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly'],
    required: function() {
      return this.isRecurring;
    }
  },
  nextRecurringDate: {
    type: Date,
    required: function() {
      return this.isRecurring;
    }
  },
  parentExpenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Indexes for performance
expenseSchema.index({ submittedBy: 1, createdAt: -1 });
expenseSchema.index({ status: 1, createdAt: -1 });
expenseSchema.index({ date: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ approvedBy: 1 });

// Virtual for formatted amount
expenseSchema.virtual('formattedAmount').get(function() {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

// Virtual to check if expense is pending
expenseSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

// Virtual to check if expense is approved
expenseSchema.virtual('isApproved').get(function() {
  return this.status === 'approved';
});

// Virtual to check if expense is rejected
expenseSchema.virtual('isRejected').get(function() {
  return this.status === 'rejected';
});

// Method to approve expense
expenseSchema.methods.approve = function(approvedBy) {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  // Clear any rejection data
  this.rejectedBy = undefined;
  this.rejectedAt = undefined;
  this.rejectionReason = undefined;
};

// Method to reject expense
expenseSchema.methods.reject = function(rejectedBy, reason) {
  this.status = 'rejected';
  this.rejectedBy = rejectedBy;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  // Clear any approval data
  this.approvedBy = undefined;
  this.approvedAt = undefined;
};

// Method to calculate next recurring date
expenseSchema.methods.calculateNextRecurringDate = function() {
  if (!this.isRecurring) return null;
  
  const currentDate = new Date(this.date);
  
  switch (this.recurringFrequency) {
    case 'weekly':
      currentDate.setDate(currentDate.getDate() + 7);
      break;
    case 'monthly':
      currentDate.setMonth(currentDate.getMonth() + 1);
      break;
    case 'quarterly':
      currentDate.setMonth(currentDate.getMonth() + 3);
      break;
  }
  
  return currentDate;
};

// Pre-save middleware to set next recurring date
expenseSchema.pre('save', function(next) {
  if (this.isRecurring && !this.nextRecurringDate) {
    this.nextRecurringDate = this.calculateNextRecurringDate();
  }
  next();
});

// Static method to get expense statistics
expenseSchema.statics.getExpenseStats = async function(userId, filters = {}) {
  const matchQuery = { submittedBy: userId };
  
  if (filters.status) {
    matchQuery.status = filters.status;
  }
  
  if (filters.startDate || filters.endDate) {
    matchQuery.date = {};
    if (filters.startDate) matchQuery.date.$gte = new Date(filters.startDate);
    if (filters.endDate) matchQuery.date.$lte = new Date(filters.endDate);
  }
  
  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        approvedCount: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        rejectedCount: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        pendingAmount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
        approvedAmount: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] } },
        rejectedAmount: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, '$amount', 0] } }
      }
    }
  ]);
  
  return stats[0] || {
    totalExpenses: 0,
    totalAmount: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    rejectedAmount: 0
  };
};

// Static method to get expenses by category
expenseSchema.statics.getExpensesByCategory = async function(userId, filters = {}) {
  const matchQuery = { submittedBy: userId };
  
  if (filters.status) {
    matchQuery.status = filters.status;
  }
  
  if (filters.startDate || filters.endDate) {
    matchQuery.date = {};
    if (filters.startDate) matchQuery.date.$gte = new Date(filters.startDate);
    if (filters.endDate) matchQuery.date.$lte = new Date(filters.endDate);
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        expenseCount: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
};

// Static method to get pending expenses for admin
expenseSchema.statics.getPendingExpenses = function(filters = {}) {
  const query = { status: 'pending' };
  
  if (filters.submittedBy) {
    query.submittedBy = filters.submittedBy;
  }
  
  if (filters.category) {
    query.category = new RegExp(filters.category, 'i');
  }
  
  return this.find(query)
    .populate('submittedBy', 'profile.firstName profile.lastName email')
    .sort({ createdAt: -1 });
};

// Ensure virtual fields are serialized
expenseSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Expense', expenseSchema);
