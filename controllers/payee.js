/* global require exports next */
/* eslint no-unused-vars: off */
const Payee = require('../models/Payee');
const Payments = require('../models/Payment');

/**
 * @function getIndex
 */
exports.getIndex = (req, res) => {
    Payee
        .find({ owner: req.user._id, deleted: false }, null, { sort: { ref: 1 } }, (err, payees) => {
            
            if (err) {return next(err);}
            res.render('payees/list', {
                title: 'Payees',
                payees: payees,
                total: payees.reduce((acc, payee) => acc + payee.amount, 0),
                count: payees.length
            });

        });
};

/**
 * @function getView
 * @param {string} params.id - route param that contains the id of the payee
 */
exports.getView = (req, res) => {
    if(req.params.id) {
        Payee
            .findOne({ _id: req.params.id, owner: req.user._id, deleted: false }, (err, payee) => {
                Payments
                    .find({ owner: req.user.id, payee: req.params.id }, null, { sort: { ref: -1 } }, (err, payments) => {

                        let avgPayment = payee.amount;
                        if(payments.length) {
                            avgPayment = payments.reduce((acc, payment) => acc + payment.amount, 0) / payments.length;
                        }
                        res.render('payees/view', {
                            title: 'View Payee',
                            payee: payee,
                            payDate: req.query.dt || '',
                            avgPayment: avgPayment,
                            payments: payments
                        });
                    });
            });
    }

};

/**
 * @function getEdit
 * @param {string} params.id - route param that contains the id of the payee
 */
exports.getEdit = (req, res) => {
    if (req.params.id) {
        Payee
            .findOne({ _id: req.params.id, owner: req.user._id, deleted: false }, (err, payee) => {

                Payments
                    .find({ owner: req.user.id, payee: payee.id }, (err, payments) => {
                        res.render('payees/edit', {
                            title: 'Edit Payee',
                            payee: payee
                        });
                    });

            });
    }
};

/**
 * @function getCreate
 * @param {string} params.id - route param that contains the id of the payee
 */
exports.getCreate = (req, res) => {
    Payee
        .findOne({_id: req.params.id, owner: req.user._id, deleted: false}, (err, payee) => {

            if (err) {return next(err);}
            
            res.render('payees/create', {
                title: 'Create Payee'
            });
        });
};

/**
 * @function postCreate
 * @param {string} body.name - name of the payee
 * @param {string} body.description - description of the payee
 * @param {numeric} body.due - day of month a payee is due
 * @param {numeric} body.amount - the amount of the payment
 */
exports.postCreate = (req, res) => {
    let payee = new Payee();

    payee.name = req.body.name || '';
    payee.url = req.body.url || '';
    payee.description = req.body.description || '';
    payee.ref = req.body.ref || '';
    payee.amount = req.body.amount || '';
    
    payee.owner = req.user._id;
    payee.intervalType = 'm';

    payee.save((err) => {
        if (err) {return next(err);}

        req.flash('success', { msg: 'Your payee ' + payee.name + ' was successfully created.' });
        res.redirect('/payee/');
    });

};

/**
 * @function postSave
 * @param {string} params.id - route param that contains the id of the payee
 * @param {string} body.name - name of the payee
 * @param {string} body.description - description of the payee
 * @param {numeric} body.due - day of month a payee is due
 * @param {numeric} body.amount - the amount of the payment
 */
exports.postSave = (req, res) => {
    req.assert('name', 'You must enter a name for this payee').len(1);
    
    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/payee/edit/' + req.params.id);
    }

    Payee
        .findById(req.params.id, (err, payee) => {
            if (err) {return next(err);}

            if (!payee) {
                payee = new Payee();
            }

            payee.name = req.body.name || '';
            payee.url = req.body.url || '';
            payee.description = req.body.description || '';
            payee.ref = req.body.ref || '';
            payee.amount = req.body.amount || '';
            payee.save((err) => {
                if (err) {return next(err);}
                req.flash('success', { msg: 'Payee ' + payee.name + ' has been updated.' });
                res.redirect('/payee');
            });
        });

};

exports.postPay = (req, res) => {
    let payment = new Payments();

    payment.owner = req.user.id;
    payment.payee = req.params.id;
    payment.ref = req.body.ref;
    payment.amount = req.body.amount;

    payment.save((err) => {
        if (err) { return next(err); }

        req.flash('success', { msg: 'Your payment has been created.' });
        res.redirect('/payee/view/' + req.params.id);
    });
};

exports.getDelete = (req, res) => {
    if (req.params.id) {
        Payee
            .findOne({ _id: req.params.id, owner: req.user._id, deleted: false }, (err, payee) => {

                payee.deleted = true;
                payee.active = false'
                
                payee.save((err) => {
                    req.flash('success', {msg: 'Payee ' + payee.name + ' has been deleted'});
                    res.redirect('/payee');
                });

            });
    }
};