const express = require('express');
const router = express.Router();
const processController = require('../controller/processInstanceController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware
router.use(authMiddleware.authenticate);

// ====== SPECIFIC ROUTES FIRST ======
// Start a new process
router.post('/start', (req, res, next) => {
	/*
		#swagger.tags = ['Processo']
		#swagger.description = 'Inicia um novo processo'
	*/
	return processController.startProcess(req, res, next);
});

// Get processes with filtering
router.get('/search', (req, res, next) => {
	/*
		#swagger.tags = ['Processo']
		#swagger.description = 'Busca processos com filtros'
	*/
	return processController.getProcesses(req, res, next);
});

// Get tasks assigned to current user
router.get('/tasks/my', (req, res, next) => {
	/*
		#swagger.tags = ['Processo']
		#swagger.description = 'Retorna tarefas do usuário atual'
	*/
	return processController.getMyTasks(req, res, next);
});

// Get process statistics
router.get('/stats', (req, res, next) => {
	/*
		#swagger.tags = ['Processo']
		#swagger.description = 'Retorna estatísticas dos processos'
	*/
	return processController.getProcessStats(req, res, next);
});

// Bulk actions on processes
router.post('/bulk/:action', authMiddleware.authorize(['Admin', 'ProcessManager']), (req, res, next) => {
	/*
		#swagger.tags = ['Processo']
		#swagger.description = 'Ações em lote nos processos'
	*/
	return processController.bulkAction(req, res, next);
});

// ====== GENERIC ID ROUTES AFTER SPECIFIC ROUTES ======
// Get process by ID
router.get('/:id', (req, res, next) => {
	/*
		#swagger.tags = ['Processo']
		#swagger.description = 'Busca processo por ID'
	*/
	return processController.getProcessById(req, res, next);
});

// Get process history
router.get('/:id/history', (req, res, next) => {
	/*
		#swagger.tags = ['Processo']
		#swagger.description = 'Retorna histórico do processo'
	*/
	return processController.getProcessHistory(req, res, next);
});

// Get process timeline
router.get('/:id/timeline', (req, res, next) => {
	/*
		#swagger.tags = ['Processo']
		#swagger.description = 'Retorna timeline do processo'
	*/
	return processController.getProcessTimeline(req, res, next);
});

// Get available actions for a process
router.get('/:id/actions', (req, res, next) => {
	/*
		#swagger.tags = ['Processo']
		#swagger.description = 'Retorna ações disponíveis para o processo'
	*/
	return processController.getAvailableActions(req, res, next);
});

// Execute action on process
router.post('/:id/actions/:action', (req, res, next) => {
	/*
		#swagger.tags = ['Processo']
		#swagger.description = 'Executa ação no processo'
	*/
	return processController.executeAction(req, res, next);
});

// Export process to PDF/CSV
router.get('/:id/export/:format', (req, res, next) => {
	/*
		#swagger.tags = ['Processo']
		#swagger.description = 'Exporta processo para PDF/CSV'
	*/
	return processController.exportProcess(req, res, next);
});

// Add comment to process
router.post('/:id/comments', (req, res, next) => {
	/*
		#swagger.tags = ['Processo']
		#swagger.description = 'Adiciona comentário ao processo'
	*/
	return processController.addComment(req, res, next);
});

// Reassign process
router.post('/:id/reassign', authMiddleware.authorize(['Admin', 'ProcessManager']), (req, res, next) => {
	/*
		#swagger.tags = ['Processo']
		#swagger.description = 'Reatribui processo'
	*/
	return processController.reassignProcess(req, res, next);
});

// Set process priority
router.patch('/:id/priority', (req, res, next) => {
	/*
		#swagger.tags = ['Processo']
		#swagger.description = 'Define prioridade do processo'
	*/
	return processController.setPriority(req, res, next);
});

// Set process due date
router.patch('/:id/due-date', (req, res, next) => {
	/*
		#swagger.tags = ['Processo']
		#swagger.description = 'Define data de vencimento do processo'
	*/
	return processController.setDueDate(req, res, next);
});

module.exports = router;