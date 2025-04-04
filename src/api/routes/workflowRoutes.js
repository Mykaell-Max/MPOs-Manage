const express = require('express');
const router = express.Router();
const workflowController = require('../controller/workflowController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// Create a new workflow
router.post('/', authMiddleware.authorize(['Admin']), workflowController.createWorkflow);

// ====== SPECIFIC ROUTES FIRST ======
// Get all workflows (with optional filters via query parameters) 
router.get('/', workflowController.getAllWorkflows);

// Get workflow versions
router.get('/versions/:name', workflowController.getWorkflowVersions);

// Search workflows
router.get('/search', workflowController.searchWorkflows);

// Get workflow statistics
router.get('/stats', workflowController.getWorkflowStats);

// ====== GENERIC ID ROUTES AFTER SPECIFIC ROUTES ======
// Get workflow by ID 
router.get('/:id', workflowController.getWorkflowById);

// Get workflow states
router.get('/:id/states', workflowController.getWorkflowStates);

// Get workflow diagram data
router.get('/:id/diagram', workflowController.getWorkflowDiagram);

// Start a process from workflow
router.post('/:id/start', workflowController.startProcess);

// Clone workflow
router.post('/:id/clone', authMiddleware.authorize(['Admin', 'ProcessManager']), workflowController.cloneWorkflow);

// Update workflow (creates new version)
router.put('/:id', authMiddleware.authorize(['Admin', 'ProcessManager']), workflowController.updateWorkflow);

// Toggle workflow active status
router.patch('/:id/status', authMiddleware.authorize(['Admin', 'ProcessManager']), workflowController.toggleWorkflowStatus);

// Delete workflow
router.delete('/:id', authMiddleware.authorize(['Admin']), workflowController.deleteWorkflow);

// Associate form with workflow
router.post('/:id/form', authMiddleware.authorize(['Admin', 'ProcessManager']), workflowController.associateForm);

// Get state details
router.get('/:workflowId/states/:stateName', workflowController.getStateDetails);

module.exports = router;