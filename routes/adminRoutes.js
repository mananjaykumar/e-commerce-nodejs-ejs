const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminCtrl');
const isAdminAuth = require('../middleware/is-admin-auth');

router.get('/login', adminController.getAdminLogin);
router.post('/login', adminController.postAdminLogin);

router.get('/home',isAdminAuth, adminController.getAdminHome);

router.get('/admin-createUser', isAdminAuth, adminController.getAdminCreateUser);
router.post('/admin-createUser', isAdminAuth, adminController.postAdminCreateUser);

router.get('/add-product/:editing', isAdminAuth, adminController.getAdminAddProduct);
router.get('/add-product/:editing/:productId', isAdminAuth, adminController.getAdminAddProduct);
router.post('/add-product', isAdminAuth, adminController.postAdminAddProduct);
router.post('/edit-product/:productId', isAdminAuth, adminController.postAdminEditProduct);

router.get('/user-list', isAdminAuth, adminController.getAdminUsersList);
router.post('/user-list', isAdminAuth, adminController.postAdminUsersList);

router.get('/user-list/:token/:userId', isAdminAuth, adminController.getAdminUsersListDetails);

router.get('/orders', isAdminAuth, adminController.getAdminOrderList);

router.get('/products/:productId', adminController.getAdminProductDetails);

router.post('/logout',isAdminAuth, adminController.postAdminLogout);


module.exports = router;