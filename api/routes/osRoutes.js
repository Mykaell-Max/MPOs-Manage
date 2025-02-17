const express = require("express");
const router = express.Router();

const osController = require('../controller/osController');

const {verifyJWT} = require('../../middlewares/jwtAuth');

router.route('/registerOs')
    .post(osController.createOs)   
    .get(osController.getAllOs);      

router.route('/:id')
    .get(osController.getOsById)      
    .patch(osController.updateOs)     
    .delete(osController.deleteOs);   

module.exports = router;
