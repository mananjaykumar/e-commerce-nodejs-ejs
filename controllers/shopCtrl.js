const Product = require('../models/adminProductMdl');
exports.getIndex = (req, res, next) => {
    Product.find({}, {__v:0})
    .then(products => {
        res.render('shop/index.ejs', {
            pageTitle: 'Shop | Index',
            path: '/',
            products: products
        });
    }).catch(err => console.log(err));
    
};