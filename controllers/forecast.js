
const Payee = require('../models/Payee');
const Payment = require('../models/Payment');
const formatCurrency = require('format-currency');
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
                        if(otr) ref.add(1, 'weeks');

                        let startOfWeek = new Moment(ref).startOf('week').subtract(7 - req.user.offset, 'days');

                        if (ref.diff(startOfWeek, 'days') >= 7) {
                            startOfWeek.add(7, 'days');
                        }

                        let endOfWeek = new Moment(startOfWeek).add(6, 'days');

                        let weeklyTemplate = {
                            start: startOfWeek.format('dddd, MMMM Do YYYY'),
                            end: endOfWeek.format('dddd, MMMM Do YYYY'),
                            amountDue: 0,
                            count: 0,
                            payees: []
                        };

                        for (let i = 0; i < payees.length; i++) {

                            let diff = new Moment().diff(payees[i].ref, 'months');
                            let eventDate = new Moment(payees[i].ref).add(diff, 'months');
                            if (eventDate.isBefore(startOfWeek)) {
                                eventDate.add(1, 'month');
                            }



                            

                            // ts and te is one day before and one day after so dates fall in between
                            let ts = new Moment(startOfWeek).subtract(1, 'day');
                            let te = new Moment(endOfWeek).add(1, 'day');
                            if (eventDate.isBetween(ts, te)) {

                                let isPaid = payments.filter((payment) => {
                                    return payment.payee == payees[i].id && payment.ref == eventDate.format('YYYY-MM-DD');
                                });
                                
                                let payeeData = {
                                    id: payees[i].id,
                                    date: eventDate,
                                    name: payees[i].name,
                                    url: payees[i].url,
                                    description: payees[i].description,
                                    amount: payees[i].amount,
                                    isPaid: isPaid.length ? true : false
                                };

                                weeklyTemplate.payees.push(payeeData);
                                weeklyTemplate.amountDue += payees[i].amount;
                                weeklyTemplate.count++;
                            }
                        }
                        weeklyTemplate['percentMonth'] = (weeklyTemplate.amountDue / monthlyTotal) * 100;

                        weekly.push(weeklyTemplate);


                    }

                    res.render('forecast/weekly', {
                        title: 'Forecast',
                        monthlyTotal: monthlyTotal,
                        weeks: weekly
                    });
                
                });

        });



};