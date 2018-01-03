/* global require exports next process */
/* eslint no-unused-vars: off */
/* eslint no-undef: off */
/* eslint no-console: off */
/**
 * Module dependencies.
 */
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const cachegoose = require('cachegoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({ path: '.env' }); // .env.node-billz for default config


/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const payeeController = require('./controllers/payee');
const forecastController = require('./controllers/forecast');
const paymentController = require('./controllers/payment');
const monthController = require('./controllers/month');
const mapController = require('./controllers/map');

/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */

cachegoose(mongoose, {});
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI, {
    useMongoClient: true
});
mongoose.connection.on('error', (err) => {
    console.error(err);
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
    process.exit();
});

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(expressStatusMonitor({
    path: process.env.STATUS_URL || '/status'
}));
app.use(compression());
app.use(sass({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public')
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({
        url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
        autoReconnect: true,
        clear_interval: 3600
    })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
    lusca.csrf()(req, res, next);
});
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});
app.use((req, res, next) => {
    // After successful login, redirect back to the intended page
    if (!req.user &&
        req.path !== '/login' &&
        req.path !== '/signup' &&
        !req.path.match(/^\/auth/) &&
        !req.path.match(/\./)) {
        req.session.returnTo = req.path;
    } else if (req.user &&
        req.path == '/account') {
        req.session.returnTo = req.path;
    }
    next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));


/**
 *  Page level utilities
 */
app.locals.formatCurrency = require('format-currency');
app.locals.moment = require('moment-timezone');

app.locals.moment.tz.setDefault('America/New_York');

/**
 * Primary app routes.
 */
app.get('/', homeController.index);
app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);

app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);

/**
 * node-billz specific routes
 */

 // payee related routes
app.get('/payee', passportConfig.isAuthenticated, payeeController.getIndex);
app.post('/payee/save', passportConfig.isAuthenticated, payeeController.postSave);      // Save a new payee
app.get('/payee/view/:id', passportConfig.isAuthenticated, payeeController.getView);        // View a payee
app.get('/payee/edit/:id', passportConfig.isAuthenticated, payeeController.getEdit);
app.get('/payee/edit', passportConfig.isAuthenticated, payeeController.getEdit);        // Edit a payee
app.post('/payee/save/:id', passportConfig.isAuthenticated, payeeController.postSave);      // Update a payee
app.post('/payee/pay/:id', passportConfig.isAuthenticated, payeeController.postPay);        // Make a payment
app.get('/payee/delete/:id', passportConfig.isAuthenticated, payeeController.getDelete);    // Delete a payee

// forecast related routes
app.get('/forecast', passportConfig.isAuthenticated, forecastController.getIndex);

// month related routes
app.get('/month', passportConfig.isAuthenticated, monthController.getIndex);

// map related routes
app.get('/map', passportConfig.isAuthenticated, mapController.getIndex);

// payment related routes
app.get('/payment', passportConfig.isAuthenticated, paymentController.getView);
app.get('/payment/page/:page', passportConfig.isAuthenticated, paymentController.getView);
/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
});

/**
 * Error Handler.
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
    console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
    console.log('  Press CTRL-C to stop\n');
});

module.exports = app;