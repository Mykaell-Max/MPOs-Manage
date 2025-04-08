const express = require('express');
const router = express.Router();
const processController = require('../controller/processInstanceController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware
router.use(authMiddleware.authenticate);

// ====== SPECIFIC ROUTES FIRST ======
// Start a new process
router.post('/start', processController.startProcess);

// Get processes with filtering
router.get('/search', processController.getProcesses);

// Get tasks assigned to current user
router.get('/tasks/my', processController.getMyTasks);

// Get process statistics
router.get('/stats', processController.getProcessStats);

// Bulk actions on processes
router.post('/bulk/:action', authMiddleware.authorize(['Admin', 'ProcessManager']), processController.bulkAction);

// ====== GENERIC ID ROUTES AFTER SPECIFIC ROUTES ======
// Get process by ID
router.get('/:id', processController.getProcessById);

// Get process history
router.get('/:id/history', processController.getProcessHistory);

// Get process timeline
router.get('/:id/timeline', processController.getProcessTimeline);

// Get available actions for a process
router.get('/:id/actions', processController.getAvailableActions);

// Execute action on process
router.post('/:id/actions/:action', processController.executeAction);

// Export process to PDF/CSV
router.get('/:id/export/:format', processController.exportProcess);

// Add comment to process
router.post('/:id/comments', processController.addComment);

// Reassign process
router.post('/:id/reassign', authMiddleware.authorize(['Admin', 'ProcessManager']), processController.reassignProcess);

// Set process priority
router.patch('/:id/priority', processController.setPriority);

// Set process due date
router.patch('/:id/due-date', processController.setDueDate);

module.exports = router;