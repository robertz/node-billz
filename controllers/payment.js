/* global require exports next */
/* eslint no-unused-vars: off */
const Payee = require('../models/Payee');
const Payment = require('../models/Payment');

exports.getView = async (req, res) => {

    const getPayees = () => {
        return Payee.find({ owner: req.user.id })
            .then((payees) => {
                return payees;
            });
    };

    const getPayments = () => {
        return Payment.find({ owner: req.user.id })
            .sort({ ref: -1 })
            .then((payments) => {
                return payments;
            });
    };

    try{
        let payees = await getPayees();
        let payments = await getPayments();

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
    }
    catch (err) {
        req.flash('error', { msg: 'There was an error attempting to load the requested page' });
        res.redirect('/');
    }

};