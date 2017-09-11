/* global require exports next */
/* eslint no-unused-vars: off */
const Payee = require('../models/Payee');
const Payment = require('../models/Payment');
const Moment = require('moment-timezone');

exports.getView = (req, res) => {

    Payee
        .find({ owner: req.user._id }, null, { sort: { ref: 1 } }, (err, payees) => {
            Payment
                .find({ owner: req.user._id }, null, { sort: { ref: -1 } }, (err, payments) => {

                    // Stub out the page payload
                    let data = {
                        payments: []
                    };

                    for (let payment of payments) {

                        // Get some information about the payee.. Should always exist
                        let payeeName = payees.filter((payee) => {
                            return payee.id === payment.payee;
                        });

                        // Push payment to payment array
                        data.payments.push({
                            name: payeeName[0].name,
                            payee: payment.payee,
                            ref: payment.ref,
                            createdAt: payment.createdAt,
                            amount: payment.amount
                        });
                    }

                    // Render it
                    res.render('payments/view', {
                        title: 'Payments',
                        data: data
                    });

                });
        });

};