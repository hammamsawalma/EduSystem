const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  // Assigned teacher (can be reassigned later)
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned teacher is required']
  },
  // First and last name
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
  // Primary phone number
  primaryPhone: {
    type: String,
    required: [true, 'Primary phone number is required'],
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  // Secondary contact (parent, sibling, etc.)
  secondaryContact: {
    name: {
      type: String,
      required: [true, 'Secondary contact name is required'],
      trim: true,
      maxlength: [100, 'Contact name cannot exceed 100 characters']
    },
    relationship: {
      type: String,
      required: [true, 'Relationship is required'],
      enum: ['parent', 'sibling', 'guardian', 'relative', 'other'],
      default: 'parent'
    },
    phone: {
      type: String,
      required: [true, 'Secondary contact phone is required'],
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters']
    }
  },
  // Email
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    unique: true,
    validate: {
      validator: function(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      },
      message: 'Please enter a valid email address'
    }
  },
  // Address
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [300, 'Address cannot exceed 300 characters']
  },
  // National ID (mandatory)
  nationalId: {
    type: String,
    required: [true, 'National ID is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'National ID cannot exceed 50 characters']
  },
  // The level they are enrolled in
  level: {
    type: String,
    required: [true, 'Level is required'],
    trim: true,
    maxlength: [50, 'Level cannot exceed 50 characters']
  },
  // Enrollment and status information
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
  // Optional fields for additional information
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
studentSchema.index({ firstName: 1, lastName: 1 });
studentSchema.index({ enrollmentDate: -1 });
studentSchema.index({ email: 1 }, { unique: true });
studentSchema.index({ nationalId: 1 }, { unique: true });

// Virtual for full name
studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for secondary contact info
studentSchema.virtual('secondaryContactInfo').get(function() {
  if (this.secondaryContact.name) {
    return `${this.secondaryContact.name} (${this.secondaryContact.relationship}) - ${this.secondaryContact.phone}`;
  }
  return 'No secondary contact';
});

// Method to check if student is active
studentSchema.methods.isActive = function() {
  return this.status === 'active';
};

// Static method to get teacher's students
studentSchema.statics.getTeacherStudents = function(teacherId, filters = {}) {
  const query = { teacherId };
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.search) {
    query.$or = [
      { firstName: { $regex: filters.search, $options: 'i' } },
      { lastName: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } },
      { level: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  return this.find(query).sort({ firstName: 1, lastName: 1 });
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
        suspendedStudents: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } }
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
