const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher ID is required']
  },
  personalInfo: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(value) {
          if (!value) return true; // Optional field
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: 'Please enter a valid email address'
      }
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function(value) {
          if (!value) return true; // Optional field
          return value <= new Date();
        },
        message: 'Date of birth cannot be in the future'
      }
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    }
  },
  parentInfo: {
    parentName: {
      type: String,
      trim: true,
      maxlength: [100, 'Parent name cannot exceed 100 characters']
    },
    parentEmail: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(value) {
          if (!value) return true; // Optional field
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: 'Please enter a valid parent email address'
      }
    },
    parentPhone: {
      type: String,
      trim: true,
      maxlength: [20, 'Parent phone number cannot exceed 20 characters']
    },
    emergencyContact: {
      type: String,
      trim: true,
      maxlength: [100, 'Emergency contact cannot exceed 100 characters']
    }
  },
  academicInfo: {
    grade: {
      type: String,
      trim: true,
      maxlength: [20, 'Grade cannot exceed 20 characters']
    },
    subjects: [{
      type: String,
      trim: true,
      maxlength: [50, 'Subject cannot exceed 50 characters']
    }],
    learningPreferences: {
      type: String,
      trim: true,
      maxlength: [500, 'Learning preferences cannot exceed 500 characters']
    },
    specialNeeds: {
      type: String,
      trim: true,
      maxlength: [500, 'Special needs cannot exceed 500 characters']
    }
  },
  enrollmentDate: {
    type: Date,
    required: [true, 'Enrollment date is required'],
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  paymentInfo: {
    paymentMethod: {
      type: String,
      enum: ['cash', 'check', 'bank_transfer', 'online'],
      default: 'cash'
    },
    billingAddress: {
      type: String,
      trim: true,
      maxlength: [200, 'Billing address cannot exceed 200 characters']
    },
    paymentSchedule: {
      type: String,
      enum: ['weekly', 'monthly', 'per_session'],
      default: 'per_session'
    },
    currentBalance: {
      type: Number,
      default: 0,
      min: [0, 'Current balance cannot be negative']
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: [0, 'Total paid cannot be negative']
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Indexes for performance
studentSchema.index({ teacherId: 1, status: 1 });
studentSchema.index({ 'personalInfo.firstName': 1, 'personalInfo.lastName': 1 });
studentSchema.index({ enrollmentDate: -1 });
studentSchema.index({ 'personalInfo.email': 1 });

// Virtual for full name
studentSchema.virtual('fullName').get(function() {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Virtual for parent full contact
studentSchema.virtual('parentContact').get(function() {
  if (this.parentInfo.parentName) {
    return `${this.parentInfo.parentName} (${this.parentInfo.parentPhone || this.parentInfo.parentEmail || 'No contact'})`;
  }
  return 'No parent information';
});

// Method to check if student is active
studentSchema.methods.isActive = function() {
  return this.status === 'active';
};

// Method to update balance
studentSchema.methods.updateBalance = function(amount) {
  this.paymentInfo.currentBalance = Math.max(0, this.paymentInfo.currentBalance + amount);
  if (amount > 0) {
    this.paymentInfo.totalPaid += amount;
  }
};

// Static method to get teacher's students
studentSchema.statics.getTeacherStudents = function(teacherId, filters = {}) {
  const query = { teacherId };
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.search) {
    query.$or = [
      { 'personalInfo.firstName': { $regex: filters.search, $options: 'i' } },
      { 'personalInfo.lastName': { $regex: filters.search, $options: 'i' } },
      { 'personalInfo.email': { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  return this.find(query).sort({ 'personalInfo.firstName': 1, 'personalInfo.lastName': 1 });
};

// Static method to get student statistics
studentSchema.statics.getStudentStats = function(teacherId) {
  return this.aggregate([
    { $match: { teacherId: new mongoose.Types.ObjectId(teacherId) } },
    {
      $group: {
        _id: null,
        totalStudents: { $sum: 1 },
        activeStudents: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        inactiveStudents: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
        suspendedStudents: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } },
        totalBalance: { $sum: '$paymentInfo.currentBalance' },
        totalPaid: { $sum: '$paymentInfo.totalPaid' }
      }
    }
  ]);
};

// Ensure virtual fields are serialized
studentSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Student', studentSchema);
