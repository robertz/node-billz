/* global require exports next */
/* eslint no-unused-vars: off */
const Payee = require('../models/Payee');
const Payments = require('../models/Payment');
const Moment = require('moment-timezone');
const _ = require('lodash');

// GET default payee handler
exports.getIndex = async (req, res) => {

    const getPayees = () => {
        return Payee.find({ owner: req.user.id })
            .sort({ day: 1 })
            .then((payees) => {
                return payees;
            });
    };

    try {
        let payees = await getPayees();

        res.render('payees/index', {
            title: 'Payees',
            payees: payees,
            total: payees.reduce((acc, payee) => acc + payee.amount, 0),
            count: payees.length
        });        
    }
    catch (err) {
        req.flash('errors', { msg: 'There was an error attempting to load the requested page' });
        res.redirect('/');
    }

};

// GET the payee specified by the id URL parameter
exports.getView = async (req, res) => {

    const getPayee = () => {
        return Payee.findOne({ _id: req.params.id, owner: req.user.id })
            .then((payee) => {
                return payee;
            });
    };

    const getPayments = () => {
        return Payments.find({ owner: req.user.id, payee: req.params.id })
            .sort({ ref: -1 })
            .then((payments) => {
                return payments;
            })
    };

    try {
        let payee = await getPayee();
        let payments = await getPayments();

        let data = {
            payee: payee,
            avgPayment: 0,
            payDate: req.query.dt || '',
            payments: payments,
            graph: {
                labels: [],
                amounts: []
            }
        };

        data.avgPayment = payee.amount;

        if (payments.length) {
            // duplicate the payment array
            let histSort = payments.slice();
            for (let payment of histSort.reverse()) {
                data.graph.labels.push( new Moment(payment.ref).format('M') );
                data.graph.amounts.push( payment.amount );
            }
            data.avgPayment = payments.reduce((acc, payment) => acc + payment.amount, 0) / payments.length;
        }

        res.render('payees/view', {
            title: 'View Payee',
            data: data
        });
    }
    catch (err) {
        req.flash('errors', { msg: 'There was an error attempting to load the requested page' });
        res.redirect('/');
    }

};

// GET the edit payee view specified by the id URL parameter
exports.getEdit = (req, res) => {
    if (req.params.id) {
        Payee
            .findOne({ _id: req.params.id, owner: req.user._id, deleted: false }, (err, payee) => {
                res.render('payees/edit', {
                    title: 'Edit Payee',
                    create: false,
                    payee: payee
                });
            });
    }
    else {
        res.render("payees/edit", {
          title: "Create Payee",
          create: true
        });
    }
};

// POST update the payee to the backend and sanitize the input
exports.postSave = async (req, res) => {
    req.assert('name', 'You must enter a name for this payee').len(1);
    req.sanitize('name');
    req.sanitize('url');
    req.sanitize('description');

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        if (req.params.id){
            return res.redirect("/payee/edit/" + req.params.id);
        }
        else {
            return res.redirect("/payee/edit");
        }
    }

    const getPayee = () => {
        return Payee.findById({ _id: req.params.id })
            .then((payee) => {
                return payee;
            })
    }; 

    let payee = new Payee();
    if (req.params.id) payee = await getPayee();

    payee.name = req.body.name || '';
    payee.url = req.body.url || '';
    payee.description = req.body.description || '';
    payee.ref = req.body.ref || '';
    payee.amount = req.body.amount || '';

    payee.day = new Moment(payee.ref).format('D');

    payee.owner = req.user._id;
    payee.intervalType = "m";

    payee.save((err) => {
        if (err) { return next(err); }
        req.flash('success', { msg: 'Payee ' + payee.name + ' has been ' + (req.params.id ? 'updated' : 'created') + '.' });
        res.redirect('/payee');
    });

};

// POST insert a payment for payee specified by the id URL parameter
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

// GET delete the payee specified by the id URL parameter
exports.getDelete = (req, res) => {
    if (req.params.id) {

        // Delete the payee

        Payee.remove({ owner: req.user.id, _id: req.params.id }, (err) => {
            if (err) { return next(err);}

            // and all associated payments
            Payments.remove({ owner: req.user.id, payee: req.params.id }, (err) => {
                if (err) { return next(err); }

                req.flash('success', { msg: 'Payee and any associated payments have been removed!' });
                res.redirect('/payee');

            });

        });

    }
};
