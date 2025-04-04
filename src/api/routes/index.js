const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const roleRoutes = require('./roleRoutes');
const workflowRoutes = require('./workflowRoutes');
const formRoutes = require('./formRoutes');
const processRoutes = require('./processRoutes');
const documentRoutes = require('./documentRoutes');
// const notificationRoutes = require('./notificationRoutes');

router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/workflows', workflowRoutes);
router.use('/forms', formRoutes);
router.use('/processes', processRoutes);
router.use('/documents', documentRoutes);
// router.use('/notifications', notificationRoutes);

module.exports = router;