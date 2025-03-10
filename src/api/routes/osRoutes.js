const express = require("express");
const router = express.Router();

const osController = require('../controller/osController');

const {verifyJWT} = require('../../../middlewares/jwtAuth');

router.use(verifyJWT);

router.route('/')
    .get(osController.searchOs);

router.route('/registerOs')
    .post(osController.createOs);   

router.route('/:osId')   
    .patch(osController.resubmitOs)     
    .delete(osController.deleteOs);
    
router.route('/:osId/status')
    .patch(osController.changeStatus);

module.exports = router;
