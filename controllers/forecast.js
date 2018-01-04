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
            .cache(0, req.user.id + '__payees')
            .then((payees) => {
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

    try{
        let payees = await getPayees();
        let payments = await getPayments();

        // if dt is passed in the url attempt to set the date
        let ref = new Moment();
        if (new Moment(req.query.dt).isValid()) ref = new Moment(req.query.dt);

        let weekly = [];
        let monthlyTotal = payees.reduce((acc, payee) => acc + payee.amount, 0);

        for (let otr = 0; otr < 4; otr++) {
            // Add 1 week to the reference date if it is not the initial week
            if (otr) ref.add(1, "week");

            // adjust the start of the week to the user offset.. 0 = Sunday 6 = Saturday
            let startOfWeek = new Moment(ref).startOf("week").subtract(7 - req.user.offset, "days");
            // Compensate for offset logic going too far back
            if (ref.diff(startOfWeek, "days") >= 7) {
                startOfWeek.add(7, "days");
            }
            let endOfWeek = new Moment(startOfWeek).add(6, "days");

            // The data structure for one week of bills
            let weeklyTemplate = { 
                start: startOfWeek, 
                end: endOfWeek, 
                amountDue: 0, 
                amountPaid: 0, 
                amountRemain: 0, 
                count: 0, 
                percentMonth: 0, 
                percentWeek: 0, 
                percentRemain: 0, 
                payees: [],
                dailyGraph: otr === 0 ? true : false,
                dailyCalculated: [0, 0, 0, 0, 0, 0, 0],
                dailyActual: [0, 0, 0, 0, 0, 0, 0],
                dailyOrder: []
            };

            for( let d = 0; d < 7; d++) {
                weeklyTemplate.dailyOrder[d] =  new Moment(startOfWeek).add(d, "days").format('D');
            }

            for (let i = 0; i < payees.length; i++) {
                // How many months to add to bring the reference date to the current month
                let diff = new Moment(ref).diff(payees[i].ref, "months");
                let eventDate = new Moment(payees[i].ref).add(diff, "months");
                if (eventDate.isBefore(startOfWeek)) {
                    eventDate.add(1, "month");
                }
                // ts and te is one day before and one day after so dates fall in between
                let ts = new Moment(startOfWeek).subtract(1, "day");
                let te = new Moment(endOfWeek).add(1, "day");
                if (eventDate.isBetween(ts, te)) {
                    // Is the current payee/payment ref found in the payment list
                    let isPaid = payments.filter((payment) => {
                        return (payment.payee == payees[i].id && payment.ref == eventDate.format("YYYY-MM-DD"));
                    });

                    // Stub out the payment information for the page
                    let payeeData = { 
                        id: payees[i].id, 
                        date: eventDate, 
                        name: payees[i].name, 
                        url: payees[i].url, 
                        description: payees[i].description, 
                        amount: payees[i].amount, 
                        isPaid: false 
                    };

                    // Calculate the daily caclulated values
                    weeklyTemplate.dailyCalculated[ weeklyTemplate.dailyOrder.indexOf(eventDate.format('D')) ] += payees[i].amount.toFixed(2) * 1;

                    // If the bill is paid, mark the payee and add the amount
                    if (isPaid.length) {
                        payeeData.isPaid = true;
                        let payeeAmount = isPaid.reduce((acc, payment) => acc + payment.amount, 0).toFixed(2) * 1;
                        weeklyTemplate.amountPaid += payeeAmount;
                        // Calculate the daily actual values
                        weeklyTemplate.dailyActual[ weeklyTemplate.dailyOrder.indexOf(eventDate.format('D')) ] += payeeAmount * 1;
                    }

                    // Push the current payee info into the payee array
                    weeklyTemplate.payees.push(payeeData);
                    weeklyTemplate.amountDue += payees[i].amount;
                }
            }

            // Handle summing things up for the current week
            weeklyTemplate.count = weeklyTemplate.payees.length;
            weeklyTemplate.percentMonth = weeklyTemplate.amountDue / monthlyTotal * 100;
            if (weeklyTemplate.amountDue) {
                weeklyTemplate.percentWeek = weeklyTemplate.amountPaid / weeklyTemplate.amountDue * 100;
            }

            weeklyTemplate.amountRemain = weeklyTemplate.amountDue - weeklyTemplate.amountPaid;
            weeklyTemplate.percentRemain = weeklyTemplate.amountRemain / weeklyTemplate.amountDue * 100;

            // If amount remaining goes negative (paid over the monthly calculation)
            if (weeklyTemplate.amountRemain < 0) {
                weeklyTemplate.amountRemain = 0;
                weeklyTemplate.percentRemain = 0;
            }
            
            // Dates do not always sort correctly. Fix fix the issue
            weeklyTemplate.payees = _.sortBy(weeklyTemplate.payees, (payee) => {return new Moment(payee.date);});

            // Push the current week info into the weekly array used by the forecast template
            weekly.push(weeklyTemplate);
        }

        // Render it
        res.render('forecast/index', {
            title: 'Forecast',
            monthlyTotal: monthlyTotal,
            previousWeek: new Moment(weekly[0].start).subtract(1, "week").format("YYYY-MM-DD"),
            nextWeek: new Moment(weekly[0].end).add(1, "day").format("YYYY-MM-DD"),
            weeks: weekly
        });
    }
    catch (err) {
        console.dir(err);
        req.flash('errors', { msg: 'There was an error attempting to load the requested page' });
        res.redirect('/');
    }

};
