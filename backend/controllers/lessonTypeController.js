const mongoose = require('mongoose');
const LessonType = require('../models/LessonType');
const { logAuditEntry } = require('../middleware/audit');

// Get all lesson types for a teacher
const getLessonTypes = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'admin') {
      // Admin can see all lesson types or filter by teacherId
      if (req.query.teacherId) {
        query.teacherId = req.query.teacherId;
      }
      // If no teacherId specified, show all lesson types
    } else {
      // Teachers can only see their own lesson types
      query.teacherId = req.user._id;
    }
    
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    const lessonTypes = await LessonType.find(query)
      .populate('teacherId', 'profile.firstName profile.lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        lessonTypes,
        count: lessonTypes.length
      }
    });
  } catch (error) {
    console.error('Get lesson types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lesson types.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single lesson type
const getLessonType = async (req, res) => {
  try {
    const lessonType = await LessonType.findById(req.params.id)
      .populate('teacherId', 'profile.firstName profile.lastName email');

    if (!lessonType) {
      return res.status(404).json({
        success: false,
        message: 'Lesson type not found.'
      });
    }

    // Check if user can access this lesson type
    if (req.user.role !== 'admin' && lessonType.teacherId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own lesson types.'
      });
    }

    res.json({
      success: true,
      data: {
        lessonType
      }
    });
  } catch (error) {
    console.error('Get lesson type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lesson type.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new lesson type
const createLessonType = async (req, res) => {
  try {
    const {
      name,
      description,
      hourlyRate,
      currency
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

    // Create lesson type
    const lessonType = new LessonType({
      teacherId: req.user._id,
      name: name.trim(),
      description: description?.trim(),
      hourlyRate: Number(hourlyRate),
      currency: currency || req.user.settings.currency || 'USD'
    });

    await lessonType.save();

    // Populate teacher info for response
    await lessonType.populate('teacherId', 'profile.firstName profile.lastName email');

    res.status(201).json({
      success: true,
      message: 'Lesson type created successfully.',
      data: {
        lessonType
      }
    });
  } catch (error) {
    console.error('Create lesson type error:', error);
    
    if (error.code === 'DUPLICATE_LESSON_TYPE') {
      return res.status(409).json({
        success: false,
        message: 'A lesson type with this name already exists.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create lesson type.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update lesson type
const updateLessonType = async (req, res) => {
  try {
    const lessonType = await LessonType.findById(req.params.id);

    if (!lessonType) {
      return res.status(404).json({
        success: false,
        message: 'Lesson type not found.'
      });
    }

    // Check if user can update this lesson type
    if (req.user.role !== 'admin' && lessonType.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own lesson types.'
      });
    }

    const {
      name,
      description,
      hourlyRate,
      currency,
      isActive
    } = req.body;

    // Validate hourly rate if provided
    if (hourlyRate !== undefined && hourlyRate <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Hourly rate must be greater than 0.'
      });
    }

    // Store previous values for audit log
    const previousValues = lessonType.toObject();

    // Update fields
    if (name !== undefined) lessonType.name = name.trim();
    if (description !== undefined) lessonType.description = description?.trim();
    if (hourlyRate !== undefined) lessonType.hourlyRate = Number(hourlyRate);
    if (currency !== undefined) lessonType.currency = currency;
    if (isActive !== undefined) lessonType.isActive = isActive;

    await lessonType.save();

    // Populate teacher info for response
    await lessonType.populate('teacherId', 'profile.firstName profile.lastName email');

    res.json({
      success: true,
      message: 'Lesson type updated successfully.',
      data: {
        lessonType
      }
    });
  } catch (error) {
    console.error('Update lesson type error:', error);
    
    if (error.code === 'DUPLICATE_LESSON_TYPE') {
      return res.status(409).json({
        success: false,
        message: 'A lesson type with this name already exists.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update lesson type.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete lesson type
const deleteLessonType = async (req, res) => {
  try {
    const lessonType = await LessonType.findById(req.params.id);

    if (!lessonType) {
      return res.status(404).json({
        success: false,
        message: 'Lesson type not found.'
      });
    }

    // Check if user can delete this lesson type
    if (req.user.role !== 'admin' && lessonType.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own lesson types.'
      });
    }

    // Check if lesson type is being used in time entries
    const TimeEntry = require('../models/TimeEntry');
    const timeEntryCount = await TimeEntry.countDocuments({ lessonTypeId: req.params.id });

    if (timeEntryCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete lesson type. It is being used in time entries.'
      });
    }

    await LessonType.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Lesson type deleted successfully.'
    });
  } catch (error) {
    console.error('Delete lesson type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete lesson type.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get teacher's lesson type statistics
const getLessonTypeStats = async (req, res) => {
  try {
    const teacherId = req.user.role === 'admin' ? req.query.teacherId : req.user._id;

    const stats = await LessonType.aggregate([
      {
        $match: { teacherId: new mongoose.Types.ObjectId(teacherId) }
      },
      {
        $group: {
          _id: null,
          totalLessonTypes: { $sum: 1 },
          activeLessonTypes: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          averageRate: { $avg: '$hourlyRate' },
          minRate: { $min: '$hourlyRate' },
          maxRate: { $max: '$hourlyRate' }
        }
      }
    ]);

    const result = stats[0] || {
      totalLessonTypes: 0,
      activeLessonTypes: 0,
      averageRate: 0,
      minRate: 0,
      maxRate: 0
    };

    res.json({
      success: true,
      data: {
        stats: result
      }
    });
  } catch (error) {
    console.error('Get lesson type stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lesson type statistics.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getLessonTypes,
  getLessonType,
  createLessonType,
  updateLessonType,
  deleteLessonType,
  getLessonTypeStats
};
