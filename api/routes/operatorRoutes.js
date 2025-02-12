const express = require("express");
const router = express.Router();

const operatorController = require("../controller/operatorController");

router
    .route('/registerOperator')
    .post(operatorController.createOperator);


// login, update, delete | too

module.exports = router;