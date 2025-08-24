const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { logAuditEntry } = require('../middleware/audit');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Register new user (teacher)
const register = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      address,
      dateOfBirth,
      emergencyContact,
      subject
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, last name, and subject are required.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists.'
      });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      role: 'teacher',
      subject,
      profile: {
        firstName,
        lastName,
        phone,
        address,
        dateOfBirth,
        emergencyContact
      },
      status: 'pending'
    });

    await user.save();


    res.status(201).json({
      success: true,
      message: 'Registration successful. Please wait for admin approval.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          subject: user.subject,
          status: user.status
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check if account is approved
    if (user.status !== 'approved') {
      let message = 'Account not approved. Please contact administrator.';
      if (user.status === 'suspended') {
        message = 'Account is suspended. Please contact administrator.';
      }
      return res.status(403).json({
        success: false,
        message
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);


    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          settings: user.settings,
          lastLoginAt: user.lastLoginAt
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    // Create audit log
    await logAuditEntry(
      { user: req.user, ip: req.ip, get: () => req.get('User-Agent'), method: 'POST', originalUrl: req.originalUrl },
      'User logout',
      'user'
    );

    res.json({
      success: true,
      message: 'Logout successful.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          settings: user.settings,
          status: user.status,
          expenseApprovalRequired: user.expenseApprovalRequired,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      address,
      dateOfBirth,
      emergencyContact,
      settings
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Store previous values for audit log
    const previousValues = user.toObject();

    // Update profile fields
    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (phone !== undefined) user.profile.phone = phone;
    if (address !== undefined) user.profile.address = address;
    if (dateOfBirth !== undefined) user.profile.dateOfBirth = dateOfBirth;
    if (emergencyContact !== undefined) user.profile.emergencyContact = emergencyContact;

    // Update settings if provided
    if (settings) {
      if (settings.notifications) {
        user.settings.notifications = { ...user.settings.notifications, ...settings.notifications };
      }
      if (settings.theme) user.settings.theme = settings.theme;
      if (settings.currency) user.settings.currency = settings.currency;
      if (settings.timezone) user.settings.timezone = settings.timezone;
    }

    await user.save();

    // Create audit log
    await logAuditEntry(
      { user: req.user, ip: req.ip, get: () => req.get('User-Agent'), method: 'PUT', originalUrl: req.originalUrl, previousValues },
      'User profile updated',
      'user'
    );

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          settings: user.settings,
          status: user.status,
          expenseApprovalRequired: user.expenseApprovalRequired,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Create audit log
    await logAuditEntry(
      { user: req.user, ip: req.ip, get: () => req.get('User-Agent'), method: 'PUT', originalUrl: req.originalUrl },
      'Password changed',
      'user'
    );

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Generate new token
    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        token
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken
};
