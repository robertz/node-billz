/* global require exports next */
/* eslint no-unused-vars: off */
const Payee = require('../models/Payee');
const Payment = require('../models/Payment');
const Moment = require('moment-timezone');


exports.getIndex = async (req, res) => {

    const getPayees = () => {
        return Payee.find({ owner: req.user.id })
            .sort({ day: 1 })
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

    try {
        let payees = await getPayees();
        let payments = await getPayments();

        let monthData = [];

        // if dt is passed in the url attempt to set the date
        let ref = new Moment();
        if (new Moment(req.query.dt).isValid()) ref = new Moment(req.query.dt);

        

        // Calculate the range for the current week
        // adjust the start of the week to the user offset.. 0 = Sunday 6 = Saturday
        let startOfWeek = new Moment(ref).startOf('week').subtract(7 - req.user.offset, 'days');
        // Compensate for offset logic going too far back
        if (ref.diff(startOfWeek, 'days') >= 7) {
            startOfWeek.add(7, 'days');
        }
        let endOfWeek = new Moment(startOfWeek).add(6, 'days');
        // ts and te is one day before and one day after so dates fall in between
        let ts = new Moment(startOfWeek).subtract(1, 'day');
        let te = new Moment(endOfWeek).add(1, 'day');

        // End of week calcs


        let monthlyTotal = payees.reduce((acc, payee) => acc + payee.amount, 0);
        let amountPaid = 0;

        let startOfMonth = new Moment(ref).startOf('month');
        let endOfMonth = new Moment(startOfMonth).endOf('month');

        for (let i = 0; i < payees.length; i++) {

            // How many months to add to bring the reference date to the current month
            let diff = new Moment(ref).diff(payees[i].ref, 'months');
            let eventDate = new Moment(payees[i].ref).add(diff, 'months');
            if (eventDate.isBefore(startOfMonth)) {
                eventDate.add(1, 'month');
            }

            // Is the current payee/payment ref found in the payment list
            let isPaid = payments.filter((payment) => {
                return payment.payee == payees[i].id && payment.ref == eventDate.format('YYYY-MM-DD');
            });

            // Stub out the payment information for the page
            let payeeData = {
                id: payees[i].id,
                date: eventDate,
                name: payees[i].name,
                url: payees[i].url,
                description: payees[i].description,
                amount: payees[i].amount,
                currentWeek: eventDate.isBetween(ts, te) ? true : false,
                isToday: eventDate.startOf('day').isSame(new Moment().startOf('day')) ? true : false,
                isPaid: false
            };

            // If the bill is paid, mark the payee and add the amount
            if (isPaid.length) {
                payeeData.isPaid = true;
                amountPaid += isPaid[0].amount;
            }

            // Push the current payee info into the payee array
            monthData.push(payeeData);
        }

        let amountRemaining = monthlyTotal ? monthlyTotal - amountPaid : 0;
        // Avoid divide by 0 issues
        let pctPaid = monthlyTotal ? (amountPaid / monthlyTotal) * 100 : 0;
        let pctRemain = monthlyTotal ? (amountRemaining / monthlyTotal) * 100 : 0;

        // Render it
        res.render('month/view', {
            title: 'Month',
            startOfMonth: startOfMonth,
            endOfMonth: endOfMonth,
            monthlyTotal: monthlyTotal,
            amountPaid: amountPaid,
            pctPaid: pctPaid,
            amountRemaining: amountRemaining,
            pctRemain: pctRemain,
            payees: monthData
        });
    }
    catch (err) {
        req.flash('errors', { msg: 'There was an error attempting to load the requested page' });
        res.redirect('/');
    }

};
