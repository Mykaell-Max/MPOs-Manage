const express = require('express');
const router = express.Router();
// const notificationController = require('../controller/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware
router.use(authMiddleware.authenticate);

// Exemplo de rota de notificação (adicione outras conforme necessário)
router.get('/', (req, res, next) => {
	/*
		#swagger.tags = ['Notificação']
		#swagger.description = 'Exemplo de rota de notificação'
	*/
	res.status(200).json({ message: 'Notificação endpoint' });
});


module.exports = router;