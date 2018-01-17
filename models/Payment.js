const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    owner: String,
    payee: String,
    ref: String,
    amount: { type: Number, min: 0, max: 99999, default: 0 },
    active: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false }
}, {
    timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;