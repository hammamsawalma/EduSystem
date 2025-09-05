const mongoose = require('mongoose');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const { logAuditEntry } = require('../middleware/audit');

// Get all classes for a teacher
const getClasses = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'admin') {
      // Admin can see all classes or filter by teacherId
      if (req.query.teacherId) {
        query.teacherId = req.query.teacherId;
      }
      // If no teacherId specified, show all classes
    } else {
      // Teachers can only see their own classes
      query.teacherId = req.user._id;
    }

    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    const classes = await Class.find(query)
      .populate('teacherId', 'profile.firstName profile.lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        classes,
        count: classes.length
      }
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch classes.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single class
const getClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id)
      .populate('teacherId', 'profile.firstName profile.lastName email');

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.'
      });
    }

    // Check if user can access this class
    if (req.user.role !== 'admin' && classItem.teacherId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own classes.'
      });
    }

    res.json({
      success: true,
      data: {
        class: classItem
      }
    });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new class
const createClass = async (req, res) => {
  try {
    const {
      name,
      description,
      hourlyRate,
      currency,
      teacherId,
      isActive,
      price
    } = req.body;

    // Validate required fields
    if (!name || !hourlyRate) {
      return res.status(400).json({
        success: false,
        message: 'Name and hourly rate are required.'
      });
    }

    // Validate hourly rate
    if (hourlyRate <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Hourly rate must be greater than 0.'
      });
    }

    // Validate price (only admins can set price)
    let finalPrice = 0;
    if (price !== undefined) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can set class price.'
        });
      }
      if (price < 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be non-negative.'
        });
      }
      finalPrice = Number(price);
    }

    // Determine the teacher ID (admin can specify, teacher uses their own)
    const finalTeacherId = req.user.role === 'admin' ? teacherId : req.user._id;

    if (!finalTeacherId) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID is required.'
      });
    }

    // Create class
    const classItem = new Class({
      teacherId: finalTeacherId,
      name: name.trim(),
      description: description?.trim(),
      hourlyRate: Number(hourlyRate),
      currency: currency || 'DZD',
      price: finalPrice,
      isActive: isActive !== undefined ? isActive : true
    });

    await classItem.save();

    // Populate teacher info for response
    await classItem.populate('teacherId', 'profile.firstName profile.lastName email');

    res.status(201).json({
      success: true,
      message: 'Class created successfully.',
      data: {
        class: classItem
      }
    });
  } catch (error) {
    console.error('Create class error:', error);

    if (error.code === 'DUPLICATE_CLASS') {
      return res.status(409).json({
        success: false,
        message: 'A class with this name already exists.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create class.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update class
const updateClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.'
      });
    }

    // Check if user can update this class
    if (req.user.role !== 'admin' && classItem.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own classes.'
      });
    }

    const {
      name,
      description,
      hourlyRate,
      currency,
      isActive,
      price
    } = req.body;

    // Validate hourly rate if provided
    if (hourlyRate !== undefined && hourlyRate <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Hourly rate must be greater than 0.'
      });
    }

    // Validate and handle price update (admin only)
    if (price !== undefined) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can update class price.'
        });
      }
      if (price < 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be non-negative.'
        });
      }
    }

    // Update fields
    if (name !== undefined) classItem.name = name.trim();
    if (description !== undefined) classItem.description = description?.trim();
    if (hourlyRate !== undefined) classItem.hourlyRate = Number(hourlyRate);
    if (currency !== undefined) classItem.currency = currency;
    if (isActive !== undefined) classItem.isActive = isActive;
    if (price !== undefined) classItem.price = Number(price);

    await classItem.save();

    // Populate teacher info for response
    await classItem.populate('teacherId', 'profile.firstName profile.lastName email');

    res.json({
      success: true,
      message: 'Class updated successfully.',
      data: {
        class: classItem
      }
    });
  } catch (error) {
    console.error('Update class error:', error);

    if (error.code === 'DUPLICATE_CLASS') {
      return res.status(409).json({
        success: false,
        message: 'A class with this name already exists.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update class.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete class
const deleteClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.'
      });
    }

    // Check if user can delete this class
    if (req.user.role !== 'admin' && classItem.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own classes.'
      });
    }

    // Check if class is being used in time entries
    const TimeEntry = require('../models/TimeEntry');
    const timeEntryCount = await TimeEntry.countDocuments({ lessonTypeId: req.params.id });

    if (timeEntryCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete class. It is being used in time entries.'
      });
    }

    // Check if class has assigned students
    const studentCount = await Student.countDocuments({ 'assignedClasses.classId': req.params.id });

    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete class. Students are assigned to this class.'
      });
    }

    await Class.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Class deleted successfully.'
    });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete class.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Assign students to a class (admin only)
const assignStudentsToClass = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can assign students to classes.'
      });
    }

    const { classId, studentIds } = req.body;

    if (!classId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'classId and studentIds are required.'
      });
    }

    // Verify the class exists
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.'
      });
    }

    // Assign each student
    const result = await Student.updateMany(
      { _id: { $in: studentIds } },
      {
        $addToSet: {
          assignedClasses: {
            classId,
            assignedAt: new Date(),
            assignedBy: req.user._id
          }
        }
      }
    );

    res.json({
      success: true,
      message: 'Students assigned to class successfully.',
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      }
    });
  } catch (error) {
    console.error('Assign students to class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign students to class.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get students assigned to a teacher's class
const getClassStudents = async (req, res) => {
  try {
    const classId = req.params.id;
    const classItem = await Class.findById(classId);

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.'
      });
    }

    // Only admin or the teacher who owns the class can view
    if (req.user.role !== 'admin' && classItem.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    const students = await Student.find({ 'assignedClasses.classId': classId })
      .populate('teacherId', 'profile.firstName profile.lastName email')
      .sort({ firstName: 1, lastName: 1 });

    res.json({
      success: true,
      data: {
        students,
        count: students.length
      }
    });
  } catch (error) {
    console.error('Get class students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students for class.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get class students with their attendance information
const getClassStudentsAttendance = async (req, res) => {
  try {
    const classId = req.params.id;
    const { startDate, endDate, status } = req.query;

    // Find the class
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.'
      });
    }

    // Only admin or the teacher who owns the class can view
    if (req.user.role !== 'admin' && classItem.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view attendance for your own classes.'
      });
    }

    // Get students assigned to this class
    const students = await Student.find({ 'assignedClasses.classId': classId })
      .populate('teacherId', 'profile.firstName profile.lastName email')
      .sort({ firstName: 1, lastName: 1 })
      .lean();

    // Build date filter for attendance
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    // Build attendance query
    const attendanceQuery = {
      studentId: { $in: students.map(s => s._id) },
      teacherId: classItem.teacherId
    };

    if (Object.keys(dateFilter).length > 0) {
      attendanceQuery.lessonDate = dateFilter;
    }

    if (status && status !== 'all') {
      attendanceQuery.status = status;
    }

    // Get attendance records for all students in the class
    const attendanceRecords = await Attendance.find(attendanceQuery)
      .populate('timeEntryId', 'lessonTypeId hoursWorked totalAmount date')
      .sort({ lessonDate: -1 })
      .lean();

    // Group attendance by student
    const attendanceByStudent = {};
    attendanceRecords.forEach(record => {
      const studentId = record.studentId.toString();
      if (!attendanceByStudent[studentId]) {
        attendanceByStudent[studentId] = [];
      }
      attendanceByStudent[studentId].push(record);
    });

    // Calculate attendance statistics for each student
    const studentsWithAttendance = students.map(student => {
      const studentId = student._id.toString();
      const studentAttendance = attendanceByStudent[studentId] || [];
      
      // Calculate statistics
      const totalSessions = studentAttendance.length;
      const presentSessions = studentAttendance.filter(a => a.status === 'present').length;
      const absentSessions = studentAttendance.filter(a => a.status === 'absent').length;
      const lateSessions = studentAttendance.filter(a => a.status === 'late').length;
      const makeupSessions = studentAttendance.filter(a => a.status === 'makeup').length;
      const cancelledSessions = studentAttendance.filter(a => a.status === 'cancelled').length;
      
      const attendanceRate = totalSessions > 0 ? ((presentSessions + lateSessions) / totalSessions * 100) : 0;

      return {
        ...student,
        attendance: {
          records: studentAttendance,
          statistics: {
            totalSessions,
            presentSessions,
            absentSessions,
            lateSessions,
            makeupSessions,
            cancelledSessions,
            attendanceRate: Math.round(attendanceRate * 100) / 100
          }
        }
      };
    });

    // Calculate class-wide statistics
    const classStats = {
      totalStudents: students.length,
      totalSessions: attendanceRecords.length,
      averageAttendanceRate: studentsWithAttendance.length > 0 
        ? studentsWithAttendance.reduce((sum, student) => sum + student.attendance.statistics.attendanceRate, 0) / studentsWithAttendance.length
        : 0
    };

    res.json({
      success: true,
      data: {
        class: {
          _id: classItem._id,
          name: classItem.name,
          description: classItem.description,
          teacherId: classItem.teacherId
        },
        students: studentsWithAttendance,
        classStatistics: {
          ...classStats,
          averageAttendanceRate: Math.round(classStats.averageAttendanceRate * 100) / 100
        },
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          status: status || 'all'
        }
      }
    });
  } catch (error) {
    console.error('Get class students attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class students attendance.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Remove student from class (admin only)
const removeStudentFromClass = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can remove students from classes.'
      });
    }

    const { classId, studentId } = req.params;

    // Verify the class exists
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.'
      });
    }

    // Remove the student from the class
    const result = await Student.updateOne(
      { _id: studentId },
      {
        $pull: {
          assignedClasses: { classId: classId }
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    res.json({
      success: true,
      message: 'Student removed from class successfully.'
    });
  } catch (error) {
    console.error('Remove student from class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove student from class.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  assignStudentsToClass,
  getClassStudents,
  getClassStudentsAttendance,
  removeStudentFromClass
};
