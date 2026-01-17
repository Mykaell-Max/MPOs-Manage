const express = require('express');
const router = express.Router();
const roleController = require('../controller/roleController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware
router.use(authMiddleware.authenticate);

// Apply admin authorization
router.use(authMiddleware.authorize(['Admin']));

// Create new role
router.post('/', (req, res, next) => {
	/*
		#swagger.tags = ['Role']
		#swagger.description = 'Cria uma nova role'
	*/
	return roleController.createRole(req, res, next);
});

// Get all roles
router.get('/', (req, res, next) => {
	/*
		#swagger.tags = ['Role']
		#swagger.description = 'Retorna todas as roles'
	*/
	return roleController.getAllRoles(req, res, next);
});

// Assign role to user
router.post('/assign', (req, res, next) => {
	/*
		#swagger.tags = ['Role']
		#swagger.description = 'Associa role ao usuário'
	*/
	return roleController.assignRoleToUser(req, res, next);
});

// Remove role from user
router.post('/remove', (req, res, next) => {
	/*
		#swagger.tags = ['Role']
		#swagger.description = 'Remove role do usuário'
	*/
	return roleController.removeRoleFromUser(req, res, next);
});

module.exports = router;