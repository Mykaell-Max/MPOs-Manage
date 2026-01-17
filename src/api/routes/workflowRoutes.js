const express = require('express');
const router = express.Router();
const workflowController = require('../controller/workflowController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// Create a new workflow
router.post('/', authMiddleware.authorize(['Admin']), (req, res, next) => {
	/*
		#swagger.tags = ['Workflow']
		#swagger.description = 'Cria um novo workflow'
	*/
	return workflowController.createWorkflow(req, res, next);
});

// ====== SPECIFIC ROUTES FIRST ======
// Get all workflows (with optional filters via query parameters) 
router.get('/', (req, res, next) => {
	/*
		#swagger.tags = ['Workflow']
		#swagger.description = 'Retorna todos os workflows (com filtros)'
	*/
	return workflowController.getAllWorkflows(req, res, next);
});

// Get workflow versions
router.get('/versions/:name', (req, res, next) => {
	/*
		#swagger.tags = ['Workflow']
		#swagger.description = 'Retorna versões do workflow pelo nome'
	*/
	return workflowController.getWorkflowVersions(req, res, next);
});

// Search workflows
router.get('/search', (req, res, next) => {
	/*
		#swagger.tags = ['Workflow']
		#swagger.description = 'Busca workflows'
	*/
	return workflowController.searchWorkflows(req, res, next);
});

// Get workflow statistics
router.get('/stats', (req, res, next) => {
	/*
		#swagger.tags = ['Workflow']
		#swagger.description = 'Retorna estatísticas de workflows'
	*/
	return workflowController.getWorkflowStats(req, res, next);
});

// ====== GENERIC ID ROUTES AFTER SPECIFIC ROUTES ======
// Get workflow by ID 
router.get('/:id', (req, res, next) => {
	/*
		#swagger.tags = ['Workflow']
		#swagger.description = 'Busca workflow por ID'
	*/
	return workflowController.getWorkflowById(req, res, next);
});

// Get workflow states
router.get('/:id/states', (req, res, next) => {
	/*
		#swagger.tags = ['Workflow']
		#swagger.description = 'Retorna estados do workflow'
	*/
	return workflowController.getWorkflowStates(req, res, next);
});

// Get workflow diagram data
router.get('/:id/diagram', (req, res, next) => {
	/*
		#swagger.tags = ['Workflow']
		#swagger.description = 'Retorna dados do diagrama do workflow'
	*/
	return workflowController.getWorkflowDiagram(req, res, next);
});

// Start a process from workflow
router.post('/:id/start', (req, res, next) => {
	/*
		#swagger.tags = ['Workflow']
		#swagger.description = 'Inicia processo a partir do workflow'
	*/
	return workflowController.startProcess(req, res, next);
});

// Clone workflow
router.post('/:id/clone', authMiddleware.authorize(['Admin', 'ProcessManager']), (req, res, next) => {
	/*
		#swagger.tags = ['Workflow']
		#swagger.description = 'Clona workflow'
	*/
	return workflowController.cloneWorkflow(req, res, next);
});

// Update workflow (creates new version)
router.put('/:id', authMiddleware.authorize(['Admin', 'ProcessManager']), (req, res, next) => {
	/*
		#swagger.tags = ['Workflow']
		#swagger.description = 'Atualiza workflow (nova versão)'
	*/
	return workflowController.updateWorkflow(req, res, next);
});

// Toggle workflow active status
router.patch('/:id/status', authMiddleware.authorize(['Admin', 'ProcessManager']), (req, res, next) => {
	/*
		#swagger.tags = ['Workflow']
		#swagger.description = 'Ativa/desativa workflow'
	*/
	return workflowController.toggleWorkflowStatus(req, res, next);
});

// Delete workflow
router.delete('/:id', authMiddleware.authorize(['Admin']), (req, res, next) => {
	/*
		#swagger.tags = ['Workflow']
		#swagger.description = 'Exclui workflow'
	*/
	return workflowController.deleteWorkflow(req, res, next);
});

// Associate form with workflow
router.post('/:id/form', authMiddleware.authorize(['Admin', 'ProcessManager']), (req, res, next) => {
	/*
		#swagger.tags = ['Workflow']
		#swagger.description = 'Associa formulário ao workflow'
	*/
	return workflowController.associateForm(req, res, next);
});

// Get state details
router.get('/:workflowId/states/:stateName', (req, res, next) => {
	/*
		#swagger.tags = ['Workflow']
		#swagger.description = 'Retorna detalhes do estado do workflow'
	*/
	return workflowController.getStateDetails(req, res, next);
});

module.exports = router;