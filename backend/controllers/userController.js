const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

/**
 * Get all users (with optional role filter)
 * @route GET /api/users
 * @access Private (Admin)
 */
exports.getUsers = async (req, res) => {
  try {
    const { role, search, status } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by role if provided
    if (role) {
      query.role = role;
    }
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query and exclude password
    const users = await User.find(query).select('-password');
    
    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Get a user by ID
 * @route GET /api/users/:id
 * @access Private (Admin, Owner)
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Create a user (teacher or admin)
 * @route POST /api/users
 * @access Private (Admin)
 */
exports.createUser = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
    role,
    subject,
    status
  } = req.body;
  
  try {
    console.log('Creating user with data:', JSON.stringify(req.body, null, 2));
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }
    
    // Map frontend status to backend status
    let backendStatus = 'pending';
    if (status) {
      if (status === 'Active' || status === 'active') {
        backendStatus = 'approved';
      } else if (status === 'Blocked' || status === 'blocked') {
        backendStatus = 'suspended';
      } else if (status === 'Pending' || status === 'pending') {
        backendStatus = 'pending';
      }
    }
    
    // Generate a temporary password if not provided
    const userPassword = password || `temp${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Create new user with proper schema structure
    user = new User({
      email,
      password: userPassword,
      role,
      status: backendStatus,
      profile: {
        firstName,
        lastName,
        phone
      }
    });
    
    // Add subject for teachers
    if (role === 'teacher' && subject) {
      user.teacherProfile = {
        subject
      };
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(userPassword, salt);
    
    // Save user
    await user.save();
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    // Transform the response to match frontend expectations
    const transformedResponse = {
      ...userResponse,
      id: userResponse._id,
      firstName: userResponse.profile.firstName,
      lastName: userResponse.profile.lastName,
      phone: userResponse.profile.phone,
      status: backendStatus === 'approved' ? 'Active' : 
              backendStatus === 'suspended' ? 'Blocked' : 'Pending'
    };
    
    return res.status(201).json({
      success: true,
      data: transformedResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Update a user
 * @route PUT /api/users/:id
 * @access Private (Admin, Owner)
 */
exports.updateUser = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      subject,
      status
    } = req.body;
    
    console.log('Updating user with data:', JSON.stringify(req.body, null, 2));
    
    // Find user
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Build user object
    const userFields = {};
    
    // Map profile fields
    if (firstName || lastName || phone) {
      userFields.profile = { ...user.profile };
      if (firstName) userFields.profile.firstName = firstName;
      if (lastName) userFields.profile.lastName = lastName;
      if (phone) userFields.profile.phone = phone;
    }
    
    if (email) userFields.email = email;
    if (role) userFields.role = role;
    
    // Map frontend status to backend status
    if (status) {
      if (status === 'Active' || status === 'active') {
        userFields.status = 'approved';
      } else if (status === 'Blocked' || status === 'blocked') {
        userFields.status = 'suspended';
      } else if (status === 'Pending' || status === 'pending') {
        userFields.status = 'pending';
      } else {
        userFields.status = status;
      }
    }
    
    // Hash password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      userFields.password = await bcrypt.hash(password, salt);
    }
    
    // Update teacher profile if applicable
    if (role === 'teacher' && subject) {
      userFields.teacherProfile = {
        ...user.teacherProfile,
        subject
      };
    }
    
    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true }
    ).select('-password');
    
    // Transform the response to match frontend expectations
    const transformedResponse = {
      ...user.toObject(),
      id: user._id,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      phone: user.profile.phone,
      status: user.status === 'approved' ? 'Active' : 
              user.status === 'suspended' ? 'Blocked' : 'Pending'
    };
    
    return res.status(200).json({
      success: true,
      data: transformedResponse
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Delete a user
 * @route DELETE /api/users/:id
 * @access Private (Admin)
 */
exports.deleteUser = async (req, res) => {
  try {
    // Find user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Delete user
    await User.findByIdAndDelete(req.params.id);
    
    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Update user status
 * @route PATCH /api/users/:id/status
 * @access Private (Admin)
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    console.log('Updating user status:', status);
    
    // Map frontend status to backend status
    let backendStatus;
    if (status === 'Active' || status === 'active') {
      backendStatus = 'approved';
    } else if (status === 'Blocked' || status === 'blocked') {
      backendStatus = 'suspended';
    } else if (status === 'Pending' || status === 'pending') {
      backendStatus = 'pending';
    } else {
      backendStatus = status;
    }
    
    // Find user
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update status
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { status: backendStatus } },
      { new: true }
    ).select('-password');
    
    // Transform the response to match frontend expectations
    const transformedResponse = {
      ...user.toObject(),
      id: user._id,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      phone: user.profile.phone,
      status: user.status === 'approved' ? 'Active' : 
              user.status === 'suspended' ? 'Blocked' : 'Pending'
    };
    
    return res.status(200).json({
      success: true,
      data: transformedResponse
    });
  } catch (error) {
    console.error('Update user status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
