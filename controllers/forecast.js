
const Payee = require('../models/Payee');
const formatCurrency = require('format-currency');
const AnalyticService = require('../services/analyticService');
const Moment = require('moment');

exports.getIndex = (req, res) => {
    Payee
        .find({ owner: req.user.id }, null, { }, (err, payees) => {

            if (err) { return next(err); }
            let ref = new Moment();
            let weekly = [];

            for(let otr = 0; otr < 4; otr++){
                if(otr) ref.add(1, 'weeks');

                let startOfWeek = new Moment(ref).startOf('week').subtract(7 - 5, 'days');

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
                    // One day before start
                    let ts = new Moment(startOfWeek).subtract(1, 'day');
                    let te = new Moment(endOfWeek).add(1, 'day');

                    if (eventDate.isBetween(ts, te)) {
                        weeklyTemplate.payees.push(payees[i]);
                        weeklyTemplate.amountDue += payees[i].amount;
                        weeklyTemplate.count++;
                    }
                }

                weekly.push(weeklyTemplate);


            }

            console.dir(weekly);

            res.render('forecast/weekly', {
                title: 'Forecast',
                // startOfWeek: startOfWeek.format('dddd MMMM Do YYYY'),
                // endOfWeek: endOfWeek.format('dddd MMMM Do YYYY'),
                weeks: weekly
            });

        });



};