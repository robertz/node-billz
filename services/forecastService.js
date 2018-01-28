/* global require exports next */
/* eslint no-unused-vars: off */
const Payee = require("../models/Payee");
const Payment = require("../models/Payment");
const Moment = require("moment-timezone");
const _ = require("lodash");

// Forecast a week
exports.forecastWeek = async (userid, offset, dt) => {

    const getPayees = () => {
        return Payee.find({ owner: userid })
            .sort({ day: 1 })
            .cache(0, userid + '__payees')
            .then((payees) => {
                return payees;
            });
    };

    const getPayments = () => {
        return Payment.find({ owner: userid })
            .sort({ ref: -1 })
            .cache(0, userid + "__payments")
            .then(payments => {
                return payments;
            });
    };

    let payees = await getPayees();
    let payments = await getPayments();
    let ref = new Moment(dt);

    // adjust the start of the week to the user offset.. 0 = Sunday 6 = Saturday
    let startOfWeek = new Moment(ref).startOf("week").subtract(7 - offset, "days");
    // Compensate for offset logic going too far back
    if (ref.diff(startOfWeek, "days") >= 7) {
        startOfWeek.add(7, "days");
    }
    let endOfWeek = new Moment(startOfWeek).add(6, "days");

    // The data structure for one week of bills
    let data = {
        timing: {
            startOfWeek: startOfWeek,
            endOfWeek: endOfWeek
        },
        stats: {
            count: 0,
            amountDue: 0,
            amountPaid: 0,
            amountRemaining: 0,
            percentMonth: 0,
            percentWeek: 0,
            percentRemain: 0,
            monthlyTotal: payees.reduce((acc, payee) => acc + payee.amount, 0)
        },
        graph: {
            dailyGraph: false,
            dailyCalculated: [0, 0, 0, 0, 0, 0, 0],
            dailyActual: [0, 0, 0, 0, 0, 0, 0],
            dailyOrder: []
        },
        payees: [],
        hasPayees: payees.length ? true : false
    };

    for( let d = 0; d < 7; d++) {
        data.graph.dailyOrder[d] =  new Moment(startOfWeek).add(d, "days").format('D');
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

            // Hide occurences of payees before its ref date AND the payee is ACTIVE OR
            // there is a payment for the current period. Payee data may be required for 
            // historical reasons

            if( (eventDate.isAfter(new Moment(payees[i].ref)) || eventDate.isSame(new Moment(payees[i].ref)) ) && (payees[i].active || isPaid.length) ){

                // Stub out the payment information for the page
                let payeeData = { 
                    id: payees[i].id, 
                    date: eventDate, 
                    name: payees[i].name, 
                    url: payees[i].url, 
                    description: payees[i].description, 
                    amount: payees[i].amount,
                    apr: payees[i].apr,
                    autopay: payees[i].autopay,
                    isPaid: false 
                };

                // Calculate the daily caclulated values
                data.graph.dailyCalculated[ data.graph.dailyOrder.indexOf(eventDate.format('D')) ] += payees[i].amount.toFixed(2) * 1;

                // If the bill is paid, mark the payee and add the amount
                if (isPaid.length) {
                    payeeData.isPaid = true;
                    let payeeAmount = isPaid.reduce((acc, payment) => acc + payment.amount, 0).toFixed(2) * 1;
                    data.stats.amountPaid += payeeAmount;
                    // Calculate the daily actual values
                    data.graph.dailyActual[ data.graph.dailyOrder.indexOf(eventDate.format('D')) ] += payeeAmount * 1;
                }

                // Push the current payee info into the payee array
                data.payees.push(payeeData);
                data.stats.amountDue += payees[i].amount;
            }

        }
    }

    // Handle summing things up for the current week
    data.stats.amountDue.count = data.payees.length;
    data.stats.percentMonth = data.stats.amountDue / data.stats.monthlyTotal * 100;
    if (data.stats.amountDue) {
        data.stats.percentWeek = data.stats.amountPaid / data.stats.amountDue * 100;
    }

    data.stats.amountRemain = data.stats.amountDue - data.stats.amountPaid;
    data.stats.percentRemain = data.stats.amountRemain / data.stats.amountDue * 100;

    // If amount remaining goes negative (paid over the monthly calculation)
    if (data.stats.amountRemain < 0) {
        data.stats.amountRemain = 0;
        data.stats.percentRemain = 0;
    }
    
    // Dates do not always sort correctly. Fix fix the issue
    data.payees = _.sortBy(data.payees, (payee) => {return new Moment(payee.date);});
    return data;
};

// Forecast a month
exports.forecastMonth = async (userid, offset, dt) => {

    const getPayees = () => {
        return Payee.find({ owner: userid })
            .sort({ day: 1 })
            .cache(0, userid + '__payees')
            .then((payees) => {
                return payees;
            });
    };

    const getPayments = () => {
        return Payment.find({ owner: userid })
            .sort({ ref: -1 })
            .cache(0, userid + "__payments")
            .then(payments => {
                return payments;
            });
    };

    let payees = await getPayees();
    let payments = await getPayments();

    // Stub out the payload for the page
    let data = {
        timing: {
            startOfWeek: null,
            endOfWeek: null,
            startOfMonth: null,
            endOfMonth: null
        },
        stats: {
            monthlyTotal: payees.reduce((acc, payee) => acc + payee.amount, 0),
            amountPaid: 0,
            amountRemaining: 0,
            pctPaid: 0,
            pctRemain: 0
        },
        graph: {
            labels: [],
            actual: [],
            calculated: []
        },
        payees: [],
        nextMonth: null,
        prevMonth: null,
        hasPayees: payees.length ? true : false
    };

    // Calculate the range for the current week
    // adjust the start of the week to the user offset.. 0 = Sunday 6 = Saturday
    data.timing.startOfWeek = new Moment().startOf('week').subtract(7 - offset, 'days');
    // Compensate for offset logic going too far back
    if (new Moment().diff(data.timing.startOfWeek, 'days') >= 7) {
        data.timing.startOfWeek.add(7, 'days');
    }
    data.timing.endOfWeek = new Moment(data.timing.startOfWeek).add(6, 'days');
    // ts and te is one day before and one day after so dates fall in between
    let ts = new Moment(data.timing.startOfWeek).subtract(1, 'day');
    let te = new Moment(data.timing.endOfWeek).add(1, 'day');
    // End of week calcs

    data.timing.startOfMonth = new Moment(dt).startOf('month');
    data.timing.endOfMonth = new Moment(data.timing.startOfMonth).endOf('month');

    data.prevMonth = new Moment(data.timing.startOfMonth).subtract(1, 'month').format('YYYY-MM-DD');
    data.nextMonth = new Moment(data.timing.startOfMonth).add(1, 'month').format('YYYY-MM-DD');

    // Build graph data
    let monthlyPayments = payments.filter((payment) => {
        return payment.ref.indexOf(new Moment(dt).format("YYYY-MM")) === 0 ? true : false;
    });
    // Default graph values for the month
    for (let i = 0; i < data.timing.startOfMonth.daysInMonth(); i++) {
        data.graph.labels[i] = i + 1;
        data.graph.actual[i] = 0;
        data.graph.calculated[i] = 0;
    }
    // Build actual daily expenditure amounts for graph
    for (let payment of monthlyPayments) {
        let ndx = new Moment(payment.ref).format("D") - 1;
        data.graph.actual[ndx] += payment.amount;
    }

    for (let i = 0; i < payees.length; i++) {

        // How many months to add to bring the reference date to the current month
        let diff = new Moment(dt).diff(payees[i].ref, 'months');
        let eventDate = new Moment(payees[i].ref).add(diff, 'months');
        if (eventDate.isBefore(data.timing.startOfMonth)) {
            eventDate.add(1, 'month');
        }

        // Is the current payee/payment ref found in the payment list
        let isPaid = payments.filter((payment) => {
            return payment.payee == payees[i].id && payment.ref == eventDate.format('YYYY-MM-DD');
        });

        // Hide occurences of payees before its ref date AND the payee is ACTIVE OR
        // there is a payment for the current period. Payee data may be required for 
        // historical reasons

        if( (eventDate.isAfter(new Moment(payees[i].ref)) || eventDate.isSame(new Moment(payees[i].ref)) ) && (payees[i].active || isPaid.length) ){

            // Stub out the payment information for the page
            let payeeData = {
                id: payees[i].id,
                date: eventDate,
                name: payees[i].name,
                url: payees[i].url,
                description: payees[i].description,
                amount: payees[i].amount,
                apr: payees[i].apr,
                autopay: payees[i].autopay,
                currentWeek: eventDate.isBetween(ts, te) ? true : false,
                isToday: eventDate.startOf('day').isSame(new Moment().startOf('day')) ? true : false,
                isPaid: false
            };

            // If the bill is paid, mark the payee and add the amount
            if (isPaid.length) {
                payeeData.isPaid = true;
                data.stats.amountPaid += isPaid.reduce((acc, payment) => acc + payment.amount, 0);
            }

            // Build calculated daily expenditure amounts graph data
            data.graph.calculated[eventDate.format("D") - 1] += payees[i].amount;

            // Push the current payee info into the payee array
            data.payees.push(payeeData);
        }

    }

    data.stats.amountRemaining = data.stats.monthlyTotal ? data.stats.monthlyTotal - data.stats.amountPaid : 0;
    // Avoid divide by 0 issues
    data.stats.pctPaid = data.stats.monthlyTotal ? (data.stats.amountPaid / data.stats.monthlyTotal) * 100 : 0;
    data.stats.pctRemain = data.stats.monthlyTotal ? (data.stats.amountRemaining / data.stats.monthlyTotal) * 100 : 0;

    // If amount remaining goes negative (paid over the monthly calculation) 
    if (data.stats.amountRemaining < 0) {
        data.stats.amountRemaining = 0;
        data.stats.pctRemain = 0;
    }

    return data;
};