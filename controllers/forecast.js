
const Payee = require('../models/Payee');
const formatCurrency = require('format-currency');
const AnalyticService = require('../services/analyticService');
const Moment = require('moment');

exports.getIndex = (req, res) => {
    var now = new Moment();

    Payee
        .find({ owner: req.user._id }, null, { sort: { due: 1 } }, (err, payees) => {

            if (err) { return next(err); }

            let startOfWeek = new Moment().startOf('week');
            let endOfWeek = new Moment().endOf('week');
            
            let weekly = [];

            for (payee in payees) {
                let endOfMonth = new Moment().endOf('month').format('D');
                let correct = payee.due > endOfMonth ? endOfMonth : payee.due;
                let eventDate = new Moment()
                    .set({
                        'year': correct < startOfWeek.format('D') ? endOfWeek.format('YYYY') : startOfWeek.format('YYYY'),
                        'month': correct < startOfWeek.format('D') ? endOfWeek.format('M') : startOfWeek.format('M'),
                        'date': correct
                    });

                console.log(eventDate.format('M/D/YYYY'));
            }

            // for (let i = 0; i < 4; i++) {

            //     let p = payees.filter((elem, index, arr) => elem.due > startOfWeek.format('D') && elem.due < endOfWeek.format('D') && elem.active && !elem.deleted);

            //     weekly.push({
            //         start: startOfWeek.format('dddd MMMM Do YYYY'),
            //         end: endOfWeek.format('dddd MMMM Do YYYY'),
            //         payees: p
            //     });

            //     startOfWeek.add(1, 'week');
            //     endOfWeek.add(1, 'week');
            // }


            res.render('forecast/weekly', {
                title: 'Forecast',
                startOfWeek: startOfWeek.format('dddd MMMM Do YYYY, h:mm:ss a'),
                endOfWeek: endOfWeek.format('dddd MMMM Do YYYY, h:mm:ss a'),
                weeks: []
            });

        });



};