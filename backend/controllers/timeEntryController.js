const mongoose = require('mongoose');
const TimeEntry = require('../models/TimeEntry');
const LessonType = require('../models/LessonType');
const Student = require('../models/Student');
const { logAuditEntry } = require('../middleware/audit');

// Get all time entries for a teacher
const getTimeEntries = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'admin') {
      // Admin can see all time entries or filter by teacherId
      if (req.query.teacherId) {
        query.teacherId = req.query.teacherId;
      }
      // If no teacherId specified, show all time entries
    } else {
      // Teachers can only see their own time entries
      query.teacherId = req.user._id;
    }
    
    // Add date filtering if provided
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) {
        query.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.date.$lte = new Date(req.query.endDate);
      }
    }

    // Add lesson type filtering if provided
    if (req.query.lessonTypeId) {
      query.lessonTypeId = req.query.lessonTypeId;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const timeEntries = await TimeEntry.find(query)
      .populate('teacherId', 'profile.firstName profile.lastName email')
      .populate('lessonTypeId', 'name description hourlyRate currency')
      .populate('studentId', 'personalInfo.firstName personalInfo.lastName')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await TimeEntry.countDocuments(query);

    res.json({
      success: true,
      data: {
        timeEntries,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get time entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch time entries.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single time entry
const getTimeEntry = async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findById(req.params.id)
      .populate('teacherId', 'profile.firstName profile.lastName email')
      .populate('lessonTypeId', 'name description hourlyRate currency')
      .populate('studentId', 'personalInfo.firstName personalInfo.lastName')
      .populate('editHistory.editedBy', 'profile.firstName profile.lastName');

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found.'
      });
    }

    // Check if user can access this time entry
    if (req.user.role !== 'admin' && timeEntry.teacherId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own time entries.'
      });
    }

    res.json({
      success: true,
      data: {
        timeEntry
      }
    });
  } catch (error) {
    console.error('Get time entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch time entry.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new time entry
const createTimeEntry = async (req, res) => {
  try {
    const {
      lessonTypeId,
      date,
      hoursWorked,
      description,
      studentId
    } = req.body;

    // Validate required fields
    if (!lessonTypeId || !date || !hoursWorked) {
      return res.status(400).json({
        success: false,
        message: 'Lesson type, date, and hours worked are required.'
      });
    }

    // Validate lesson type exists and belongs to teacher
    const lessonType = await LessonType.findById(lessonTypeId);
    if (!lessonType) {
      return res.status(404).json({
        success: false,
        message: 'Lesson type not found.'
      });
    }

    // Check if teacher owns this lesson type (unless admin)
    if (req.user.role !== 'admin' && lessonType.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only create time entries for your own lesson types.'
      });
    }

    // Validate date is not in the future
    const entryDate = new Date(date);
    if (entryDate > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Date cannot be in the future.'
      });
    }

    // Validate hours worked
    if (hoursWorked <= 0 || hoursWorked > 24) {
      return res.status(400).json({
        success: false,
        message: 'Hours worked must be between 0.25 and 24.'
      });
    }

    // Check if it's in 15-minute intervals
    if ((hoursWorked * 4) % 1 !== 0) {
      return res.status(400).json({
        success: false,
        message: 'Hours must be in 15-minute intervals (0.25, 0.5, 0.75, etc.).'
      });
    }

    // Create time entry
    const timeEntry = new TimeEntry({
      teacherId: req.user._id,
      lessonTypeId,
      date: entryDate,
      hoursWorked: Number(hoursWorked),
      hourlyRate: lessonType.hourlyRate,
      totalAmount: Number(hoursWorked) * lessonType.hourlyRate,
      currency: lessonType.currency,
      description: description?.trim(),
      studentId: studentId || null
    });

    await timeEntry.save();

    // Populate for response
    await timeEntry.populate([
      { path: 'teacherId', select: 'profile.firstName profile.lastName email' },
      { path: 'lessonTypeId', select: 'name description hourlyRate currency' },
      { path: 'studentId', select: 'personalInfo.firstName personalInfo.lastName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Time entry created successfully.',
      data: {
        timeEntry
      }
    });
  } catch (error) {
    console.error('Create time entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create time entry.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update time entry
const updateTimeEntry = async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findById(req.params.id);

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found.'
      });
    }

    // Check if user can update this time entry
    if (req.user.role !== 'admin' && timeEntry.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own time entries.'
      });
    }

    // Check if entry can be edited (within 4 hours for teachers)
    if (req.user.role !== 'admin' && !timeEntry.canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Time entry can only be edited within 4 hours of creation.'
      });
    }

    const {
      lessonTypeId,
      date,
      hoursWorked,
      description,
      studentId
    } = req.body;

    // Store previous values for audit log and edit history
    const previousValues = {
      lessonTypeId: timeEntry.lessonTypeId,
      date: timeEntry.date,
      hoursWorked: timeEntry.hoursWorked,
      hourlyRate: timeEntry.hourlyRate,
      totalAmount: timeEntry.totalAmount,
      description: timeEntry.description,
      studentId: timeEntry.studentId
    };

    // Add to edit history
    timeEntry.addEditHistory(req.user._id);

    // Update lesson type if provided
    if (lessonTypeId && lessonTypeId !== timeEntry.lessonTypeId.toString()) {
      const lessonType = await LessonType.findById(lessonTypeId);
      if (!lessonType) {
        return res.status(404).json({
          success: false,
          message: 'Lesson type not found.'
        });
      }

      // Check if teacher owns this lesson type (unless admin)
      if (req.user.role !== 'admin' && lessonType.teacherId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only use your own lesson types.'
        });
      }

      timeEntry.lessonTypeId = lessonTypeId;
      timeEntry.hourlyRate = lessonType.hourlyRate;
      timeEntry.currency = lessonType.currency;
    }

    // Update date if provided
    if (date !== undefined) {
      const entryDate = new Date(date);
      if (entryDate > new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Date cannot be in the future.'
        });
      }
      timeEntry.date = entryDate;
    }

    // Update hours worked if provided
    if (hoursWorked !== undefined) {
      if (hoursWorked <= 0 || hoursWorked > 24) {
        return res.status(400).json({
          success: false,
          message: 'Hours worked must be between 0.25 and 24.'
        });
      }

      // Check if it's in 15-minute intervals
      if ((hoursWorked * 4) % 1 !== 0) {
        return res.status(400).json({
          success: false,
          message: 'Hours must be in 15-minute intervals (0.25, 0.5, 0.75, etc.).'
        });
      }

      timeEntry.hoursWorked = Number(hoursWorked);
    }

    // Update other fields
    if (description !== undefined) timeEntry.description = description?.trim();
    if (studentId !== undefined) timeEntry.studentId = studentId || null;

    await timeEntry.save();

    // Populate for response
    await timeEntry.populate([
      { path: 'teacherId', select: 'profile.firstName profile.lastName email' },
      { path: 'lessonTypeId', select: 'name description hourlyRate currency' },
      { path: 'studentId', select: 'personalInfo.firstName personalInfo.lastName' },
      { path: 'editHistory.editedBy', select: 'profile.firstName profile.lastName' }
    ]);

    res.json({
      success: true,
      message: 'Time entry updated successfully.',
      data: {
        timeEntry
      }
    });
  } catch (error) {
    console.error('Update time entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update time entry.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete time entry
const deleteTimeEntry = async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findById(req.params.id);

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found.'
      });
    }

    // Check if user can delete this time entry
    if (req.user.role !== 'admin' && timeEntry.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own time entries.'
      });
    }

    // Check if entry can be deleted (within 4 hours for teachers)
    if (req.user.role !== 'admin' && !timeEntry.canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Time entry can only be deleted within 4 hours of creation.'
      });
    }

    await TimeEntry.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Time entry deleted successfully.'
    });
  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete time entry.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get earnings summary
const getEarningsSummary = async (req, res) => {
  try {
    const teacherId = req.user.role === 'admin' ? (req.query.teacherId || req.user._id) : req.user._id;

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID is required.'
      });
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const summary = await TimeEntry.getEarningsSummary(teacherId, startDate, endDate);

    // Get detailed breakdown by lesson type
    const breakdownPipeline = [
      {
        $match: {
          teacherId: new mongoose.Types.ObjectId(teacherId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'lessontypes',
          localField: 'lessonTypeId',
          foreignField: '_id',
          as: 'lessonType'
        }
      },
      {
        $unwind: '$lessonType'
      },
      {
        $group: {
          _id: {
            lessonTypeId: '$lessonTypeId',
            name: '$lessonType.name'
          },
          totalHours: { $sum: '$hoursWorked' },
          totalEarnings: { $sum: '$totalAmount' },
          entryCount: { $sum: 1 },
          averageHourlyRate: { $avg: '$hourlyRate' }
        }
      },
      {
        $sort: { totalEarnings: -1 }
      }
    ];

    const breakdown = await TimeEntry.aggregate(breakdownPipeline);

    res.json({
      success: true,
      data: {
        summary: {
          ...summary,
          period: {
            startDate,
            endDate
          }
        },
        breakdown
      }
    });
  } catch (error) {
    console.error('Get earnings summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch earnings summary.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getTimeEntries,
  getTimeEntry,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  getEarningsSummary
};
