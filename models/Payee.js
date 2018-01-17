const mongoose = require('mongoose');

const payeeSchema = new mongoose.Schema({  
    owner: String,
    intervalType: String,
    name: String,
    description: String,
    ref: String,
    amount: { type: Number, min: 0, max: 99999 },
    url: String,
    day: { type: Number, min: 1, max: 31 },
    apr: { type: Number, min: 0, max: 100, default: 0 },
    active: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false }
}, {
    timestamps: true
});

const Payee = mongoose.model('Payee', payeeSchema);

module.exports = Payee;