/* global require exports next */
/* eslint no-unused-vars: off */
const forecastService = require('../services/forecastService');
const Moment = require('moment-timezone');

exports.getIndex = async (req, res) => {

    try {
        // if dt is passed in the url attempt to set the date
        let ref = new Moment().tz(req.user.tz);
        if (new Moment(req.query.dt).isValid()) ref = new Moment(req.query.dt).tz(req.user.tz);

        let weekly = [];
        for (let otr = 0; otr < 4; otr++) {
            // Add 1 week to the reference date if it is not the initial week
            if (otr) ref.add(1, "week");
            weekly.push(await forecastService.forecastWeek(req.user.id, req.user.offset, req.user.tz, ref));
        }
        // display graph for the first week
        weekly[0].graph.dailyGraph = true;
        // Render it
        res.render('forecast/index', {
            title: 'Forecast',
            weeks: weekly
        });
    }
    catch (err) {
        req.flash('errors', { msg: 'There was an error attempting to load the requested page' });
        res.redirect('/');
    }

};
