/* global require exports next */
/* eslint no-unused-vars: off */
const Payee = require("../models/Payee");
const Payment = require("../models/Payment");
const Moment = require("moment-timezone");
const _ = require("lodash");

// Forecast a week
exports.forecastWeek = async (userid, offset, dt) => {

    console.log(`offset: ${offset}`)
    
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
    let template = {
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
        payees: []
    };

    for( let d = 0; d < 7; d++) {
        template.graph.dailyOrder[d] =  new Moment(startOfWeek).add(d, "days").format('D');
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
                template.graph.dailyCalculated[ template.graph.dailyOrder.indexOf(eventDate.format('D')) ] += payees[i].amount.toFixed(2) * 1;

                // If the bill is paid, mark the payee and add the amount
                if (isPaid.length) {
                    payeeData.isPaid = true;
                    let payeeAmount = isPaid.reduce((acc, payment) => acc + payment.amount, 0).toFixed(2) * 1;
                    template.stats.amountPaid += payeeAmount;
                    // Calculate the daily actual values
                    template.graph.dailyActual[ template.graph.dailyOrder.indexOf(eventDate.format('D')) ] += payeeAmount * 1;
                }

                // Push the current payee info into the payee array
                template.payees.push(payeeData);
                template.stats.amountDue += payees[i].amount;
            }

        }
    }

    // Handle summing things up for the current week
    template.stats.amountDue.count = template.payees.length;
    template.stats.percentMonth = template.stats.amountDue / template.stats.monthlyTotal * 100;
    if (template.stats.amountDue) {
        template.stats.percentWeek = template.stats.amountPaid / template.stats.amountDue * 100;
    }

    template.stats.amountRemain = template.stats.amountDue - template.stats.amountPaid;
    template.stats.percentRemain = template.stats.amountRemain / template.stats.amountDue * 100;

    // If amount remaining goes negative (paid over the monthly calculation)
    if (template.stats.amountRemain < 0) {
        template.stats.amountRemain = 0;
        template.stats.percentRemain = 0;
    }
    
    // Dates do not always sort correctly. Fix fix the issue
    template.payees = _.sortBy(template.payees, (payee) => {return new Moment(payee.date);});
    return template;
};
