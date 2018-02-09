/* global require exports next */
/* eslint no-unused-vars: off */
const Payee = require("../models/Payee");
const Payment = require("../models/Payment");
const Moment = require("moment-timezone");

exports.getVue = async (req, res) => {

    const getPayees = () => {
        return Payee.find({ owner: req.user.id })
        .sort({ day: 1 })
        .cache(0, req.user.id + "__payees")
        .then(payees => {
            return payees;
        });
    };

    const getPayments = () => {
        return Payment.find({ owner: req.user.id })
        .sort({ ref: -1 })
        .cache(0, req.user.id + "__payments")
        .then(payments => {
            return payments;
        });
    };

    try {

        let payees = await getPayees();
        let payments = await getPayments();

        res.render("payments/vue", {
            title: "Your payment history",
            data: {
                userid: req.user.id,
                user: {
                    payees: payees,
                    payments: payments
                }
            }
        });
    }
    catch (err) {
        req.flash('errors', { msg: 'There was an error attempting to load the requested page' });
        res.redirect('/');
    }

};