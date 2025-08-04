const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    // Check if user account is approved
    if (user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Account not approved. Please contact administrator.'
      });
    }

    // Update last login time
    user.lastLoginAt = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Check user role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Check if user is admin
const isAdmin = authorize('admin');

// Check if user is teacher
const isTeacher = authorize('teacher');

// Check if user is admin or teacher (both roles)
const isAdminOrTeacher = authorize('admin', 'teacher');

// Check if user is accessing their own resource or is admin
const isOwnerOrAdmin = (req, res, next) => {
  const resourceUserId = req.params.id || req.params.userId || req.params.teacherId || req.body.teacherId;
  
  if (req.user.role === 'admin' || req.user._id.toString() === resourceUserId) {
    return next();
  }

  res.status(403).json({
    success: false,
    message: 'Access denied. You can only access your own resources.'
  });
};

// Optional authentication (for routes that work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.status === 'approved') {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't return error, just continue without user
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  isAdmin,
  isTeacher,
  isAdminOrTeacher,
  isOwnerOrAdmin,
  optionalAuth
};
