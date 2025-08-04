const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const { logAuditEntry } = require('../middleware/audit');

// Get all students for a teacher
const getStudents = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'admin') {
      // Admin can see all students or filter by teacherId
      if (req.query.teacherId) {
        query.teacherId = req.query.teacherId;
      }
      // If no teacherId specified, show all students
    } else {
      // Teachers can only see their own students
      query.teacherId = req.user._id;
    }
    
    // Add status filtering if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Add search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { 'personalInfo.firstName': searchRegex },
        { 'personalInfo.lastName': searchRegex },
        { 'personalInfo.email': searchRegex },
        { 'parentInfo.parentName': searchRegex },
        { 'parentInfo.parentEmail': searchRegex }
      ];
    }
    
    // Add enrollment date filtering if provided
    if (req.query.enrolledAfter || req.query.enrolledBefore) {
      query.enrollmentDate = {};
      if (req.query.enrolledAfter) {
        query.enrollmentDate.$gte = new Date(req.query.enrolledAfter);
      }
      if (req.query.enrolledBefore) {
        query.enrollmentDate.$lte = new Date(req.query.enrolledBefore);
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const sortBy = req.query.sortBy || 'personalInfo.firstName';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const students = await Student.find(query)
      .populate('teacherId', 'profile.firstName profile.lastName email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single student
const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('teacherId', 'profile.firstName profile.lastName email');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    // Check if user can access this student
    if (req.user.role !== 'admin' && student.teacherId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own students.'
      });
    }

    res.json({
      success: true,
      data: {
        student
      }
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new student
const createStudent = async (req, res) => {
  try {
    const {
      personalInfo,
      parentInfo,
      academicInfo,
      paymentInfo,
      notes,
      enrollmentDate
    } = req.body;

    // Validate required fields
    if (!personalInfo || !personalInfo.firstName || !personalInfo.lastName) {
      return res.status(400).json({
        success: false,
        message: 'First name and last name are required.'
      });
    }

    // Validate email format if provided
    if (personalInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.'
      });
    }

    // Validate parent email format if provided
    if (parentInfo?.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentInfo.parentEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid parent email address.'
      });
    }

    // Check for duplicate email within teacher's students
    if (personalInfo.email) {
      const existingStudent = await Student.findOne({
        teacherId: req.user._id,
        'personalInfo.email': personalInfo.email.toLowerCase()
      });
      
      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message: 'A student with this email already exists.'
        });
      }
    }

    // Create student
    const student = new Student({
      teacherId: req.user._id,
      personalInfo: {
        firstName: personalInfo.firstName.trim(),
        lastName: personalInfo.lastName.trim(),
        email: personalInfo.email?.toLowerCase().trim(),
        phone: personalInfo.phone?.trim(),
        dateOfBirth: personalInfo.dateOfBirth ? new Date(personalInfo.dateOfBirth) : undefined,
        address: personalInfo.address?.trim()
      },
      parentInfo: parentInfo ? {
        parentName: parentInfo.parentName?.trim(),
        parentEmail: parentInfo.parentEmail?.toLowerCase().trim(),
        parentPhone: parentInfo.parentPhone?.trim(),
        emergencyContact: parentInfo.emergencyContact?.trim()
      } : {},
      academicInfo: academicInfo ? {
        grade: academicInfo.grade?.trim(),
        subjects: academicInfo.subjects || [],
        learningPreferences: academicInfo.learningPreferences?.trim(),
        specialNeeds: academicInfo.specialNeeds?.trim()
      } : {},
      paymentInfo: paymentInfo ? {
        paymentMethod: paymentInfo.paymentMethod || 'cash',
        billingAddress: paymentInfo.billingAddress?.trim(),
        paymentSchedule: paymentInfo.paymentSchedule || 'per_session',
        currentBalance: paymentInfo.currentBalance || 0,
        totalPaid: paymentInfo.totalPaid || 0
      } : {},
      notes: notes?.trim(),
      enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : new Date()
    });

    await student.save();

    // Populate for response
    await student.populate('teacherId', 'profile.firstName profile.lastName email');

    res.status(201).json({
      success: true,
      message: 'Student created successfully.',
      data: {
        student
      }
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create student.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    // Check if user can update this student
    if (req.user.role !== 'admin' && student.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own students.'
      });
    }

    const {
      personalInfo,
      parentInfo,
      academicInfo,
      paymentInfo,
      notes,
      status,
      enrollmentDate
    } = req.body;

    // Validate email format if provided
    if (personalInfo?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.'
      });
    }

    // Validate parent email format if provided
    if (parentInfo?.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentInfo.parentEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid parent email address.'
      });
    }

    // Check for duplicate email within teacher's students (excluding current student)
    if (personalInfo?.email) {
      const existingStudent = await Student.findOne({
        _id: { $ne: student._id },
        teacherId: req.user._id,
        'personalInfo.email': personalInfo.email.toLowerCase()
      });
      
      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message: 'A student with this email already exists.'
        });
      }
    }

    // Update personal info
    if (personalInfo) {
      if (personalInfo.firstName) student.personalInfo.firstName = personalInfo.firstName.trim();
      if (personalInfo.lastName) student.personalInfo.lastName = personalInfo.lastName.trim();
      if (personalInfo.email !== undefined) student.personalInfo.email = personalInfo.email ? personalInfo.email.toLowerCase().trim() : undefined;
      if (personalInfo.phone !== undefined) student.personalInfo.phone = personalInfo.phone?.trim();
      if (personalInfo.dateOfBirth !== undefined) student.personalInfo.dateOfBirth = personalInfo.dateOfBirth ? new Date(personalInfo.dateOfBirth) : undefined;
      if (personalInfo.address !== undefined) student.personalInfo.address = personalInfo.address?.trim();
    }

    // Update parent info
    if (parentInfo) {
      if (parentInfo.parentName !== undefined) student.parentInfo.parentName = parentInfo.parentName?.trim();
      if (parentInfo.parentEmail !== undefined) student.parentInfo.parentEmail = parentInfo.parentEmail ? parentInfo.parentEmail.toLowerCase().trim() : undefined;
      if (parentInfo.parentPhone !== undefined) student.parentInfo.parentPhone = parentInfo.parentPhone?.trim();
      if (parentInfo.emergencyContact !== undefined) student.parentInfo.emergencyContact = parentInfo.emergencyContact?.trim();
    }

    // Update academic info
    if (academicInfo) {
      if (academicInfo.grade !== undefined) student.academicInfo.grade = academicInfo.grade?.trim();
      if (academicInfo.subjects !== undefined) student.academicInfo.subjects = academicInfo.subjects || [];
      if (academicInfo.learningPreferences !== undefined) student.academicInfo.learningPreferences = academicInfo.learningPreferences?.trim();
      if (academicInfo.specialNeeds !== undefined) student.academicInfo.specialNeeds = academicInfo.specialNeeds?.trim();
    }

    // Update payment info
    if (paymentInfo) {
      if (paymentInfo.paymentMethod !== undefined) student.paymentInfo.paymentMethod = paymentInfo.paymentMethod;
      if (paymentInfo.billingAddress !== undefined) student.paymentInfo.billingAddress = paymentInfo.billingAddress?.trim();
      if (paymentInfo.paymentSchedule !== undefined) student.paymentInfo.paymentSchedule = paymentInfo.paymentSchedule;
      if (paymentInfo.currentBalance !== undefined) student.paymentInfo.currentBalance = paymentInfo.currentBalance;
      if (paymentInfo.totalPaid !== undefined) student.paymentInfo.totalPaid = paymentInfo.totalPaid;
    }

    // Update other fields
    if (notes !== undefined) student.notes = notes?.trim();
    if (status !== undefined) student.status = status;
    if (enrollmentDate !== undefined) student.enrollmentDate = new Date(enrollmentDate);

    await student.save();

    // Populate for response
    await student.populate('teacherId', 'profile.firstName profile.lastName email');

    res.json({
      success: true,
      message: 'Student updated successfully.',
      data: {
        student
      }
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    // Check if user can delete this student
    if (req.user.role !== 'admin' && student.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own students.'
      });
    }

    await Student.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Student deleted successfully.'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get student statistics
const getStudentStats = async (req, res) => {
  try {
    const teacherId = req.user.role === 'admin' ? (req.query.teacherId || req.user._id) : req.user._id;

    const stats = await Student.getStudentStats(teacherId);

    res.json({
      success: true,
      data: {
        stats: stats[0] || {
          totalStudents: 0,
          activeStudents: 0,
          inactiveStudents: 0,
          suspendedStudents: 0,
          totalBalance: 0,
          totalPaid: 0
        }
      }
    });
  } catch (error) {
    console.error('Get student stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student statistics.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Bulk update students
const bulkUpdateStudents = async (req, res) => {
  try {
    const { studentIds, updates } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student IDs array is required.'
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates object is required.'
      });
    }

    // Verify all students belong to the teacher (unless admin)
    if (req.user.role !== 'admin') {
      const studentCount = await Student.countDocuments({
        _id: { $in: studentIds },
        teacherId: req.user._id
      });

      if (studentCount !== studentIds.length) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only update your own students.'
        });
      }
    }

    const result = await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: updates },
      { runValidators: true }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} student(s) updated successfully.`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update students.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStats,
  bulkUpdateStudents
};
