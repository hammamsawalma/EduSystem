const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const Class = require('../models/Class');
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
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { 'secondaryContact.name': searchRegex },
        { level: searchRegex },
        { nationalId: searchRegex }
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
    
    const sortBy = req.query.sortBy || 'firstName';
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
    if (req.user.role !== 'admin') {
      // Teachers can only view students assigned to them
      if (!student.teacherId || student.teacherId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view students assigned to you.'
        });
      }
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

// Create new student (Admin only)
const createStudent = async (req, res) => {
  try {
    // Only admins can create students
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can create students.'
      });
    }

    const {
      firstName,
      lastName,
      primaryPhone,
      secondaryContact,
      email,
      address,
      nationalId,
      level,
      teacherId,
      notes,
      enrollmentDate
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !primaryPhone || !email || !address || !nationalId || !level || !teacherId) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided: firstName, lastName, primaryPhone, email, address, nationalId, level, and teacherId.'
      });
    }

    // Validate secondary contact
    if (!secondaryContact || !secondaryContact.name || !secondaryContact.phone || !secondaryContact.relationship) {
      return res.status(400).json({
        success: false,
        message: 'Secondary contact information is required (name, phone, relationship).'
      });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.'
      });
    }

    // Validate teacher exists
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher assignment.'
      });
    }

    // Check for duplicate email globally
    const existingEmailStudent = await Student.findOne({ email: email.toLowerCase() });
    if (existingEmailStudent) {
      return res.status(409).json({
        success: false,
        message: 'A student with this email already exists.'
      });
    }

    // Check for duplicate national ID globally
    const existingNationalIdStudent = await Student.findOne({ nationalId: nationalId.trim() });
    if (existingNationalIdStudent) {
      return res.status(409).json({
        success: false,
        message: 'A student with this national ID already exists.'
      });
    }

    // Create student
    const student = new Student({
      teacherId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      primaryPhone: primaryPhone.trim(),
      secondaryContact: {
        name: secondaryContact.name.trim(),
        relationship: secondaryContact.relationship,
        phone: secondaryContact.phone.trim()
      },
      email: email.toLowerCase().trim(),
      address: address.trim(),
      nationalId: nationalId.trim(),
      level: level.trim(),
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

// Update student (Admin only)
const updateStudent = async (req, res) => {
  try {
    // Only admins can update students
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can update students.'
      });
    }

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    const {
      firstName,
      lastName,
      primaryPhone,
      secondaryContact,
      email,
      address,
      nationalId,
      level,
      teacherId,
      notes,
      status,
      enrollmentDate
    } = req.body;

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.'
      });
    }

    // Validate teacher exists if provided
    if (teacherId) {
      const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
      if (!teacher) {
        return res.status(400).json({
          success: false,
          message: 'Invalid teacher assignment.'
        });
      }
    }

    // Check for duplicate email globally (excluding current student)
    if (email) {
      const existingStudent = await Student.findOne({
        _id: { $ne: student._id },
        email: email.toLowerCase()
      });
      
      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message: 'A student with this email already exists.'
        });
      }
    }

    // Check for duplicate national ID globally (excluding current student)
    if (nationalId) {
      const existingStudent = await Student.findOne({
        _id: { $ne: student._id },
        nationalId: nationalId.trim()
      });
      
      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message: 'A student with this national ID already exists.'
        });
      }
    }

    // Update fields if provided
    if (firstName !== undefined) student.firstName = firstName.trim();
    if (lastName !== undefined) student.lastName = lastName.trim();
    if (primaryPhone !== undefined) student.primaryPhone = primaryPhone.trim();
    if (email !== undefined) student.email = email.toLowerCase().trim();
    if (address !== undefined) student.address = address.trim();
    if (nationalId !== undefined) student.nationalId = nationalId.trim();
    if (level !== undefined) student.level = level.trim();
    if (teacherId !== undefined) student.teacherId = teacherId;
    if (notes !== undefined) student.notes = notes?.trim();
    if (status !== undefined) student.status = status;
    if (enrollmentDate !== undefined) student.enrollmentDate = new Date(enrollmentDate);

    // Update secondary contact if provided
    if (secondaryContact) {
      if (secondaryContact.name !== undefined) student.secondaryContact.name = secondaryContact.name.trim();
      if (secondaryContact.relationship !== undefined) student.secondaryContact.relationship = secondaryContact.relationship;
      if (secondaryContact.phone !== undefined) student.secondaryContact.phone = secondaryContact.phone.trim();
    }

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

// Delete student (Admin only)
const deleteStudent = async (req, res) => {
  try {
    // Only admins can delete students
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can delete students.'
      });
    }

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
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

// Assign student to class
const assignStudentToClass = async (req, res) => {
  try {
    const { studentId, classId } = req.body;

    if (!studentId || !classId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and Class ID are required.'
      });
    }

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    // Find the class and verify it belongs to the teacher
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.'
      });
    }

    // Check if user can assign students to this class
    if (req.user.role !== 'admin' && classItem.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only assign students to your own classes.'
      });
    }

    // Check if student is already assigned to this class
    const existingAssignment = student.assignedClasses.find(
      assignment => assignment.classId.toString() === classId
    );

    if (existingAssignment) {
      return res.status(409).json({
        success: false,
        message: 'Student is already assigned to this class.'
      });
    }

    // Add class assignment
    student.assignedClasses.push({
      classId: classId,
      assignedAt: new Date(),
      assignedBy: req.user._id
    });

    await student.save();

    // Populate for response
    await student.populate('assignedClasses.classId', 'name teacherId hourlyRate currency');
    await student.populate('teacherId', 'profile.firstName profile.lastName email');

    res.json({
      success: true,
      message: 'Student assigned to class successfully.',
      data: {
        student
      }
    });
  } catch (error) {
    console.error('Assign student to class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign student to class.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Remove student from class
const removeStudentFromClass = async (req, res) => {
  try {
    const { studentId, classId } = req.body;

    if (!studentId || !classId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and Class ID are required.'
      });
    }

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    // Find the class and verify it belongs to the teacher
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.'
      });
    }

    // Check if user can remove students from this class
    if (req.user.role !== 'admin' && classItem.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only remove students from your own classes.'
      });
    }

    // Remove class assignment
    student.assignedClasses = student.assignedClasses.filter(
      assignment => assignment.classId.toString() !== classId
    );

    await student.save();

    // Populate for response
    await student.populate('assignedClasses.classId', 'name teacherId hourlyRate currency');
    await student.populate('teacherId', 'profile.firstName profile.lastName email');

    res.json({
      success: true,
      message: 'Student removed from class successfully.',
      data: {
        student
      }
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
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStats,
  bulkUpdateStudents,
  assignStudentToClass,
  removeStudentFromClass
};
