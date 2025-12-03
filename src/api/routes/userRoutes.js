const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Registra um novo usuário (apenas admin)
 *     tags:
 *       - Autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *               department:
 *                 type: string
 *               position:
 *                 type: string
 *               preferences:
 *                 type: object
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                     department:
 *                       type: string
 *                     position:
 *                       type: string
 *       409:
 *         description: Usuário já existe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *             example:
 *               success: false
 *               message: "User with this email already exists"
 *       500:
 *         description: Erro interno ao criar usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *             example:
 *               success: false
 *               message: "Failed to create user"
 *               error: "Erro detalhado"
 */
router.post('/register', userController.createUser);
/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Realiza login do usuário
 *     tags:
 *       - Autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                     department:
 *                       type: string
 *                     position:
 *                       type: string
 *                     profileImage:
 *                       type: string
 *                     preferences:
 *                       type: object
 *             example:
 *               success: true
 *               message: "Logged in successfully"
 *               token: "<jwt_token>"
 *               user:
 *                 _id: "abc123"
 *                 name: "Admin"
 *                 email: "admin@example.com"
 *                 roles: ["Admin"]
 *                 department: "TI"
 *                 position: "Coordenador"
 *                 profileImage: "url"
 *                 preferences: {}
 *       403:
 *         description: Email ou senha inválidos, ou conta desativada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *             example:
 *               success: false
 *               message: "Invalid email or password"
 *       500:
 *         description: Erro interno ao realizar login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *             example:
 *               success: false
 *               message: "Failed to login"
 *               error: "Erro detalhado"
 */
router.post('/login', userController.loginUser);

// Protected routes
router.use(authMiddleware.authenticate);

// Get current user profile
router.get('/profile', userController.getUserProfile);

// Update user preferences
router.put('/preferences', userController.updateUserPreferences);

// Admin-only routes
router.use(authMiddleware.authorize(['Admin']));

// Update user
router.put('/:userId', userController.updateUser);

// Delete/deactivate user
router.delete('/:userId', userController.deleteUser);

// Set user substitute
router.post('/:userId/substitute', userController.setUserSubstitute);

module.exports = router;