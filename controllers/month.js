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

        // Stub out the payload for the page
        let data = {
            timing: {
                startOfWeek: null,
                endOfWeek: null,
                startOfMonth: null,
                endOfMonth: null
            },
            stats: {
                monthlyTotal: payees.reduce((acc, payee) => acc + payee.amount, 0),
                amountPaid: 0,
                amountRemaining: 0,
                pctPaid: 0,
                pctRemain: 0
            },
            graph: {
                labels: [],
                actual: [],
                calculated: []
            },
            payees: [],
            nextMonth: null,
            prevMonth: null
        };

        // if dt is passed in the url attempt to set the date
        let ref = new Moment();
        if (new Moment(req.query.dt).isValid()) ref = new Moment(req.query.dt);

        // Calculate the range for the current week
        // adjust the start of the week to the user offset.. 0 = Sunday 6 = Saturday
        data.timing.startOfWeek = new Moment(ref).startOf('week').subtract(7 - req.user.offset, 'days');
        // Compensate for offset logic going too far back
        if (ref.diff(data.timing.startOfWeek, 'days') >= 7) {
            data.timing.startOfWeek.add(7, 'days');
        }
        data.timing.endOfWeek = new Moment(data.timing.startOfWeek).add(6, 'days');
        // ts and te is one day before and one day after so dates fall in between
        let ts = new Moment(data.timing.startOfWeek).subtract(1, 'day');
        let te = new Moment(data.timing.endOfWeek).add(1, 'day');
        // End of week calcs

        data.timing.startOfMonth = new Moment(ref).startOf('month');
        data.timing.endOfMonth = new Moment(data.timing.startOfMonth).endOf('month');

        data.prevMonth = new Moment(data.timing.startOfMonth).subtract(1, 'month').format('YYYY-MM-DD');
        data.nextMonth = new Moment(data.timing.startOfMonth).add(1, 'month').format('YYYY-MM-DD');

        // Build graph data
        let monthlyPayments = payments.filter((payment) => {
            return payment.ref.indexOf(new Moment(ref).format("YYYY-MM")) === 0 ? true : false;
        });
        // Default graph values for the month
        for (let i = 0; i < data.timing.startOfMonth.daysInMonth(); i++) {
            data.graph.labels[i] = i + 1;
            data.graph.actual[i] = 0;
            data.graph.calculated[i] = 0;
        }
        // Build actual daily expenditure amounts for graph
        for (let payment of monthlyPayments) {
            let ndx = new Moment(payment.ref).format("D") - 1;
            data.graph.actual[ndx] += payment.amount;
        }

        for (let i = 0; i < payees.length; i++) {

            // How many months to add to bring the reference date to the current month
            let diff = new Moment(ref).diff(payees[i].ref, 'months');
            let eventDate = new Moment(payees[i].ref).add(diff, 'months');
            if (eventDate.isBefore(data.timing.startOfMonth)) {
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
                data.stats.amountPaid += isPaid.reduce((acc, payment) => acc + payment.amount, 0);
            }

            // Build calculated daily expenditure amounts graph data
            data.graph.calculated[eventDate.format("D") - 1] += payees[i].amount;

            // Push the current payee info into the payee array
            data.payees.push(payeeData);
        }

        data.stats.amountRemaining = data.stats.monthlyTotal ? data.stats.monthlyTotal - data.stats.amountPaid : 0;
        // Avoid divide by 0 issues
        data.stats.pctPaid = data.stats.monthlyTotal ? (data.stats.amountPaid / data.stats.monthlyTotal) * 100 : 0;
        data.stats.pctRemain = data.stats.monthlyTotal ? (data.stats.amountRemaining / data.stats.monthlyTotal) * 100 : 0;

        // If amount remaining goes negative (paid over the monthly calculation) 
        if (data.stats.amountRemaining < 0) {
            data.stats.amountRemaining = 0;
            data.stats.pctRemain = 0;
        }

        // Render it
        res.render('month/index', {
            title: 'Month',
            data: data
        });
    }
    catch (err) {
        req.flash('errors', { msg: 'There was an error attempting to load the requested page' });
        res.redirect('/');
    }

};
