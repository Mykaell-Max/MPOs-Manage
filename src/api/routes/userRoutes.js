const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes

router.post('/register', (req, res, next) => {
  /*
    #swagger.tags = ['Autenticação']
    #swagger.description = 'Registra um novo usuário (apenas admin)'
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string", example: "João Silva" },
              email: { type: "string", example: "joao@email.com" },
              password: { type: "string", example: "senha123" },
              department: { type: "string", example: "Financeiro" },
              position: { type: "string", example: "Analista" },
              preferences: { type: "object", example: { theme: "dark" } },
              roles: { type: "array", items: { type: "string" }, example: ["User"] }
            },
            required: ["name","email","password"]
          }
        }
      }
    }
    #swagger.responses[201] = {
      description: 'Usuário criado com sucesso',
      content: {
        "application/json": {
          example: {
            success: true,
            message: "User created successfully",
            data: {
              _id: "656e1f...",
              name: "João Silva",
              email: "joao@email.com",
              roles: ["User"],
              department: "Financeiro",
              position: "Analista",
              preferences: { theme: "dark" }
            }
          }
        }
      }
    }
    #swagger.responses[409] = {
      description: 'Usuário já existe',
      content: {
        'application/json': {
          example: {
            success: false,
            message: 'User with this email already exists'
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
            message: 'Failed to create user',
            error: 'Mensagem detalhada do erro'
          }
        }
      }
    }
  */
  return userController.createUser(req, res, next);
});

router.post('/login', (req, res, next) => {
  /*
    #swagger.tags = ['Autenticação']
    #swagger.description = 'Realiza login do usuário'
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: 'object',
            properties: {
              email: { type: 'string', example: 'joao@email.com' },
              password: { type: 'string', example: 'senha123' }
            },
            required: ['email', 'password']
          }
        }
      }
    }
    #swagger.responses[200] = {
      description: 'Login realizado com sucesso',
      content: {
        'application/json': {
          example: {
            success: true,
            message: 'Logged in successfully',
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            user: {
              _id: '656e1f...',
              name: 'João Silva',
              email: 'joao@email.com',
              roles: ['User'],
              department: 'Financeiro',
              position: 'Analista',
              profileImage: 'https://...',
              preferences: { theme: 'dark' }
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      description: 'Email ou senha inválidos, ou conta desativada',
      content: {
        'application/json': {
          examples: {
            invalid: {
              summary: 'Credenciais inválidas',
              value: {
                success: false,
                message: 'Invalid email or password'
              }
            },
            deactivated: {
              summary: 'Conta desativada',
              value: {
                success: false,
                message: 'Your account is deactivated. Please contact an administrator.'
              }
            }
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
            message: 'Login failed',
            error: 'Mensagem detalhada do erro'
          }
        }
      }
    }
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
