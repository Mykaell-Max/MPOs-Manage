const express = require('express');
const router = express.Router();
const roleController = require('../controller/roleController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware
router.use(authMiddleware.authenticate);

// Apply admin authorization
router.use(authMiddleware.authorize(['Admin']));

// Create new role
router.post('/', roleController.createRole);

// Get all roles
router.get('/', roleController.getAllRoles);

// Assign role to user
router.post('/assign', roleController.assignRoleToUser);

// Remove role from user
router.post('/remove', roleController.removeRoleFromUser);

module.exports = router;