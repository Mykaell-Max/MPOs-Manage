const express = require("express");
const router = express.Router();

const userController = require('../controller/userController');

router
    .route('/registerUser')
    .post(userController.createUser);




// login, update, delete | too

module.exports = router;