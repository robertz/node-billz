
const Payee = require('../models/Payee');
const Payment = require('../models/Payment');
const Moment = require('moment-timezone');

exports.getIndex = (req, res) => {
    Payee
        .find({ owner: req.user._id }, null, { sort: { ref: 1 } }, (err, payees) => {

            if (err) { return next(err); }
            Payment
                .find({ owner: req.user._id }, null, { sort: { ref: 1 } }, (err, payments) => {

                    if (err) { return next(err); }
                    let ref = new Moment();
                    let weekly = [];
                    let monthlyTotal = payees.reduce((acc, payee) => acc + payee.amount, 0);

                    for(let otr = 0; otr < 4; otr++){
                        // Add 1 week to the reference date if it is not the initial week
                        if(otr) ref.add(1, 'weeks');

                        // adjust the start of the week to the user offset.. 0 = Sunday 6 = Saturday
                        let startOfWeek = new Moment(ref).startOf('week').subtract(7 - req.user.offset, 'days');

                        // Adjust the startOfWeek in cases where it is adjusted too far back
                        if (ref.diff(startOfWeek, 'days') >= 7) {
                            startOfWeek.add(7, 'days');
                        }
                        let endOfWeek = new Moment(startOfWeek).add(6, 'days');

                        // The data structure for one week of bills
                        let weeklyTemplate = {
                            start: startOfWeek.format('dddd, MMMM Do YYYY'),
                            end: endOfWeek.format('dddd, MMMM Do YYYY'),
                            amountDue: 0,
                            amountPaid: 0,
                            count: 0,
                            percentMonth: 0,
                            percentWeek: 0,
                            payees: []
                        };

                        for (let i = 0; i < payees.length; i++) {

                            // How many months to add to bring the reference date to the current month
                            let diff = new Moment().diff(payees[i].ref, 'months');
                            let eventDate = new Moment(payees[i].ref).add(diff, 'months');
                            if (eventDate.isBefore(startOfWeek)) {
                                eventDate.add(1, 'month');
                            }
                            // ts and te is one day before and one day after so dates fall in between
                            let ts = new Moment(startOfWeek).subtract(1, 'day');
                            let te = new Moment(endOfWeek).add(1, 'day');
                            if (eventDate.isBetween(ts, te)) {

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
                                    isPaid: false
                                };

                                // If the bill is paid, mark the payee and add the amount
                                if (isPaid.length) {
                                    payeeData.isPaid = true;
                                    weeklyTemplate.amountPaid += isPaid[0].amount;
                                }

                                // Push the current payee info into the payee array
                                weeklyTemplate.payees.push(payeeData);
                                weeklyTemplate.amountDue += payees[i].amount;
                            }
                        }

                        // Handle summing things up for the current week
                        weeklyTemplate.count = weeklyTemplate.payees.length;
                        weeklyTemplate.percentMonth = (weeklyTemplate.amountDue / monthlyTotal) * 100;
                        if (weeklyTemplate.amountDue) {
                            weeklyTemplate.percentWeek = (weeklyTemplate.amountPaid / weeklyTemplate.amountDue) * 100;
                        }

                        // Push the current week info into the weekly array used by the forecast template
                        weekly.push(weeklyTemplate);

                    }

                    // Render it
                    res.render('forecast/weekly', {
                        title: 'Forecast',
                        monthlyTotal: monthlyTotal,
                        weeks: weekly
                    });
                
                });

        });



};