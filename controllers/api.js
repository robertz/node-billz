/* global require exports next */
/* eslint no-unused-vars: off */
const Payee = require("../models/Payee");
const Payments = require("../models/Payment");

exports.getPayees = async (req, res) => {
    return Payee.find({ owner: req.params.userid })
        .sort({ day: 1 })
        .cache(0, req.params.userid + "__payees")
        .then(payees => {
            res.json(payees);
        });
}

exports.getPayee = async (req, res) => {
    return Payee.findOne({ owner: req.params.userid, _id: req.params.payeeid })
        .then(payee => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "X-Requested-With");
            res.json(payee);
        })
};

exports.getPayments = async (req, res) => {
    return Payments.find({ owner: req.params.userid })
        .sort({ ref: -1 })
        .cache(0, req.params.userid + "__payments")
        .then(payments => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "X-Requested-With");
            res.json(payments);
        })
}

exports.getPayeePayments = async (req, res) => {
    return Payments.find({ owner: req.params.userid, payee: req.params.payeeid })
        .sort({ ref: -1 })
        .then(payments => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "X-Requested-With");
            res.json(payments);
        });
};