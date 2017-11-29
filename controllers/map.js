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
        .then(payees => {
            return payees;
        });
    };

    const getPayments = () => {
        return Payment.find({ owner: req.user.id })
        .sort({ ref: -1 })
        .then(payments => {
            return payments;
        });
    };

    let payees = await getPayees();
    let payments = await getPayments();


    // if dt is passed in the url attempt to set the date
    let ref = new Moment();
    if (new Moment(req.query.dt).isValid()) ref = new Moment(req.query.dt);


    let data = {
        'labels': [],
        'amounts': [],
        'calculated': []
    }

    let thisMonth = payments.filter((payment) => {
        return payment.ref.indexOf( new Moment(ref).format('YYYY-MM') ) === 0 ? true : false;
    });


    for (let i = 0; i < new Moment(ref).daysInMonth(); i++) {
        data.labels[i] = i + 1;
        data.amounts[i] = 0;
        data.calculated[i] = 0;
    }

    for (let payment of thisMonth) {
        let ndx = new Moment(payment.ref).format('D') - 1;
        data.amounts[ndx] += payment.amount;
    }

    for (let i = 0; i < payees.length; i++) {

        // How many months to add to bring the reference date to the current month
        let diff = new Moment(ref).diff(payees[i].ref, 'months');
        let eventDate = new Moment(payees[i].ref).add(diff, 'months');
        if (eventDate.isBefore( new Moment(ref).startOf("month") )) {
          eventDate.add(1, "month");
        }

        data.calculated[ eventDate.format('D') - 1 ] += payees[i].amount;

    }

    // Render it
    res.render('map/index', {
        title: 'Map',
        data: data
    });

};