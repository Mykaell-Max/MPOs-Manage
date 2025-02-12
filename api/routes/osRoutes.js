const express = require("express");
const router = express.Router();

const osController = require("../controller/osController")

router
    .route('/registerOs')
    .post(osController.createOs);


// need to know more about OS 


module.exports = router;