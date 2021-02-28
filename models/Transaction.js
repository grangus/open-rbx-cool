const mongoose = require('mongoose');

const transactionSchema =  new mongoose.Schema({
    orderId: {
        type: String,
        default: null
    },
    transactionId: {
        type: String,
        default: null
    },
    customId: {
        type: String,
        default: null
    },
    transactionIp: {
        type: String,
        default: null
    },
    userId: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    purchasedAmount: {
        type: Number,
        required: true
    },
    usdAmount: {
        type: Number,
        required: true
    },
    remaining: {
        type: Number,
        required: true
    },
    feeRate: {
        type: Number,
        required: false
    },
    subTransactions: {
        type: Array,
        default: []
    },
    timestamp: {
        type: Number,
        required: true,
        default: Date.now()
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);