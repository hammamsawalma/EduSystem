const mongoose = require('mongoose');

const lessonTypeSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher ID is required']
  },
  name: {
    type: String,
    required: [true, 'Lesson type name is required'],
    trim: true,
    maxlength: [100, 'Lesson type name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  hourlyRate: {
    type: Number,
    required: [true, 'Hourly rate is required'],
    min: [0, 'Hourly rate must be positive'],
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value >= 0;
      },
      message: 'Hourly rate must be a valid positive number'
    }
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    validate: {
      validator: function(value) {
        // Basic currency code validation (3 letters)
        return /^[A-Z]{3}$/.test(value);
      },
      message: 'Currency must be a valid 3-letter currency code'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
lessonTypeSchema.index({ teacherId: 1, isActive: 1 });
lessonTypeSchema.index({ teacherId: 1, name: 1 }, { unique: true });

// Ensure a teacher cannot have duplicate lesson type names
lessonTypeSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('name')) {
    const existingLessonType = await this.constructor.findOne({
      teacherId: this.teacherId,
      name: { $regex: new RegExp(`^${this.name}$`, 'i') },
      _id: { $ne: this._id }
    });

    if (existingLessonType) {
      const error = new Error('Lesson type name already exists for this teacher');
      error.code = 'DUPLICATE_LESSON_TYPE';
      return next(error);
    }
  }
  next();
});

// Virtual for formatted rate
lessonTypeSchema.virtual('formattedRate').get(function() {
  return `${this.currency} ${this.hourlyRate.toFixed(2)}`;
});

module.exports = mongoose.model('LessonType', lessonTypeSchema);
