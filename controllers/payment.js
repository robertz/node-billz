/* global require exports next */
/* eslint no-unused-vars: off */
const Payee = require('../models/Payee');
const Payment = require('../models/Payment');

const per_page = 10;

exports.getView = async (req, res) => {

    const getPayees = () => {
        return Payee.find({ owner: req.user.id })
            .then((payees) => {
                return payees;
            });
    };

    const getPayments = () => {
        return Payment.find({ owner: req.user.id })
            .sort({ ref: -1 })
            .then((payments) => {
                return payments;
            });
    };

    const paginate = (items, page) => {
        var page = page || 1;
        let offset = (page - 1) * per_page;
        let paginatedItems = items.slice(offset, offset + per_page);
        
        return paginatedItems;
    };

    try{
        let payees = await getPayees();
        let payments = await getPayments();

        // Stub out the page payload
        let data = {
            currentPage: req.params.page || 1,
            totalPages: Math.ceil(payments.length / per_page),
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


        let pageData = paginate(payments, data.currentPage);

        for (let payment of pageData) {

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
        res.render('payments/view', {
            title: 'Payments',
            data: data
        });
    }
    catch (err) {
        req.flash('error', { msg: 'There was an error attempting to load the requested page' });
        res.redirect('/');
    }

};