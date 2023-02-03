// NODEJS BUIT IN MODULES 
const crypto = require('crypto');

const User = require('../models/userMdl');
const Product = require('../models/adminProductMdl');
const Order = require('../models/orderMdl');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}));

const stripe = require('stripe')('sk_test_51KYViXSBgLCAmwJ5qOl3UfF5UZpuWHCkY9KXFh6FtGpB8ICVdw2p1BSRTxoFlklvqS9kb3kWlYzac1Mas3z5sFvO00pSi3SrFC');

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    }
    else {
        message = null;
    }
    res.render('auth/signup', {
        pageTitle: 'Shop | Sign up',
        path: '/signup',
        errorMessage: message
    });
};

exports.postSignup = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    User.findOne({ email: email }).then(userDoc => {
        if (userDoc) {
            req.flash('error', 'Email already exists please pick different one!');
            return res.redirect('/signup');
        }
        if (password !== confirmPassword) {
            console.log('Password must be same');
            return res.redirect('/signup');
        }
        bcrypt.hash(password, 12).then(hashedPassword => {
            const user = new User({
                name: name,
                email: email,
                password: hashedPassword,
                cart: { items: [] },
                isRestricted: false,
                restrictionToken: ""
            });
            return user.save();
        })
            .then(result => {
                res.redirect('/login');
                return transporter.sendMail({
                    to: email,
                    from: 'mananjay2212@gmail.com',
                    subject: 'Signup Succeded on Shop.com',
                    html: '<h1>You successfully signed up!</h1>'
                });
            }).catch(err => {
                console.log(err);
            });
    }).catch(err => {
        console.log(err);
    });
}

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    }
    else {
        message = null;
    }
    res.render('auth/login', {
        pageTitle: 'Shop | Login',
        path: '/login',
        errorMessage: message
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({ email: email }).then(userDoc => {
        if (!userDoc) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/login');
        }
        bcrypt.compare(password, userDoc.password).then(doMatch => {
            if (doMatch) {
                if (userDoc.isRestricted !== false) {
                    req.flash('error', 'User is Locked by Admin');
                    return res.redirect('/login');
                }
                req.session.isLoggedIn = true;
                //console.log(userDoc.name.toString().split(' ')[0]);
                req.session.user = userDoc;
                req.session.username = userDoc.name.toString().split(' ')[0];
                return req.session.save(err => {
                    res.redirect('/')
                });
            }
            req.flash('error', 'Incorrect password');
            res.status(422).redirect('/login');
        }).catch(err => console.log(err));
    }).catch(err => {
        console.log(err);
    });
};

exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items;
            res.render('auth/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: products
            });
        });
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then(result => {
            res.redirect('/cart');
        });
};

exports.postCartDeleteProduct = (req, res, next) => {
    const productId = req.body.productId;
    req.user
        .removeFromCart(productId)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items.map(i => {
                return { quantity: i.quantity, product: { ...i.productId._doc } };
            });
            const order = new Order({
                user: {
                    name: req.user.name,
                    userId: req.user
                },
                products: products
            });
            return order.save();
        })
        .then(result => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect('/order');
        })
        .catch(err => console.log(err));
};

exports.getCheckout = (req, res, next) => {
    let products;
    let total = 0;
    req.user
        .populate('cart.items.productId')
        .then(user => {
            products = user.cart.items;
            total = 0;
            products.forEach(p => {
                total += p.quantity * p.productId.price;
            });

            return stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: products.map(p => {
                    return {
                        name: p.productId.title,
                        description: p.productId.description,
                        amount: p.productId.price * 100,
                        currency: 'inr',
                        quantity: p.quantity
                    };
                }),
                success_url: req.protocol + '://' + req.get('host') + '/checkout/success', // => http://localhost:3000
                cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
            });
        })
        .then(session => {
            res.render('auth/checkout', {
                path: '/checkout',
                pageTitle: 'Checkout',
                products: products,
                totalSum: total,
                sessionId: session.id
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCheckoutSuccess = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items.map(i => {
                return { quantity: i.quantity, product: { ...i.productId._doc } };
            });
            const order = new Order({
                user: {
                    name: req.user.name,
                    userId: req.user
                },
                products: products,
                orderedAt: Date.now()
            });
            return order.save();
        })
        .then(result => {
            return req.user.clearCart();
        })
        .then(() => {
            console.log('sending to order');
            res.redirect('/order');
        })
        .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
    Order.find({ 'user.userId': req.user._id })
        .then(orders => {
            res.render('auth/order', {
                pageTitle: 'Shop | My Orders',
                path: '/order',
                orders: orders
            });
        })
        .catch(err => console.log(err));
};

exports.getAddProductReq = (req, res, next) => {
    res.render('auth/add-product-req', {
        pageTitle: 'Shop | Add Product Request',
        path: '/add-product-req',
        errorMessage: null
    });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        res.redirect('/');
    });
}


exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    }
    else {
        message = null;
    }
    res.render('auth/reset', {
        pageTitle: 'Shop | Reset Password',
        path: '/reset',
        errorMessage: message
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account with that email found.');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                res.redirect('/')
                transporter.sendMail({
                    to: req.body.email,
                    from: 'mananjay2212@gmail.com',
                    subject: 'Password reset for Shop.com',
                    html: `
                    <p>You requested a password reset </p>
                    <p>Click this <a href="http://localhost:4000/reset/${token}">link</a> to set a new password.</p>
                `
                });
            })
            .catch(err => console.log(err));
    });
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then(user => {
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0];
            }
            else {
                message = null;
            }
            res.render('auth/new-password', {
                pageTitle: 'Shop | New Password',
                path: '/new-password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token
            });
        })
        .catch(err => console.log(err));
};

exports.postNewPassword = (req, res, next) => {
    const NewPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetuser;

    User.findOne({ resetToken: passwordToken, resetTokenExpiration: { $gt: Date.now() }, _id: userId })
        .then(user => {
            resetuser = user;
            return bcrypt.hash(NewPassword, 12)
        })
        .then(hashedPassword => {
            resetuser.password = hashedPassword;
            resetuser.resetToken = undefined;
            resetuser.resetTokenExpiration = undefined;
            return resetuser.save();
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => console.log(err));

};