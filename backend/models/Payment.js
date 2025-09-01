const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required'],
    index: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher ID is required'],
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0.01, 'Payment amount must be greater than 0'],
    max: [999999.99, 'Payment amount cannot exceed 999,999.99'],
    validate: {
      validator: function(value) {
        // Ensure amount has at most 2 decimal places
        return Math.round(value * 100) / 100 === value;
      },
      message: 'Amount must have at most 2 decimal places'
    }
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['DZD', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'TRY'],
    default: 'DZD',
    uppercase: true
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['cash', 'bank_transfer', 'check', 'online', 'card', 'mobile_payment'],
    default: 'cash'
  },
  paymentDate: {
    type: Date,
    required: [true, 'Payment date is required'],
    validate: {
      validator: function(value) {
        // Payment date cannot be more than 1 day in the future
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return value <= tomorrow;
      },
      message: 'Payment date cannot be more than 1 day in the future'
    },
    index: true
  },
  paymentType: {
    type: String,
    required: [true, 'Payment type is required'],
    enum: ['lesson_payment', 'registration_fee', 'material_fee', 'makeup_fee', 'late_fee', 'other'],
    default: 'lesson_payment'
  },
  reference: {
    type: String,
    trim: true,
    maxlength: [100, 'Reference cannot exceed 100 characters'],
    sparse: true // Allows multiple null values but enforces uniqueness for non-null values
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'completed',
    index: true
  },
  academicPeriod: {
    type: String,
    trim: true,
    maxlength: [50, 'Academic period cannot exceed 50 characters'],
    index: true
  },
  relatedAttendance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance',
    required: false
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(value) {
        // Due date should be after payment date if both exist
        if (!value || !this.paymentDate) return true;
        return value >= this.paymentDate;
      },
      message: 'Due date must be after payment date'
    }
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.status === 'completed' && this.wasModified;
    }
  },
  approvedAt: {
    type: Date,
    required: function() {
      return this.status === 'completed' && this.wasModified;
    }
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.status === 'failed' && this.rejectionReason;
    }
  },
  rejectedAt: {
    type: Date,
    required: function() {
      return this.status === 'failed' && this.rejectionReason;
    }
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
    required: function() {
      return this.status === 'failed' && this.rejectedBy;
    }
  },
  receiptNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Receipt number cannot exceed 50 characters'],
    unique: true,
    sparse: true
  },
  refundInfo: {
    refundAmount: {
      type: Number,
      min: [0, 'Refund amount must be positive'],
      validate: {
        validator: function(value) {
          // Refund amount cannot exceed original payment amount
          return !value || value <= this.parent().amount;
        },
        message: 'Refund amount cannot exceed original payment amount'
      }
    },
    refundDate: {
      type: Date,
      validate: {
        validator: function(value) {
          // Refund date must be after payment date
          return !value || value >= this.parent().paymentDate;
        },
        message: 'Refund date must be after payment date'
      }
    },
    refundReason: {
      type: String,
      trim: true,
      maxlength: [200, 'Refund reason cannot exceed 200 characters']
    },
    refundMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'check', 'online', 'card', 'mobile_payment']
    }
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringInfo: {
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
      required: function() {
        return this.parent().isRecurring;
      }
    },
    nextPaymentDate: {
      type: Date,
      required: function() {
        return this.parent().isRecurring;
      }
    },
    endDate: {
      type: Date,
      validate: {
        validator: function(value) {
          // End date must be after next payment date
          return !value || !this.nextPaymentDate || value > this.nextPaymentDate;
        },
        message: 'End date must be after next payment date'
      }
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
paymentSchema.index({ studentId: 1, paymentDate: -1 });
paymentSchema.index({ teacherId: 1, paymentDate: -1 });
paymentSchema.index({ paymentDate: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentType: 1 });
paymentSchema.index({ academicPeriod: 1 });

// Compound indexes for common queries
paymentSchema.index({ teacherId: 1, status: 1, paymentDate: -1 });
paymentSchema.index({ studentId: 1, status: 1, paymentDate: -1 });
paymentSchema.index({ paymentDate: 1, status: 1 });

// Virtual for formatted amount with currency
paymentSchema.virtual('formattedAmount').get(function() {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

// Virtual for net amount (after refunds)
paymentSchema.virtual('netAmount').get(function() {
  const refundAmount = this.refundInfo?.refundAmount || 0;
  return this.amount - refundAmount;
});

// Virtual for payment age in days
paymentSchema.virtual('paymentAge').get(function() {
  const now = new Date();
  const paymentDate = new Date(this.paymentDate);
  const diffTime = Math.abs(now - paymentDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for overdue status
paymentSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed') return false;
  return new Date() > this.dueDate;
});

// Virtual for days overdue
paymentSchema.virtual('daysOverdue').get(function() {
  if (!this.isOverdue) return 0;
  const now = new Date();
  const dueDate = new Date(this.dueDate);
  const diffTime = Math.abs(now - dueDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to process refund
paymentSchema.methods.processRefund = function(refundAmount, reason, method) {
  if (this.status !== 'completed') {
    throw new Error('Can only refund completed payments');
  }
  
  if (refundAmount > this.amount) {
    throw new Error('Refund amount cannot exceed original payment amount');
  }
  
  this.refundInfo = {
    refundAmount,
    refundDate: new Date(),
    refundReason: reason,
    refundMethod: method || this.paymentMethod
  };
  
  this.status = 'refunded';
  return this.save();
};

// Method to mark payment as failed
paymentSchema.methods.markFailed = function(reason) {
  this.status = 'failed';
  this.notes = this.notes ? `${this.notes}\n\nFailed: ${reason}` : `Failed: ${reason}`;
  return this.save();
};

// Method to complete pending payment
paymentSchema.methods.complete = function() {
  if (this.status !== 'pending') {
    throw new Error('Can only complete pending payments');
  }
  
  this.status = 'completed';
  return this.save();
};

// Static method to get payment statistics for a student
paymentSchema.statics.getStudentPaymentStats = async function(studentId, startDate, endDate) {
  const matchQuery = { 
    studentId: new mongoose.Types.ObjectId(studentId),
    status: 'completed'
  };
  
  if (startDate || endDate) {
    matchQuery.paymentDate = {};
    if (startDate) matchQuery.paymentDate.$gte = new Date(startDate);
    if (endDate) matchQuery.paymentDate.$lte = new Date(endDate);
  }
  
  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgPaymentAmount: { $avg: '$amount' },
        lastPaymentDate: { $max: '$paymentDate' },
        firstPaymentDate: { $min: '$paymentDate' },
        paymentMethods: { $addToSet: '$paymentMethod' },
        paymentTypes: { $addToSet: '$paymentType' }
      }
    }
  ]);
  
  return stats[0] || {
    totalPayments: 0,
    totalAmount: 0,
    avgPaymentAmount: 0,
    lastPaymentDate: null,
    firstPaymentDate: null,
    paymentMethods: [],
    paymentTypes: []
  };
};

// Static method to get teacher payment overview
paymentSchema.statics.getTeacherPaymentOverview = async function(teacherId, startDate, endDate) {
  const matchQuery = { 
    teacherId: new mongoose.Types.ObjectId(teacherId),
    status: 'completed'
  };
  
  if (startDate || endDate) {
    matchQuery.paymentDate = {};
    if (startDate) matchQuery.paymentDate.$gte = new Date(startDate);
    if (endDate) matchQuery.paymentDate.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$studentId',
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        lastPaymentDate: { $max: '$paymentDate' },
        avgPaymentAmount: { $avg: '$amount' },
        paymentMethods: { $addToSet: '$paymentMethod' }
      }
    },
    {
      $lookup: {
        from: 'students',
        localField: '_id',
        foreignField: '_id',
        as: 'student'
      }
    },
    {
      $unwind: '$student'
    },
    {
      $sort: { totalAmount: -1 }
    }
  ]);
};

// Static method to get payment analytics
paymentSchema.statics.getPaymentAnalytics = async function(teacherId, period = 'month') {
  const matchQuery = { 
    teacherId: new mongoose.Types.ObjectId(teacherId),
    status: 'completed'
  };
  
  let groupBy;
  switch (period) {
    case 'day':
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } };
      break;
    case 'week':
      groupBy = { $week: '$paymentDate' };
      break;
    case 'month':
      groupBy = { $dateToString: { format: '%Y-%m', date: '$paymentDate' } };
      break;
    case 'year':
      groupBy = { $year: '$paymentDate' };
      break;
    default:
      groupBy = { $dateToString: { format: '%Y-%m', date: '$paymentDate' } };
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: groupBy,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgPaymentAmount: { $avg: '$amount' },
        paymentMethods: { $addToSet: '$paymentMethod' },
        paymentTypes: { $addToSet: '$paymentType' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Static method to get overdue payments
paymentSchema.statics.getOverduePayments = async function(teacherId) {
  const matchQuery = {
    teacherId: new mongoose.Types.ObjectId(teacherId),
    status: 'pending',
    dueDate: { $lt: new Date() }
  };
  
  return this.find(matchQuery)
    .populate('studentId', 'personalInfo.firstName personalInfo.lastName personalInfo.email parentInfo')
    .populate('teacherId', 'profile.firstName profile.lastName email')
    .sort({ dueDate: 1 });
};

// Ensure virtual fields are serialized
paymentSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

// Pre-save middleware to generate receipt number
paymentSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'completed' && !this.receiptNumber) {
    const count = await this.constructor.countDocuments({
      teacherId: this.teacherId,
      status: 'completed'
    });
    
    const date = new Date(this.paymentDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    this.receiptNumber = `RCP-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
