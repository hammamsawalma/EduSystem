const mongoose = require('mongoose');

const teacherPaymentSchema = new mongoose.Schema({
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
    index: true
  },
  paymentType: {
    type: String,
    required: [true, 'Payment type is required'],
    enum: ['salary', 'hourly_payment', 'bonus', 'commission', 'reimbursement', 'advance', 'other'],
    default: 'hourly_payment'
  },
  hoursWorked: {
    type: Number,
    min: [0, 'Hours worked must be positive'],
    validate: {
      validator: function(value) {
        // Only required for hourly payments
        if (this.paymentType === 'hourly_payment') {
          return value != null && value > 0;
        }
        return true;
      },
      message: 'Hours worked is required for hourly payments'
    }
  },
  hourlyRate: {
    type: Number,
    min: [0, 'Hourly rate must be positive'],
    validate: {
      validator: function(value) {
        // Only required for hourly payments
        if (this.paymentType === 'hourly_payment') {
          return value != null && value > 0;
        }
        return true;
      },
      message: 'Hourly rate is required for hourly payments'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  reference: {
    type: String,
    trim: true,
    maxlength: [100, 'Reference cannot exceed 100 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'cancelled'],
    default: 'pending',
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.status === 'approved' || this.status === 'paid';
    }
  },
  approvedAt: {
    type: Date,
    required: function() {
      return this.status === 'approved' || this.status === 'paid';
    }
  },
  paidAt: {
    type: Date,
    required: function() {
      return this.status === 'paid';
    }
  },
  receiptNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Receipt number cannot exceed 50 characters'],
    unique: true,
    sparse: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Submitted by is required']
  }
}, {
  timestamps: true
});

// Indexes for performance
teacherPaymentSchema.index({ teacherId: 1, paymentDate: -1 });
teacherPaymentSchema.index({ teacherId: 1, status: 1 });
teacherPaymentSchema.index({ status: 1, paymentDate: -1 });

// Virtual for formatted amount
teacherPaymentSchema.virtual('formattedAmount').get(function() {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

// Virtual to check if payment is overdue (for pending/approved payments)
teacherPaymentSchema.virtual('isOverdue').get(function() {
  if (this.status === 'paid' || this.status === 'cancelled') {
    return false;
  }
  // Consider payment overdue if it's 30 days past the payment date
  const overdueDate = new Date(this.paymentDate);
  overdueDate.setDate(overdueDate.getDate() + 30);
  return new Date() > overdueDate;
});

// Pre-save middleware to generate receipt number for paid payments
teacherPaymentSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'paid' && !this.receiptNumber) {
    const count = await this.constructor.countDocuments({
      status: 'paid',
      paymentDate: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
      }
    });
    
    const date = new Date(this.paymentDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    this.receiptNumber = `TPY-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Auto-calculate amount for hourly payments
  if (this.paymentType === 'hourly_payment' && this.hoursWorked && this.hourlyRate) {
    this.amount = this.hoursWorked * this.hourlyRate;
  }
  
  next();
});

// Static method to get teacher payment summary
teacherPaymentSchema.statics.getTeacherPaymentSummary = async function(teacherId, startDate, endDate) {
  const matchQuery = {
    teacherId: new mongoose.Types.ObjectId(teacherId)
  };
  
  if (startDate || endDate) {
    matchQuery.paymentDate = {};
    if (startDate) matchQuery.paymentDate.$gte = new Date(startDate);
    if (endDate) matchQuery.paymentDate.$lte = new Date(endDate);
  }
  
  const pipeline = [
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ];
  
  const results = await this.aggregate(pipeline);
  
  const summary = {
    totalPaid: 0,
    totalPending: 0,
    totalApproved: 0,
    totalCancelled: 0,
    countPaid: 0,
    countPending: 0,
    countApproved: 0,
    countCancelled: 0
  };
  
  results.forEach(result => {
    switch (result._id) {
      case 'paid':
        summary.totalPaid = result.totalAmount;
        summary.countPaid = result.count;
        break;
      case 'pending':
        summary.totalPending = result.totalAmount;
        summary.countPending = result.count;
        break;
      case 'approved':
        summary.totalApproved = result.totalAmount;
        summary.countApproved = result.count;
        break;
      case 'cancelled':
        summary.totalCancelled = result.totalAmount;
        summary.countCancelled = result.count;
        break;
    }
  });
  
  return summary;
};

// Static method to get all teachers payment summary
teacherPaymentSchema.statics.getAllTeachersPaymentSummary = async function(startDate, endDate) {
  const matchQuery = {};
  
  if (startDate || endDate) {
    matchQuery.paymentDate = {};
    if (startDate) matchQuery.paymentDate.$gte = new Date(startDate);
    if (endDate) matchQuery.paymentDate.$lte = new Date(endDate);
  }
  
  const pipeline = [
    { $match: matchQuery },
    {
      $lookup: {
        from: 'users',
        localField: 'teacherId',
        foreignField: '_id',
        as: 'teacher'
      }
    },
    { $unwind: '$teacher' },
    {
      $group: {
        _id: {
          teacherId: '$teacherId',
          teacherName: { $concat: ['$teacher.profile.firstName', ' ', '$teacher.profile.lastName'] },
          teacherEmail: '$teacher.email'
        },
        totalPaid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
        totalPending: { $sum: { $cond: [{ $in: ['$status', ['pending', 'approved']] }, '$amount', 0] } },
        totalPayments: { $sum: '$amount' },
        paymentCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.teacherName': 1 } }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to get overdue teacher payments
teacherPaymentSchema.statics.getOverduePayments = async function() {
  const overdueDate = new Date();
  overdueDate.setDate(overdueDate.getDate() - 30);
  
  return this.find({
    status: { $in: ['pending', 'approved'] },
    'paymentDate': { $lt: overdueDate }
  })
  .populate('teacherId', 'profile.firstName profile.lastName email')
  .populate('submittedBy', 'profile.firstName profile.lastName')
  .sort({ 'paymentDate': 1 });
};

// Ensure virtual fields are serialized
teacherPaymentSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('TeacherPayment', teacherPaymentSchema);
