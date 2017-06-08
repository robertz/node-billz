const mongoose = require('mongoose');

const payeeSchema = new mongoose.Schema({  
    owner: String,
    intervalType: String,
    name: String,
    description: String,
    ref: Date,
    amount: { type: Number, min: 0, max: 99999 },
    url: String,
    active: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false }
}, {
    timestamps: true
});

const Payee = mongoose.model('Payee', payeeSchema);

module.exports = Payee;