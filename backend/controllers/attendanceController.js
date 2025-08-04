const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const TimeEntry = require('../models/TimeEntry');
const User = require('../models/User');
const { logAuditEntry } = require('../middleware/audit');

// Get all attendance records
const getAttendanceRecords = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'admin') {
      // Admin can see all attendance records or filter by teacherId
      if (req.query.teacherId) {
        query.teacherId = req.query.teacherId;
      }
    } else {
      // Teachers can only see their own attendance records
      query.teacherId = req.user._id;
    }
    
    // Add studentId filtering if provided
    if (req.query.studentId) {
      query.studentId = req.query.studentId;
    }
    
    // Add status filtering if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Add date filtering if provided
    if (req.query.startDate || req.query.endDate) {
      query.lessonDate = {};
      if (req.query.startDate) {
        query.lessonDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.lessonDate.$lte = new Date(req.query.endDate);
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const sortBy = req.query.sortBy || 'lessonDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const attendanceRecords = await Attendance.find(query)
      .populate('studentId', 'personalInfo.firstName personalInfo.lastName personalInfo.email')
      .populate('teacherId', 'profile.firstName profile.lastName email')
      .populate('timeEntryId', 'lessonTypeId hoursWorked totalAmount')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Attendance.countDocuments(query);

    res.json({
      success: true,
      data: {
        attendanceRecords,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get attendance records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single attendance record
const getAttendanceRecord = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('studentId', 'personalInfo.firstName personalInfo.lastName personalInfo.email parentInfo')
      .populate('teacherId', 'profile.firstName profile.lastName email')
      .populate('timeEntryId', 'lessonTypeId hoursWorked totalAmount date');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.'
      });
    }

    // Check if user can access this attendance record
    if (req.user.role !== 'admin' && attendance.teacherId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own attendance records.'
      });
    }

    res.json({
      success: true,
      data: {
        attendance
      }
    });
  } catch (error) {
    console.error('Get attendance record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance record.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new attendance record
const createAttendanceRecord = async (req, res) => {
  try {
    const {
      studentId,
      timeEntryId,
      lessonDate,
      lessonType,
      status,
      duration,
      notes,
      lateMinutes,
      makeupScheduled,
      homework
    } = req.body;

    // Validate required fields
    if (!studentId || !timeEntryId || !lessonDate || !lessonType || !status) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, Time Entry ID, lesson date, lesson type, and status are required.'
      });
    }

    // Validate student exists and belongs to teacher
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    if (req.user.role !== 'admin' && student.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only create attendance records for your own students.'
      });
    }

    // Validate time entry exists and belongs to teacher
    const timeEntry = await TimeEntry.findById(timeEntryId);
    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found.'
      });
    }

    if (req.user.role !== 'admin' && timeEntry.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only create attendance records for your own time entries.'
      });
    }

    // Validate lesson date
    const lessonDateObj = new Date(lessonDate);
    if (isNaN(lessonDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lesson date format.'
      });
    }

    // Validate status-specific fields
    if (status === 'late' && (!lateMinutes || lateMinutes < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Late minutes are required for late attendance.'
      });
    }

    // Check for duplicate attendance record
    const existingAttendance = await Attendance.findOne({
      studentId,
      timeEntryId,
      lessonDate: lessonDateObj
    });

    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        message: 'Attendance record already exists for this student, lesson, and date.'
      });
    }

    // Create attendance record
    const attendance = new Attendance({
      studentId,
      teacherId: req.user._id,
      timeEntryId,
      lessonDate: lessonDateObj,
      lessonType: lessonType.trim(),
      status,
      duration: duration || 0,
      notes: notes?.trim(),
      lateMinutes: status === 'late' ? lateMinutes : undefined,
      makeupScheduled: makeupScheduled ? new Date(makeupScheduled) : undefined,
      homework: homework || {}
    });

    await attendance.save();

    // Populate for response
    await attendance.populate([
      { path: 'studentId', select: 'personalInfo.firstName personalInfo.lastName personalInfo.email' },
      { path: 'teacherId', select: 'profile.firstName profile.lastName email' },
      { path: 'timeEntryId', select: 'lessonTypeId hoursWorked totalAmount date' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Attendance record created successfully.',
      data: {
        attendance
      }
    });
  } catch (error) {
    console.error('Create attendance record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create attendance record.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update attendance record
const updateAttendanceRecord = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.'
      });
    }

    // Check if user can update this attendance record
    if (req.user.role !== 'admin' && attendance.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own attendance records.'
      });
    }

    const {
      status,
      duration,
      notes,
      lateMinutes,
      makeupScheduled,
      makeupCompleted,
      homework,
      parentNotified
    } = req.body;

    // Update status if provided
    if (status !== undefined) {
      attendance.status = status;
      
      // Clear late minutes if not late
      if (status !== 'late') {
        attendance.lateMinutes = undefined;
      }
    }

    // Update duration if provided
    if (duration !== undefined) {
      attendance.duration = duration;
    }

    // Update notes if provided
    if (notes !== undefined) {
      attendance.notes = notes?.trim();
    }

    // Update late minutes if provided and status is late
    if (lateMinutes !== undefined && attendance.status === 'late') {
      attendance.lateMinutes = lateMinutes;
    }

    // Update makeup scheduled if provided
    if (makeupScheduled !== undefined) {
      attendance.makeupScheduled = makeupScheduled ? new Date(makeupScheduled) : undefined;
    }

    // Update makeup completed if provided
    if (makeupCompleted !== undefined) {
      attendance.makeupCompleted = makeupCompleted;
      if (makeupCompleted) {
        attendance.makeupCompletedAt = new Date();
      }
    }

    // Update homework if provided
    if (homework !== undefined) {
      attendance.homework = { ...attendance.homework, ...homework };
    }

    // Update parent notified if provided
    if (parentNotified !== undefined) {
      attendance.parentNotified = parentNotified;
      if (parentNotified) {
        attendance.parentNotifiedAt = new Date();
      }
    }

    await attendance.save();

    // Populate for response
    await attendance.populate([
      { path: 'studentId', select: 'personalInfo.firstName personalInfo.lastName personalInfo.email' },
      { path: 'teacherId', select: 'profile.firstName profile.lastName email' },
      { path: 'timeEntryId', select: 'lessonTypeId hoursWorked totalAmount date' }
    ]);

    res.json({
      success: true,
      message: 'Attendance record updated successfully.',
      data: {
        attendance
      }
    });
  } catch (error) {
    console.error('Update attendance record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance record.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete attendance record
const deleteAttendanceRecord = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.'
      });
    }

    // Check if user can delete this attendance record
    if (req.user.role !== 'admin' && attendance.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own attendance records.'
      });
    }

    await Attendance.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Attendance record deleted successfully.'
    });
  } catch (error) {
    console.error('Delete attendance record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance record.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get student attendance statistics
const getStudentAttendanceStats = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    
    // Validate student exists and user has access
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    if (req.user.role !== 'admin' && student.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own students\' attendance.'
      });
    }

    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const stats = await Attendance.getStudentAttendanceStats(studentId, startDate, endDate);

    res.json({
      success: true,
      data: {
        studentId,
        stats,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || 'All time'
        }
      }
    });
  } catch (error) {
    console.error('Get student attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student attendance statistics.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get teacher attendance overview
const getTeacherAttendanceOverview = async (req, res) => {
  try {
    const teacherId = req.user.role === 'admin' ? (req.query.teacherId || req.user._id) : req.user._id;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const overview = await Attendance.getTeacherAttendanceOverview(teacherId, startDate, endDate);

    res.json({
      success: true,
      data: {
        teacherId,
        overview,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || 'All time'
        }
      }
    });
  } catch (error) {
    console.error('Get teacher attendance overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher attendance overview.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get attendance patterns
const getAttendancePatterns = async (req, res) => {
  try {
    const teacherId = req.user.role === 'admin' ? (req.query.teacherId || req.user._id) : req.user._id;
    const period = req.query.period || 'week';

    const patterns = await Attendance.getAttendancePatterns(teacherId, period);

    res.json({
      success: true,
      data: {
        teacherId,
        patterns,
        period
      }
    });
  } catch (error) {
    console.error('Get attendance patterns error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance patterns.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get pending makeups
const getPendingMakeups = async (req, res) => {
  try {
    let query = {
      status: 'absent',
      makeupCompleted: false
    };
    
    if (req.user.role === 'admin') {
      if (req.query.teacherId) {
        query.teacherId = req.query.teacherId;
      }
    } else {
      query.teacherId = req.user._id;
    }

    const pendingMakeups = await Attendance.find(query)
      .populate('studentId', 'personalInfo.firstName personalInfo.lastName personalInfo.email parentInfo')
      .populate('teacherId', 'profile.firstName profile.lastName email')
      .populate('timeEntryId', 'lessonTypeId hoursWorked totalAmount date')
      .sort({ lessonDate: -1 });

    res.json({
      success: true,
      data: {
        pendingMakeups,
        count: pendingMakeups.length
      }
    });
  } catch (error) {
    console.error('Get pending makeups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending makeups.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAttendanceRecords,
  getAttendanceRecord,
  createAttendanceRecord,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  getStudentAttendanceStats,
  getTeacherAttendanceOverview,
  getAttendancePatterns,
  getPendingMakeups
};
