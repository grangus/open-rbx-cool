const mongoose = require('mongoose');
const uuid = require('uuid/v4');

const resellerSchema = new mongoose.Schema({
    username: {
        required: true,
        type: String
    },
    password: {
        required: true,
        type: String
    },
    sold: {
        type: Number,
        required: false,
        default: 0
    },
    rewarded: {
        type: Number,
        required: false,
        default: 0
    },
    faucet: {
        type: Number,
        required: false,
        default: 0
    },
    rewardRates: {
        type: Number,
        required: false,
        default: 0
    },
    chargebackTotal: {
        type: Number,
        required: false,
        default: 0
    },
    transactionFees: {
        type: Number,
        required: false,
        default: 0
    },
    saleRates: {
        type: Number,
        required: false,
        default: 0
    },
    faucetRates: {
        type: Number,
        required: false,
        default: 0
    },
    signature: {
        type: String,
        required: false,
        default: uuid()
    }
});

module.exports = mongoose.model('Reseller', resellerSchema);