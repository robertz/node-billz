/* global require exports next */
/* eslint no-unused-vars: off */
const Payee = require('../models/Payee');
const Payment = require('../models/Payment');

const per_page = 10;

exports.getView = async (req, res) => {

    const getPayees = () => {
        return Payee.find({ owner: req.user.id })
            .cache(0, req.user.id + '__payees')
            .then((payees) => {
                return payees;
            });
    };

    const getPayments = () => {
        let page = req.params.page || 1;
        let offset = (page - 1) * per_page;
        return Payment.find({ owner: req.user.id })
            .sort({ ref: -1 })
            .skip(offset)
            .limit(per_page)
            .then((payments) => {
                return payments;
            });
    };

    const getTotalPayments = () => {
        return Payment.count({ owner: req.user.id });
    };

    try{
        let payees = await getPayees();
        let payments = await getPayments();
        let totalPayments = await getTotalPayments();

        // Stub out the page payload
        let data = {
            currentPage: req.params.page || 1,
            totalPages: Math.ceil(totalPayments / per_page),
            previousPage: 1,
            nextPage: 1,
            pageSpread: [],
            payments: []
        };
        
        data.previousPage = data.currentPage > 1 ? data.currentPage * 1 - 1 : 1;
        data.nextPage = data.currentPage < data.totalPages ? data.currentPage * 1 + 1 : data.totalPages;

        if (data.totalPages < 10) {
            for (let i = 0; i < data.totalPages; i++) {
                data.pageSpread.push(i + 1);
            }
        }

        for (let payment of payments) {

            // Get some information about the payee.. Should always exist
            let payeeName = payees.filter((payee) => {
                return payee.id === payment.payee;
            });

            // Push payment to payment array
            data.payments.push({
                name: payeeName[0].name,
                payee: payment.payee,
                ref: payment.ref,
                createdAt: payment.createdAt,
                amount: payment.amount
            });
        }

        // Render it
        res.render('payments/index', {
            title: 'Payments',
            data: data
        });
    }
    catch (err) {
        req.flash('error', { msg: 'There was an error attempting to load the requested page' });
        res.redirect('/');
    }

};

exports.getVue = async (req, res) => {
    let data = {
        userid: req.user.id
    }

    res.render('payments/vue', {
        title: 'Payments Test',
        data: data
    })
};