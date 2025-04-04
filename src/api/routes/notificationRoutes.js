const express = require('express');
const router = express.Router();
// const notificationController = require('../controller/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware
router.use(authMiddleware.authenticate);


module.exports = router;