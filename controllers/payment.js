/* global require exports next */
/* eslint no-unused-vars: off */
const Payee = require("../models/Payee");
const Payment = require("../models/Payment");
const Moment = require("moment-timezone");

exports.getVue = async (req, res) => {
    res.render("payments/vue", {
        title: "Your payment history",
        data: {
            userid: req.user.id
        }
    });
};