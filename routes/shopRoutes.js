const express = require('express');
const router = express.Router();

const shopController = require('../controllers/shopCtrl');

router.get('/', shopController.getIndex);

module.exports = router;