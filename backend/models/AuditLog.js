const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true,
    maxlength: [200, 'Action description cannot exceed 200 characters']
  },
  targetType: {
    type: String,
    required: true,
    enum: ['user', 'timeentry', 'lessontype', 'expense', 'student', 'attendance', 'payment', 'system'],
    index: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function() {
      return this.targetType !== 'system';
    }
  },
  previousValues: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
    maxlength: [500, 'User agent cannot exceed 500 characters']
  },
  details: {
    type: String,
    trim: true,
    maxlength: [1000, 'Details cannot exceed 1000 characters']
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Indexes for performance
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1 });

// Static method to create audit log entry
auditLogSchema.statics.createLog = async function(logData) {
  try {
    const auditLog = new this({
      userId: logData.userId,
      action: logData.action,
      targetType: logData.targetType,
      targetId: logData.targetId,
      previousValues: logData.previousValues || {},
      newValues: logData.newValues || {},
      ipAddress: logData.ipAddress,
      userAgent: logData.userAgent,
      details: logData.details
    });

    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error to prevent audit logging from breaking main operations
    return null;
  }
};

// Static method to get audit logs with filters
auditLogSchema.statics.getAuditLogs = async function(filters = {}, options = {}) {
  const {
    userId,
    targetType,
    targetId,
    action,
    startDate,
    endDate,
    page = 1,
    limit = 50
  } = filters;

  const query = {};

  if (userId) query.userId = userId;
  if (targetType) query.targetType = targetType;
  if (targetId) query.targetId = targetId;
  if (action) query.action = new RegExp(action, 'i');

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const logs = await this.find(query)
    .populate('userId', 'profile.firstName profile.lastName email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await this.countDocuments(query);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.createdAt.toISOString();
});

// Method to get summary of changes
auditLogSchema.methods.getChangesSummary = function() {
  const changes = [];
  const prev = this.previousValues || {};
  const current = this.newValues || {};

  // Get all unique keys from both objects
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(current)]);

  for (const key of allKeys) {
    if (prev[key] !== current[key]) {
      changes.push({
        field: key,
        from: prev[key],
        to: current[key]
      });
    }
  }

  return changes;
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
