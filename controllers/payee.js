const Payee = require('../models/Payee');
const formatCurrency = require('format-currency');
const moment = require('moment');

/**
 * @function getIndex
 */
exports.getIndex = (req, res) => {
    Payee
        .find({owner: req.user._id}, null, {sort:{due: 1}}, (err, payees) => {
            
            if (err) {return next(err);}

            // Build sums and count
            let ownerData = {
                sum: payees.reduce((acc, payee) => acc + payee.amount, 0),
                count: payees.length
            }

            res.render('payees/list', {
                title: 'Payees',
                payees: payees,
                total: ownerData.sum,
                count: ownerData.count
            });
        });
};

/**
 * @function getView
 * @param {string} params.id - route param that contains the id of the payee
 */
exports.getView = (req, res) => {
    if(req.params.id){
        Payee
            .findOne({_id: req.params.id, owner: req.user._id}, (err, payee) => {
                res.render('payees/view', {
                    title: 'Edit Payee',
                    data: payee 
                });

            });
    }

};

/**
 * @function getCreate
 * @param {string} params.id - route param that contains the id of the payee
 */
exports.getCreate = (req, res) => {
    Payee
        .findOne({_id: req.params.id, owner: req.user._id}, (err, payee) => {

            if (err) {return next(err);}
            
            res.render('payees/create', {
                title: 'Create Payee'
            });
        });
};

/**
 * @function postCreate
 * @param {string} body.name - name of the payee
 * @param {string} body.description - description of the payee
 * @param {numeric} body.due - day of month a payee is due
 * @param {numeric} body.amount - the amount of the payment
 */
exports.postCreate = (req, res) => {
    let payee = new Payee();

    payee.name = req.body.name || '';
    payee.description = req.body.description || '';
    payee.ref = req.body.ref || '';
    payee.amount = req.body.amount || '';
    
    payee.owner = req.user._id;
    payee.intervalType = 'm';

    payee.save((err) => {
        if (err) {return next(err);}

        req.flash('success', { msg: 'Your payee ' + payee.name + ' was successfully created.' });
        res.redirect('/payee/');
    });

};

/**
 * @function postSave
 * @param {string} params.id - route param that contains the id of the payee
 * @param {string} body.name - name of the payee
 * @param {string} body.description - description of the payee
 * @param {numeric} body.due - day of month a payee is due
 * @param {numeric} body.amount - the amount of the payment
 */
exports.postSave = (req, res) => {
    req.assert('name', 'You must enter a name for this payee').len(1);
    
    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/payee/' + req.params.id);
    }

    Payee
        .findById(req.params.id, (err, payee) => {
            if (err) {return next(err);}

            if (!payee) {
                payee = new Payee();
            }

            payee.name = req.body.name || '';
            payee.description = req.body.description || '';
            payee.ref = req.body.ref || '';
            payee.amount = req.body.amount || '';
            payee.save((err) => {
                if (err) {return next(err);}
                req.flash('success', { msg: 'Payee ' + payee.name + ' has been updated.' });
                res.redirect('/payee');
            });
        });

};