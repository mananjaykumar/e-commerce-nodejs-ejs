const Admin = require('../models/adminMdl');
const User = require('../models/userMdl');
const Order = require('../models/orderMdl');
const Product = require('../models/adminProductMdl');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

exports.getAdminLogin = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0){
        message = message[0];
    }
    else{
        message = null;
    }
    res.render('admin/admin-login', {
        pageTitle: 'Shop | Admin Login',
        path: '/admin/login',
        errorMessage: message,
        adminPage: true
    });
};

exports.postAdminLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    Admin.findOne({email: email})
    .then(adminUser => {
        if(!adminUser){
            req.flash('error', 'Invalid email or password.')
            return res.redirect('/admin/login');
        }
        bcrypt.compare(password, adminUser.password)
        .then(doMatch => {
            if(doMatch){
                req.session.isAdminLoggedIn = true;
                //console.log(userDoc.name.toString().split(' ')[0]);
                req.session.adminuser = adminUser;
                req.session.adminUserName = adminUser.name.toString().split(' ')[0];
                return req.session.save(err => {
                    res.redirect('/admin/home');
                });
            }
            res.redirect('/admin/login');
        })
        .catch(err => console.log(err));
    })
    .catch(err => {
        console.log(err);
    });
};

exports.getAdminCreateUser = (req, res, next) => {
    let Emessage = req.flash('error');
    let Smessage = req.flash('success');
    if(Emessage.length > 0){
        Emessage = Emessage[0];
    }
    else{
        Emessage = null;
    }
    if(Smessage.length > 0){
        Smessage = Smessage[0];
    }
    else{
        Smessage = null;
    }
    res.render('admin/admin-createUser', {
        pageTitle: 'Admin | CreateUser',
        path: '/admin/admin-createUser',
        errorMessage: Emessage,
        successMessage: Smessage,
        adminPage: true,
    });
};

exports.postAdminCreateUser = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    
    Admin.findOne({email: email})
    .then(adminuser => {
        if(adminuser){
            req.flash('error', 'Admin already exists!');
            return res.redirect('/admin/admin-createUser');
        }
        if(password !== confirmPassword){
            req.flash('error', 'Password must be same!');
            return res.redirect('/admin/admin-createUser');
        }
        bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const adminUser = new Admin({
                name: name,
                email: email,
                password: hashedPassword
            });
            return adminUser.save();
        }).then(result => {
            req.flash('success', 'Admin saved successfully!');
            res.redirect('/admin/admin-createUser');
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.getAdminHome = (req, res, next) => {
    Product.find({}, {__v:0})
    .then(products => {
        res.render('admin/admin-portalHome', {
            pageTitle: 'Admin Portal | Home',
            path: '/admin/home',
            errorMessage: null,
            adminPage: true,
            products: products
        });
    })
    .catch(err => console.log(err));
}; 

exports.getAdminAddProduct = (req, res, next) => {
    let Emessage = req.flash('error');
    let Smessage = req.flash('success');
    if(Emessage.length > 0){
        Emessage = Emessage[0];
    }
    else{
        Emessage = null;
    }
    if(Smessage.length > 0){
        Smessage = Smessage[0];
    }
    else{
        Smessage = null;
    }
    const editing = req.params.editing.split(':')[1];
    if(editing == 'false'){
        res.render('admin/admin-addProduct', {
            pageTitle: 'Admin Portal | Add Product',
            path: '/admin/add-product',
            errorMessage: Emessage,
            successMessage: Smessage,
            adminPage: true,
            editing: false
        });
    }
    else{
        const prodId = req.params.productId.split(':')[1];
        Product.findOne({_id: prodId})
        .then(product => {
            res.render('admin/admin-addProduct', {
                pageTitle: 'Admin Portal | Edit Product',
                path: '/admin/add-product',
                errorMessage: Emessage,
                successMessage: Smessage,
                adminPage: true,
                editing: editing,
                prods: product
            });
        })
        .catch(err => console.log(err));
    }
};

exports.postAdminAddProduct = (req, res, next) => {
    const title = req.body.title;
    const subtitle = req.body.subtitle;
    const imageurl = req.body.imageurl;
    const price = req.body.price;
    const description = req.body.description;
    
    const product = new Product({
        title: title,
        subtitle: subtitle,
        imageurl: imageurl,
        price: price,
        description: description,
        adminId: req.session.adminuser._id,
        createdAt: Date.now()
    });
    product.save()
    .then(result => {
        req.flash('success', 'Product Added Successfully.');
        return res.redirect('/admin/home');
    })
    .catch(err => console.log(err));
};

exports.postAdminEditProduct = (req, res, next) => {
    const productId = req.params.productId.split(':')[1];
    const updatedtitle = req.body.title;
    const updatedsubtitle = req.body.subtitle;
    const updatedimageurl = req.body.imageurl;
    const updatedprice = req.body.price;
    const updateddescription = req.body.description;

    Product.findById(productId)
    .then(product => {
        product.title = updatedtitle;
        product.subtitle = updatedsubtitle;
        product.imageurl = updatedimageurl;
        product.price = updatedprice;
        product.description = updateddescription;
        return product.save();
    })
    .then(result => {
        res.redirect('/admin/home');
    })
    .catch(err => console.log(err));
}

exports.getAdminUsersList = (req, res, next) => {
    User.find({}, {__v:0})
    .then(users => {
        res.render('admin/admin-userList', {
            pageTitle: 'Admin | User List',
            path: '/admin/admin-userList',
            adminPage: true,
            users: users
        });
    })
    .catch(err => console.log(err));
};

exports.postAdminUsersList = (req, res, next) => {
    const userId = req.body.userId;
    crypto.randomBytes(32, (err, buffer) => {
        if(err){
            console.log(err);
            return res.redirect('/admin/user-list');
        }
        const token = buffer.toString('hex');
        User.findOne({_id: userId})
        .then(user => {
            if(!user){
                return res.redirect('/admin/home');
            }
            user.restrictionToken = token;
            return user.save();
        })
        .then(result => {
            res.redirect(`/admin/user-list/:${token}/:${userId}`);
        })
        .catch(err => console.log(err));
    });
};

exports.getAdminUsersListDetails = (req, res, next) => {
    const restrictionStatusToken = req.params.token.split(':')[1];
    User.findOne({restrictionToken: restrictionStatusToken})
    .then(user => {
        if(user.isRestricted){
            user.isRestricted = false;
        }
        else{
            user.isRestricted = true;
        }
        user.restrictionToken = undefined;
        return user.save();
    })
    .then(result => {
        res.redirect('/admin/user-list');
    })
    .catch(err => console.log(err));
};

exports.getAdminProductDetails = (req, res, next) => {
    const productId = req.params.productId.split(':')[1];
    Product.findOne({_id: productId})
    .then(product => {
        res.render('admin/admin-productDetails', {
            pageTitle: 'Admin | Product Details',
            path: '/admin/productDetails',
            prods: product
        });
    })
    .catch(err => console.log(err));
};

exports.postAdminLogout = (req, res, next) => {
    req.session.destroy(err => {
        if(!err){
            return res.redirect('/admin/login');
        }
    })
};

exports.getAdminOrderList = (req, res, next) => {
    Order.find({}, {__v:0})
    .then(order => {
        res.render('admin/admin-orderList', {
            pageTitle: 'Admin | Order List',
            path: '/admin/admin-OrderList',
            adminPage: true,
            orders: order
        });
    })
    .catch(err => console.log(err));
};