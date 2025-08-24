const express = require('express');
const { 
  getDashboardStats, 
  getRecentActivities, 
  getPendingActions,
  getTeacherDashboardStats
} = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authenticate, getDashboardStats);

// GET /api/dashboard/teacher-stats
router.get('/teacher-stats', authenticate, getTeacherDashboardStats);

// GET /api/dashboard/activities
router.get('/activities', authenticate, getRecentActivities);

// GET /api/dashboard/pending-actions
router.get('/pending-actions', authenticate, getPendingActions);

module.exports = router;
