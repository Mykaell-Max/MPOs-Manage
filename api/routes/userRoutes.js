const express = require("express");
const router = express.Router();

const userController = require('../controller/userController');

const {verifyJWT} = require('../../middlewares/jwtAuth');

router
    .route('/registerUser')
    .post(userController.createUser);

router
    .route('/login')
    .post(userController.loginUser);

router
    .route('/:userId')
    .patch(userAuth, userController.updateUser)
    .delete(userAuth, userController.deleteUser);

module.exports = router;