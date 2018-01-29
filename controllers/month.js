/* global require exports next */
/* eslint no-unused-vars: off */
const forecastService = require('../services/forecastService');
const Moment = require("moment-timezone");

exports.getIndex = async (req, res) => {

    try {

        // if dt is passed in the url attempt to set the date
        let ref = new Moment().tz(req.user.tz);
        if (new Moment(req.query.dt).isValid()) ref = new Moment(req.query.dt).tz(req.user.tz);

        let data = await forecastService.forecastMonth(req.user.id, req.user.offset, ref);

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
