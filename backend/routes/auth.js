const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { auditLoggers } = require('../middleware/audit');

// Public routes
router.post('/register', auditLoggers.userRegister, authController.register);
router.post('/login', auditLoggers.userLogin, authController.login);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.post('/logout', auditLoggers.userLogout, authController.logout);
router.get('/profile', authController.getProfile);
router.put('/profile', auditLoggers.userUpdate, authController.updateProfile);
router.put('/change-password', authController.changePassword);
router.post('/refresh-token', authController.refreshToken);

module.exports = router;
