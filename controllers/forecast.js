
const Payee = require('../models/Payee');
const formatCurrency = require('format-currency');
const AnalyticService = require('../services/analyticService');
const Moment = require('moment');

exports.getIndex = (req, res) => {
    Payee
        .find({ owner: req.user.id }, null, { }, (err, payees) => {

            if (err) { return next(err); }
            let ref = new Moment();
            let startOfWeek = new Moment().startOf('week').subtract(7 - 5, 'days');

            if(ref.diff(startOfWeek, 'days') >= 7) {
                startOfWeek.add(7, 'days');
            }

            let endOfWeek = new Moment(startOfWeek).add(6, 'days');
            
            let weekly = [];

            let weeklyTemplate = {
                start: startOfWeek.format('dddd MMMM Do YYYY, h:mm:ss a'),
                end: endOfWeek.format('dddd MMMM Do YYYY, h:mm:ss a'),
                payees: []
            };

            for(var i = 0; i < payees.length; i++){
                let diff = new Moment().diff(payees[i].ref, "months");
                let eventDate = new Moment(payees[i].ref).add(diff, 'months');

                if(eventDate.isBefore(startOfWeek)){
                    eventDate.add(1, 'month');
                }
                console.dir(startOfWeek);
                console.log(`Payee: ${payees[i].name} Valid: ${eventDate.isBetween(startOfWeek, endOfWeek)}`)
                if (eventDate.isBetween(startOfWeek, endOfWeek)) {
                    weeklyTemplate.payees.push(payees[i]);
                }
            }

            weekly.push(weeklyTemplate);

            res.render('forecast/weekly', {
                title: 'Forecast',
                startOfWeek: startOfWeek.format('dddd MMMM Do YYYY, h:mm:ss a'),
                endOfWeek: endOfWeek.format('dddd MMMM Do YYYY, h:mm:ss a'),
                weeks: weekly
            });

        });



};