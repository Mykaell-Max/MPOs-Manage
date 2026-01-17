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
		#swagger.responses[200] = {
			description: 'Processo encontrado com sucesso',
			content: {
				'application/json': {
					example: {
						success: true,
						data: {
							_id: '656e1f...',
							workflow: {
								_id: '656e1a...',
								name: 'Aprovação de Documentos',
								steps: [
									{ name: 'Início', order: 1 },
									{ name: 'Revisão', order: 2 },
									{ name: 'Aprovação', order: 3 }
								]
							},
							startedBy: {
								_id: '656e1b...',
								name: 'João Silva',
								email: 'joao@email.com',
								role: 'User'
							},
							assignedTo: [
								{
									_id: '656e1c...',
									name: 'Maria Souza',
									email: 'maria@email.com',
									role: 'Manager'
								}
							],
							status: 'active',
							createdAt: '2025-12-05T10:00:00Z',
							updatedAt: '2025-12-05T10:10:00Z',
							history: [
								{
									action: 'start',
									executedBy: { name: 'João Silva', email: 'joao@email.com' },
									timestamp: '2025-12-05T10:00:00Z'
								},
								{
									action: 'assign',
									executedBy: { name: 'Maria Souza', email: 'maria@email.com' },
									timestamp: '2025-12-05T10:05:00Z'
								}
							],
							comments: [
								{
									text: 'Processo iniciado.',
									createdBy: { name: 'João Silva', email: 'joao@email.com' },
									createdAt: '2025-12-05T10:01:00Z'
								},
								{
									text: 'Revisão pendente.',
									createdBy: { name: 'Maria Souza', email: 'maria@email.com' },
									createdAt: '2025-12-05T10:06:00Z'
								}
							],
							fields: {
								documentType: 'Contrato',
								value: 15000,
								approved: false
							},
							dueDate: '2025-12-20T23:59:59Z',
							priority: 'high'
						}
					}
				}
			}
		}
		#swagger.responses[400] = {
			description: 'ID inválido',
			content: {
				'application/json': {
					example: {
						success: false,
						message: 'Invalid process ID format'
					}
				}
			}
		}
		#swagger.responses[404] = {
			description: 'Processo não encontrado',
			content: {
				'application/json': {
					example: {
						success: false,
						message: 'Process instance not found'
					}
				}
			}
		}
		#swagger.responses[403] = {
			description: 'Sem permissão para visualizar o processo',
			content: {
				'application/json': {
					example: {
						success: false,
						message: 'You do not have permission to view this process'
					}
				}
			}
		}
		#swagger.responses[500] = {
			description: 'Erro interno',
			content: {
				'application/json': {
					example: {
						success: false,
						message: 'Failed to fetch process',
						error: 'Mensagem detalhada do erro'
					}
				}
			}
		}
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