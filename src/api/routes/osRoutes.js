const express = require("express");
const router = express.Router();

const osController = require('../controller/osController');

const {verifyJWT} = require('../../../middlewares/jwtAuth');

router.route('/')
    .get(osController.getAllOs);

router.route('/registerOs')
    .post(osController.createOs);   

router.route('/:id')
    .get(osController.getOsById)      
    .patch(osController.resubmitOs)     
    .delete(osController.deleteOs);
    
router.route('/:id/status')
    .patch(osController.changeStatus);

module.exports = router;
