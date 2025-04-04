const express = require('express');
const router = express.Router();
const formController = require('../controller/formDefinitionController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware
router.use(authMiddleware.authenticate);

// Create a new form definition
router.post('/', authMiddleware.authorize(['Admin', 'FormDesigner']), formController.createFormDefinition);

// Get all forms
router.get('/', formController.getAllFormDefinitions);

// Validate form data
router.post('/validate', formController.validateFormData);

// ====== SPECIFIC ROUTES FIRST ======
// Get form by name
router.get('/name/:name', formController.getFormDefinitionByName);

// Get form versions
router.get('/versions/:name', formController.getFormVersions);

// ====== GENERIC ID ROUTES AFTER SPECIFIC ROUTES ======
// Get form by ID
router.get('/:id', formController.getFormDefinition);

// Update form (creates new version)
router.put('/:id', authMiddleware.authorize(['Admin', 'FormDesigner']), formController.updateFormDefinition);

// Toggle form active status
router.patch('/:id/status', authMiddleware.authorize(['Admin', 'FormDesigner']), formController.toggleFormStatus);

// Clone a form
router.post('/:id/clone', authMiddleware.authorize(['Admin', 'FormDesigner']), formController.cloneFormDefinition);

// Delete form
router.delete('/:id', authMiddleware.authorize(['Admin']), formController.deleteFormDefinition);

// Associate form with workflow
router.post('/:id/workflows', authMiddleware.authorize(['Admin', 'FormDesigner']), formController.associateWithWorkflow);

// Remove workflow association
router.delete('/:id/workflows/:workflowId', authMiddleware.authorize(['Admin', 'FormDesigner']), formController.removeWorkflowAssociation);

// Get form permissions
router.get('/:id/permissions', formController.getFormPermissions);

module.exports = router;