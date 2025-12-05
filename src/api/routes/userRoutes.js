const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/register', (req, res, next) => {
  /* 
    #swagger.tags = ['Autenticação']
    #swagger.description = 'Registra um novo usuário (apenas admin)'
  */
  return userController.createUser(req, res, next);
});

router.post('/login', (req, res, next) => {
  /* 
    #swagger.tags = ['Autenticação']
    #swagger.description = 'Realiza login do usuário'
  */
  return userController.loginUser(req, res, next);
});

// Protected routes - require authentication
router.use(authMiddleware.authenticate);

// Get current user profile
router.get('/profile', (req, res, next) => {
  /* 
    #swagger.tags = ['Usuário']
    #swagger.description = 'Retorna o perfil do usuário autenticado'
  */
  return userController.getUserProfile(req, res, next);
});

// Update user preferences
router.put('/preferences', (req, res, next) => {
  /* 
    #swagger.tags = ['Usuário']
    #swagger.description = 'Atualiza as preferências do usuário autenticado'
  */
  return userController.updateUserPreferences(req, res, next);
});

// Admin-only routes
router.use(authMiddleware.authorize(['Admin']));

// Update user
router.put('/:userId', (req, res, next) => {
  /* 
    #swagger.tags = ['Usuário']
    #swagger.description = 'Atualiza dados de um usuário (admin)'
  */
  return userController.updateUser(req, res, next);
});

// Delete/deactivate user
router.delete('/:userId', (req, res, next) => {
  /* 
    #swagger.tags = ['Usuário']
    #swagger.description = 'Desativa (soft delete) um usuário (admin)'
  */
  return userController.deleteUser(req, res, next);
});

// Set user substitute
router.post('/:userId/substitute', (req, res, next) => {
  /* 
    #swagger.tags = ['Usuário']
    #swagger.description = 'Define um substituto para o usuário (admin)'
  */
  return userController.setUserSubstitute(req, res, next);
});

module.exports = router;
