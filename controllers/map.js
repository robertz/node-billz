/* global require exports next */
/* eslint no-unused-vars: off */
const Payee = require('../models/Payee');
const Payment = require('../models/Payment');
const Moment = require('moment-timezone');
const _ = require('lodash');

exports.getIndex = async (req, res) => {

    const getPayees = () => {
        return Payee.find({ owner: req.user.id })
        .sort({ day: 1 })
        .then(payees => {
            return payees;
        });
    };

    const getPayments = () => {
        return Payment.find({ owner: req.user.id })
        .sort({ ref: -1 })
        .then(payments => {
            return payments;
        });
    };

    let payess = await getPayees();
    let payments = await getPayments();

    
    // Render it
    res.render('map/index', {
        title: 'Map',
        data: {}
    });

};