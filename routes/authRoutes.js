const express = require('express');
const { route } = require('express/lib/application');
const router = express.Router();

const authController = require('../controllers/authCtrl');
const isAuth = require('../middleware/is-auth');

router.get('/signup', authController.getSignup);
router.post('/signup', authController.postSignup);

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

router.get('/cart', isAuth, authController.getCart);
router.post('/cart', isAuth, authController.postCart);

router.post('/cart-delete-item', isAuth, authController.postCartDeleteProduct);

router.get('/checkout', isAuth, authController.getCheckout);

router.get('/checkout/success', isAuth, authController.getCheckoutSuccess);
router.get('/checkout/cancel', isAuth, authController.getCheckout);

router.post('/create-order', isAuth, authController.postOrder);
router.get('/order', isAuth, authController.getOrders);


router.get('/add-product-req', isAuth, authController.getAddProductReq);

router.post('/logout', isAuth, authController.postLogout);

router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);
router.post('/new-password', authController.postNewPassword);

module.exports = router;