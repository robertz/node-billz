
const Payee = require('../models/Payee');
const formatCurrency = require('format-currency');
const Moment = require('moment');

exports.getIndex = (req, res) => {
    Payee
        .find({ owner: req.user.id }, null, { }, (err, payees) => {

            if (err) { return next(err); }
            let ref = new Moment();
            let weekly = [];

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
                    let diff = new Moment().diff(payees[i].ref, "months");
                    let eventDate = new Moment(payees[i].ref).add(diff, 'months');
                    if (eventDate.isBefore(startOfWeek)) {
                        eventDate.add(1, 'month');
                    }

                    // ts and te is one day before and one day after so dates fall in between
                    let ts = new Moment(startOfWeek).subtract(1, 'day');
                    let te = new Moment(endOfWeek).add(1, 'day');
                    if (eventDate.isBetween(ts, te)) {
                        let payeeData = {
                            date: eventDate,
                            name: payees[i].name,
                            amount: payees[i].amount
                        };
                        weeklyTemplate.payees.push(payeeData);
                        weeklyTemplate.amountDue += payees[i].amount;
                        weeklyTemplate.count++;
                    }
                }

                weekly.push(weeklyTemplate);


            }

            res.render('forecast/weekly', {
                title: 'Forecast',
                // startOfWeek: startOfWeek.format('dddd MMMM Do YYYY'),
                // endOfWeek: endOfWeek.format('dddd MMMM Do YYYY'),
                weeks: weekly
            });

        });



};