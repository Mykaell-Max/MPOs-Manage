const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/register', userController.createUser);
router.post('/login', userController.loginUser);

// Protected routes
router.use(authMiddleware.authenticate);

// Get current user profile
router.get('/profile', userController.getUserProfile);

// Update user preferences
router.put('/preferences', userController.updateUserPreferences);

// Admin-only routes
router.use(authMiddleware.authorize(['Admin']));

// Update user
router.put('/:userId', userController.updateUser);

// Delete/deactivate user
router.delete('/:userId', userController.deleteUser);

// Set user substitute
router.post('/:userId/substitute', userController.setUserSubstitute);

module.exports = router;