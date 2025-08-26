const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher ID is required']
  },
  lessonTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LessonType',
    required: [true, 'Lesson type is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    validate: {
      validator: function(value) {
        // Prevent future dates
        return value <= new Date();
      },
      message: 'Date cannot be in the future'
    }
  },
  hoursWorked: {
    type: Number,
    required: [true, 'Hours worked is required'],
    min: [0.25, 'Minimum hours is 0.25 (15 minutes)'],
    max: [24, 'Maximum hours per day is 24'],
    validate: {
      validator: function(value) {
        // Check if it's a multiple of 0.25 (15-minute intervals)
        return (value * 4) % 1 === 0;
      },
      message: 'Hours must be in 15-minute intervals (0.25, 0.5, 0.75, etc.)'
    }
  },
  hourlyRate: {
    type: Number,
    required: [true, 'Hourly rate is required'],
    min: [0, 'Hourly rate must be positive']
  },
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'DZD',
    uppercase: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  editHistory: [{
    previousHours: {
      type: Number,
      required: true
    },
    previousAmount: {
      type: Number,
      required: true
    },
    editedAt: {
      type: Date,
      default: Date.now
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Indexes for performance
timeEntrySchema.index({ teacherId: 1, date: -1 });
timeEntrySchema.index({ teacherId: 1, createdAt: -1 });
timeEntrySchema.index({ date: 1 });

// Calculate total amount before saving
timeEntrySchema.pre('save', function(next) {
  this.totalAmount = this.hoursWorked * this.hourlyRate;
  next();
});

// Virtual to check if entry can be edited (within 4 hours of creation)
timeEntrySchema.virtual('canEdit').get(function() {
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
  return this.createdAt > fourHoursAgo;
});

// Virtual for formatted amount
timeEntrySchema.virtual('formattedAmount').get(function() {
  return `${this.currency} ${this.totalAmount.toFixed(2)}`;
});

// Method to add edit history when updating
timeEntrySchema.methods.addEditHistory = function(editedBy) {
  this.editHistory.push({
    previousHours: this.hoursWorked,
    previousAmount: this.totalAmount,
    editedBy: editedBy
  });
};

// Static method to get earnings summary for a teacher
timeEntrySchema.statics.getEarningsSummary = async function(teacherId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        teacherId: new mongoose.Types.ObjectId(teacherId),
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalHours: { $sum: '$hoursWorked' },
        totalEarnings: { $sum: '$totalAmount' },
        entryCount: { $sum: 1 }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || { totalHours: 0, totalEarnings: 0, entryCount: 0 };
};

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
