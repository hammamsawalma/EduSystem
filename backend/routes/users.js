const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { authenticate, isAdmin, isOwnerOrAdmin } = require('../middleware/auth');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus
} = require('../controllers/userController');

// GET /api/users
// Get all users (with optional filters)
router.get('/', authenticate, isAdmin, getUsers);

// GET /api/users/:id
// Get a user by ID
router.get('/:id', authenticate, isOwnerOrAdmin, getUserById);

// POST /api/users
// Create a new user
router.post('/',
  [
    authenticate,
    isAdmin,
    [
      check('firstName', 'First name is required').not().isEmpty(),
      check('lastName', 'Last name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      // Make password optional, as we'll generate one if not provided
      check('password', 'Please enter a password with 6 or more characters').optional().isLength({ min: 6 }),
      check('role', 'Role is required').not().isEmpty(),
      check('subject', 'Subject is required for teachers').if(check('role').equals('teacher')).not().isEmpty()
    ]
  ],
  createUser
);

// PUT /api/users/:id
// Update a user
router.put('/:id',
  [
    authenticate,
    isOwnerOrAdmin,
    [
      check('firstName', 'First name is required').optional(),
      check('lastName', 'Last name is required').optional(),
      check('email', 'Please include a valid email').optional().isEmail(),
      check('password', 'Please enter a password with 6 or more characters').optional().isLength({ min: 6 }),
      check('role', 'Role is required').optional(),
      check('status', 'Status is required').optional(),
      check('subject', 'Subject is required for teachers').optional()
    ]
  ],
  updateUser
);

// DELETE /api/users/:id
// Delete a user
router.delete('/:id', authenticate, isAdmin, deleteUser);

// PATCH /api/users/:id/status
// Update user status
router.patch('/:id/status',
  [
    authenticate,
    isAdmin,
    [
      check('status', 'Status is required').not().isEmpty()
    ]
  ],
  updateUserStatus
);

module.exports = router;
