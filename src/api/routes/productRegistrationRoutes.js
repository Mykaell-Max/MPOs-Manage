const express = require("express");
const router = express.Router();
const productController = require('../controller/productRegistrationController');
const { verifyJWT } = require('../../../middlewares/jwtAuth');
const { roleAuth } = require('../../../middlewares/roleAuth');


router.use(verifyJWT);


// Rotas para solicitantes -------------------------------------------------------------
router.route('/requests')
    .post(roleAuth(['Solicitante', 'Admin']), productController.createRequest)
    .get(productController.getMyRequests);

router.route('/requests/:requestId/resubmit')
    .patch(roleAuth(['Solicitante', 'Admin']), productController.resubmitRequest);


// Rotas para equipe de compras --------------------------------------------------------
router.route('/purchasing/pending')
    .get(roleAuth(['Compras', 'Admin']), productController.getPendingPurchasingReviews);

router.route('/purchasing/:requestId/review')
    .patch(roleAuth(['Compras', 'Admin']), productController.reviewByPurchasing);


// Rotas para equipe de cadastro -------------------------------------------------------
router.route('/registration/pending')
    .get(roleAuth(['Cadastro', 'Admin']), productController.getPendingRegistrations);

router.route('/registration/:requestId/process')
    .patch(roleAuth(['Cadastro', 'Admin']), productController.processRegistration);


// Rotas para busca e visualização -----------------------------------------------------
router.route('/search')
    .get(productController.searchRequests);


module.exports = router;