const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher ID is required']
  },
  timeEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeEntry',
    required: [true, 'Time entry ID is required']
  },
  lessonDate: {
    type: Date,
    required: [true, 'Lesson date is required'],
    validate: {
      validator: function(value) {
        // Allow dates up to 1 day in the future for scheduling
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return value <= tomorrow;
      },
      message: 'Lesson date cannot be more than 1 day in the future'
    }
  },
  lessonType: {
    type: String,
    required: [true, 'Lesson type is required'],
    trim: true,
    maxlength: [100, 'Lesson type cannot exceed 100 characters']
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'makeup', 'cancelled'],
    required: [true, 'Attendance status is required']
  },
  duration: {
    type: Number,
    min: [0, 'Duration must be positive'],
    max: [480, 'Duration cannot exceed 8 hours (480 minutes)'],
    validate: {
      validator: function(value) {
        // Duration should be in 15-minute intervals
        return value % 15 === 0;
      },
      message: 'Duration must be in 15-minute intervals'
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  makeupScheduled: {
    type: Date,
    validate: {
      validator: function(value) {
        // Makeup date should be in the future
        if (!value) return true; // Optional field
        return value > new Date();
      },
      message: 'Makeup date must be in the future'
    }
  },
  makeupCompleted: {
    type: Boolean,
    default: false
  },
  makeupCompletedAt: {
    type: Date,
    required: function() {
      return this.makeupCompleted;
    }
  },
  lateMinutes: {
    type: Number,
    min: [0, 'Late minutes must be positive'],
    max: [120, 'Late minutes cannot exceed 2 hours'],
    required: function() {
      return this.status === 'late';
    }
  },
  homework: {
    assigned: {
      type: String,
      trim: true,
      maxlength: [500, 'Homework assignment cannot exceed 500 characters']
    },
    completed: {
      type: Boolean,
      default: false
    },
    completionNotes: {
      type: String,
      trim: true,
      maxlength: [300, 'Completion notes cannot exceed 300 characters']
    }
  },
  parentNotified: {
    type: Boolean,
    default: false
  },
  parentNotifiedAt: {
    type: Date,
    required: function() {
      return this.parentNotified;
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
attendanceSchema.index({ studentId: 1, lessonDate: -1 });
attendanceSchema.index({ teacherId: 1, lessonDate: -1 });
attendanceSchema.index({ timeEntryId: 1 });
attendanceSchema.index({ lessonDate: 1 });
attendanceSchema.index({ status: 1 });

// Compound indexes for common queries
attendanceSchema.index({ teacherId: 1, status: 1, lessonDate: -1 });
attendanceSchema.index({ studentId: 1, status: 1, lessonDate: -1 });

// Virtual for attendance rate calculation
attendanceSchema.virtual('isPresent').get(function() {
  return this.status === 'present';
});

// Virtual for late status check
attendanceSchema.virtual('wasLate').get(function() {
  return this.status === 'late';
});

// Virtual for makeup requirement check
attendanceSchema.virtual('needsMakeup').get(function() {
  return this.status === 'absent' && !this.makeupCompleted;
});

// Method to mark as present
attendanceSchema.methods.markPresent = function(duration, notes) {
  this.status = 'present';
  this.duration = duration;
  this.notes = notes || this.notes;
  this.lateMinutes = undefined;
};

// Method to mark as late
attendanceSchema.methods.markLate = function(lateMinutes, duration, notes) {
  this.status = 'late';
  this.lateMinutes = lateMinutes;
  this.duration = duration;
  this.notes = notes || this.notes;
};

// Method to mark as absent
attendanceSchema.methods.markAbsent = function(notes, scheduleeMakeup) {
  this.status = 'absent';
  this.duration = 0;
  this.notes = notes || this.notes;
  this.lateMinutes = undefined;
  
  if (scheduleeMakeup) {
    this.makeupScheduled = scheduleeMakeup;
  }
};

// Method to complete makeup lesson
attendanceSchema.methods.completeMakeup = function(notes) {
  this.makeupCompleted = true;
  this.makeupCompletedAt = new Date();
  this.notes = notes || this.notes;
};

// Method to notify parent
attendanceSchema.methods.notifyParent = function() {
  this.parentNotified = true;
  this.parentNotifiedAt = new Date();
};

// Static method to get attendance statistics for a student
attendanceSchema.statics.getStudentAttendanceStats = async function(studentId, startDate, endDate) {
  const matchQuery = { studentId: new mongoose.Types.ObjectId(studentId) };
  
  if (startDate || endDate) {
    matchQuery.lessonDate = {};
    if (startDate) matchQuery.lessonDate.$gte = new Date(startDate);
    if (endDate) matchQuery.lessonDate.$lte = new Date(endDate);
  }
  
  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalLessons: { $sum: 1 },
        presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absentCount: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        lateCount: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        makeupCount: { $sum: { $cond: [{ $eq: ['$status', 'makeup'] }, 1, 0] } },
        cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        totalDuration: { $sum: '$duration' },
        avgDuration: { $avg: '$duration' },
        pendingMakeups: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'absent'] }, { $eq: ['$makeupCompleted', false] }] }, 1, 0] } }
      }
    }
  ]);
  
  const result = stats[0] || {
    totalLessons: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    makeupCount: 0,
    cancelledCount: 0,
    totalDuration: 0,
    avgDuration: 0,
    pendingMakeups: 0
  };
  
  // Calculate attendance rate
  result.attendanceRate = result.totalLessons > 0 ? 
    ((result.presentCount + result.lateCount + result.makeupCount) / result.totalLessons * 100).toFixed(2) : 0;
  
  return result;
};

// Static method to get teacher's attendance overview
attendanceSchema.statics.getTeacherAttendanceOverview = async function(teacherId, startDate, endDate) {
  const matchQuery = { teacherId: new mongoose.Types.ObjectId(teacherId) };
  
  if (startDate || endDate) {
    matchQuery.lessonDate = {};
    if (startDate) matchQuery.lessonDate.$gte = new Date(startDate);
    if (endDate) matchQuery.lessonDate.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$studentId',
        totalLessons: { $sum: 1 },
        presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absentCount: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        lateCount: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        pendingMakeups: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'absent'] }, { $eq: ['$makeupCompleted', false] }] }, 1, 0] } }
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
      $addFields: {
        attendanceRate: {
          $multiply: [
            { $divide: [{ $add: ['$presentCount', '$lateCount'] }, '$totalLessons'] },
            100
          ]
        }
      }
    },
    {
      $sort: { attendanceRate: -1 }
    }
  ]);
};

// Static method to get attendance patterns
attendanceSchema.statics.getAttendancePatterns = async function(teacherId, period = 'week') {
  const matchQuery = { teacherId: new mongoose.Types.ObjectId(teacherId) };
  
  let groupBy;
  switch (period) {
    case 'week':
      groupBy = { $week: '$lessonDate' };
      break;
    case 'month':
      groupBy = { $month: '$lessonDate' };
      break;
    case 'day':
      groupBy = { $dayOfWeek: '$lessonDate' };
      break;
    default:
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$lessonDate' } };
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: groupBy,
        totalLessons: { $sum: 1 },
        presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absentCount: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        lateCount: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } }
      }
    },
    {
      $addFields: {
        attendanceRate: {
          $multiply: [
            { $divide: [{ $add: ['$presentCount', '$lateCount'] }, '$totalLessons'] },
            100
          ]
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Ensure virtual fields are serialized
attendanceSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
