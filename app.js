const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const app = express();

// IMPORTING USER MODEL
const User = require('./models/userMdl');

const MONGODB_URI = 'mongodb+srv://mananjay82:3YyTwhcPhOWTPG4I@cluster0.elcge.mongodb.net/myshop?authSource=admin&replicaSet=atlas-630pak-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true';


const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

// IMPORTING ERROR CONTROLLERS
const errController = require('./controllers/errorCtrl');

// IMPORTING ROUTES
const shopRouter = require('./routes/shopRoutes');
const authRouter = require('./routes/authRoutes');
const adminRouter = require('./routes/adminRoutes');

// USING MIDDLEWARES
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: 'mananjay@8233', resave: false, saveUninitialized: false, store: store}));
app.use(csrfProtection);
app.use(flash());

// THESE MIDDLEWARES ARE FOR USERS
app.use((req, res, next) => {
    if(!req.session.user){
        return next();
    }
    User.findById(req.session.user._id).then(user => {
        req.user = user;
        next();
    }).catch(err => {
        console.log(err);
    })
});
app.use((req, res, next) => {
    res.locals.adminPage =  false;
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.userName = req.session.username;
    res.locals.csrfToken = req.csrfToken();
    next();
});

// THESE MIDDLEWARES ARE FOR ADMINS
app.use((req, res, next) => {
    if(!req.session.adminuser){
        return next();
    }
    User.findById(req.session.adminuser._id).then(user => {
        req.adminuser = user;
        next();
    }).catch(err => {
        console.log(err);
    })
});
app.use((req, res, next) => {
    // res.locals.adminPage =  false;
    res.locals.isAdminAuthenticated = req.session.isAdminLoggedIn;
    res.locals.adminUserName = req.session.adminUserName;
    res.locals.csrfToken = req.csrfToken();
    next();
});




// USING ROUTES
app.use('/admin', adminRouter);
app.use(authRouter);
app.use(shopRouter);
app.use(errController.get404);



mongoose.connect(MONGODB_URI).then(resut => {
    console.log('DB Connected!');
    app.listen(3000);
}).catch(err => {
    console.log(err);
});
