const AuditLog = require('../models/AuditLog');

// Middleware to log actions
const auditLogger = (action, targetType) => {
  return async (req, res, next) => {
    // Store original send method
    const originalSend = res.send;
    
    // Override send method to capture response
    res.send = function(data) {
      // Only log if the request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Don't await this to avoid blocking response
        logAuditEntry(req, action, targetType, data);
      }
      
      // Call original send method
      originalSend.call(this, data);
    };

    next();
  };
};

// Function to create audit log entry
const logAuditEntry = async (req, action, targetType, responseData) => {
  try {
    // For actions that don't require authentication (like registration)
    // we still want to log them but without a userId
    const logData = {
      userId: req.user ? req.user._id : null,
      action: action,
      targetType: targetType,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      details: `${req.method} ${req.originalUrl}`
    };

    // Extract target ID from request or response
    if (req.params.id) {
      logData.targetId = req.params.id;
    } else if (req.params.userId) {
      logData.targetId = req.params.userId;
    } else if (req.params.teacherId) {
      logData.targetId = req.params.teacherId;
    } else if (req.params.studentId) {
      logData.targetId = req.params.studentId;
    } else if (responseData && typeof responseData === 'string') {
      try {
        const parsed = JSON.parse(responseData);
        if (parsed.data && parsed.data.user && parsed.data.user.id) {
          logData.targetId = parsed.data.user.id;
        } else if (parsed.data && parsed.data.timeEntry && parsed.data.timeEntry._id) {
          logData.targetId = parsed.data.timeEntry._id;
        } else if (parsed.data && parsed.data.student && parsed.data.student._id) {
          logData.targetId = parsed.data.student._id;
        } else if (parsed.data && parsed.data.expense && parsed.data.expense._id) {
          logData.targetId = parsed.data.expense._id;
        } else if (parsed.data && parsed.data._id) {
          logData.targetId = parsed.data._id;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // Store request body as new values for create/update operations
    if (req.method === 'POST' || req.method === 'PUT') {
      logData.newValues = req.body;
    }

    // Store previous values for update operations
    if (req.method === 'PUT' && req.previousValues) {
      logData.previousValues = req.previousValues;
    }

    await AuditLog.createLog(logData);
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error to prevent audit logging from breaking main operations
  }
};

// Middleware to capture previous values for update operations
const capturePreviousValues = (model) => {
  return async (req, res, next) => {
    if (req.method === 'PUT' && req.params.id) {
      try {
        const Model = require(`../models/${model}`);
        const previousRecord = await Model.findById(req.params.id);
        if (previousRecord) {
          req.previousValues = previousRecord.toObject();
        }
      } catch (error) {
        console.error('Error capturing previous values:', error);
      }
    }
    next();
  };
};

// Specific audit loggers for different actions
const auditLoggers = {
  // User actions
  userLogin: auditLogger('User login', 'user'),
  userLogout: auditLogger('User logout', 'user'),
  userRegister: auditLogger('User registration', 'user'),
  userUpdate: auditLogger('User profile updated', 'user'),
  userApprove: auditLogger('User account approved', 'user'),
  userSuspend: auditLogger('User account suspended', 'user'),
  userDelete: auditLogger('User account deleted', 'user'),

  // Time entry actions
  timeEntryCreate: auditLogger('Time entry created', 'timeentry'),
  timeEntryUpdate: auditLogger('Time entry updated', 'timeentry'),
  timeEntryDelete: auditLogger('Time entry deleted', 'timeentry'),

  // Class actions
  classCreate: auditLogger('Class created', 'class'),
  classUpdate: auditLogger('Class updated', 'class'),
  classDelete: auditLogger('Class deleted', 'class'),
  classAssignStudents: auditLogger('Students assigned to class', 'class'),
  classRemoveStudent: auditLogger('Student removed from class', 'class'),

  // Student actions
  studentCreate: auditLogger('Student created', 'student'),
  studentUpdate: auditLogger('Student updated', 'student'),
  studentDelete: auditLogger('Student deleted', 'student'),
  studentBulkUpdate: auditLogger('Students bulk updated', 'student'),

  // Attendance actions
  attendanceCreate: auditLogger('Attendance record created', 'attendance'),
  attendanceUpdate: auditLogger('Attendance record updated', 'attendance'),
  attendanceDelete: auditLogger('Attendance record deleted', 'attendance'),

  // Expense actions
  expenseCreate: auditLogger('Expense created', 'expense'),
  expenseUpdate: auditLogger('Expense updated', 'expense'),
  expenseApprove: auditLogger('Expense approved', 'expense'),
  expenseReject: auditLogger('Expense rejected', 'expense'),
  expenseDelete: auditLogger('Expense deleted', 'expense'),

  // Payment actions
  paymentCreate: auditLogger('Payment recorded', 'payment'),
  paymentUpdate: auditLogger('Payment updated', 'payment'),
  paymentDelete: auditLogger('Payment deleted', 'payment'),
  paymentRefund: auditLogger('Payment refunded', 'payment'),
  paymentApprove: auditLogger('Payment approved', 'payment'),
  paymentReject: auditLogger('Payment rejected', 'payment'),
  paymentBulkCreate: auditLogger('Bulk payments created', 'payment'),

  // System actions
  systemLogin: auditLogger('System login', 'system'),
  systemLogout: auditLogger('System logout', 'system'),
  systemError: auditLogger('System error', 'system')
};

module.exports = {
  auditLogger,
  capturePreviousValues,
  logAuditEntry,
  auditLoggers
};
