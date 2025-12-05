const express = require('express');
const router = express.Router();
const formController = require('../controller/formDefinitionController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware
router.use(authMiddleware.authenticate);

// Create a new form definition
router.post('/', authMiddleware.authorize(['Admin', 'FormDesigner']), (req, res, next) => {
	/*
		#swagger.tags = ['Formulário']
		#swagger.description = 'Cria uma nova definição de formulário'
	*/
	return formController.createFormDefinition(req, res, next);
});

// Get all forms
router.get('/', (req, res, next) => {
	/*
		#swagger.tags = ['Formulário']
		#swagger.description = 'Retorna todos os formulários'
	*/
	return formController.getAllFormDefinitions(req, res, next);
});


// ====== SPECIFIC ROUTES FIRST ======
// Get form by name
router.get('/name/:name', (req, res, next) => {
	/*
		#swagger.tags = ['Formulário']
		#swagger.description = 'Busca formulário pelo nome'
	*/
	return formController.getFormDefinitionByName(req, res, next);
});

// Get form versions
router.get('/versions/:name', (req, res, next) => {
	/*
		#swagger.tags = ['Formulário']
		#swagger.description = 'Retorna versões do formulário pelo nome'
	*/
	return formController.getFormVersions(req, res, next);
});

// ====== GENERIC ID ROUTES AFTER SPECIFIC ROUTES ======
// Get form by ID
router.get('/:id', (req, res, next) => {
	/*
		#swagger.tags = ['Formulário']
		#swagger.description = 'Busca formulário pelo ID'
	*/
	return formController.getFormDefinition(req, res, next);
});

// Update form (creates new version)
router.put('/:id', authMiddleware.authorize(['Admin', 'FormDesigner']), (req, res, next) => {
	/*
		#swagger.tags = ['Formulário']
		#swagger.description = 'Atualiza formulário (nova versão)'
	*/
	return formController.updateFormDefinition(req, res, next);
});

// Toggle form active status
router.patch('/:id/status', authMiddleware.authorize(['Admin', 'FormDesigner']), (req, res, next) => {
	/*
		#swagger.tags = ['Formulário']
		#swagger.description = 'Ativa/desativa formulário'
	*/
	return formController.toggleFormStatus(req, res, next);
});

// Validate form data
router.post('/:id/validate', (req, res, next) => {
	/*
		#swagger.tags = ['Formulário']
		#swagger.description = 'Valida dados do formulário'
	*/
	return formController.validateFormData(req, res, next);
});

// Clone a form
router.post('/:id/clone', authMiddleware.authorize(['Admin', 'FormDesigner']), (req, res, next) => {
	/*
		#swagger.tags = ['Formulário']
		#swagger.description = 'Clona formulário'
	*/
	return formController.cloneFormDefinition(req, res, next);
});

// Delete form
router.delete('/:id', authMiddleware.authorize(['Admin']), (req, res, next) => {
	/*
		#swagger.tags = ['Formulário']
		#swagger.description = 'Exclui formulário'
	*/
	return formController.deleteFormDefinition(req, res, next);
});

// Associate form with workflow
router.post('/:id/workflows', authMiddleware.authorize(['Admin', 'FormDesigner']), (req, res, next) => {
	/*
		#swagger.tags = ['Formulário']
		#swagger.description = 'Associa formulário a workflow'
	*/
	return formController.associateWithWorkflow(req, res, next);
});

// Remove workflow association
router.delete('/:id/workflows/:workflowId', authMiddleware.authorize(['Admin', 'FormDesigner']), (req, res, next) => {
	/*
		#swagger.tags = ['Formulário']
		#swagger.description = 'Remove associação de workflow do formulário'
	*/
	return formController.removeWorkflowAssociation(req, res, next);
});

// Get form permissions
router.get('/:id/permissions', (req, res, next) => {
	/*
		#swagger.tags = ['Formulário']
		#swagger.description = 'Retorna permissões do formulário'
	*/
	return formController.getFormPermissions(req, res, next);
});

module.exports = router;