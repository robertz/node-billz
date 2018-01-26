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
            res.json(payee);
        })
};

exports.getPayments = async (req, res) => {
    return Payments.find({ owner: req.params.userid })
        .sort({ ref: -1 })
        .cache(0, req.params.userid + "__payments")
        .then(payments => {
            res.json(payments);
        })
}

exports.getPayeePayments = async (req, res) => {
    return Payments.find({ owner: req.params.userid, payee: req.params.payeeid })
        .sort({ ref: -1 })
        .then(payments => {
            res.json(payments);
        });
};

exports.getPaymentsVue = async (req, res) => {

    const getPayees = () => {
        return Payee.find({ owner: req.params.userid })
        .cache(0, req.params.userid + "__payees")
        .then(payees => {
            return payees;
        });
    };

    const getPayments = () => {
        let page = req.query.page || 1;
        let per_page = req.query.per_page * 1 || 10;
        let offset = (page - 1) * per_page;
        return Payments.find({ owner: req.params.userid })
            .sort({ ref: -1 })
            .skip(offset)
            .limit(per_page)
            .then(payments => {
                return payments;
            });
    };

    const getTotalPayments = () => {
        return Payments.count({ owner: req.params.userid });
    };

    try{
        let payees = await getPayees();
        let payments = await getPayments();
        let totalPayments = await getTotalPayments();

        let __page = req.query.page * 1 || 1;
        let __per_page = req.query.per_page * 1 || 10

        // Stub out the page payload
        let data = {
            links: {
                pagination: {
                    total: totalPayments,
                    per_page: __per_page,
                    current_page: __page,
                    last_page: 1,
                    next_page_url: null,
                    prev_page_url: null,
                    from: 1,
                    to: 15
                },
            },
            data: []
        }
        
        data.links.pagination.last_page = Math.ceil(totalPayments / __per_page);
        data.links.pagination.from = (__page - 1) * __per_page + 1;

        if(__page > 1) {
            data.links.pagination.prev_page_url = '/api/user/' + req.params.userid + '/pay?page=' +  (__page - 1);
        }
        if(__page < data.links.pagination.last_page) {
            data.links.pagination.next_page_url = '/api/user/' + req.params.userid + '/pay?page=' +  (__page + 1);
        }

        let page_to = data.links.pagination.from + data.links.pagination.per_page - 1;
        data.links.pagination.to = page_to <= totalPayments ? page_to : totalPayments;


        for (let payment of payments) {

            // Get some information about the payee.. Should always exist
            let payeeName = payees.filter((payee) => {
                return payee.id === payment.payee;
            });

            // Push payment to payment array
            data.data.push({
                name: payeeName[0].name,
                payee: payment.payee,
                ref: payment.ref,
                createdAt: payment.createdAt,
                amount: payment.amount
            });
        }

        // Render it
        res.json(data);
    }
    catch (err) {
        return res.status(500);
    }


};
