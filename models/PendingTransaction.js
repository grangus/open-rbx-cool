const mongoose = require('mongoose');

const pendingSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    transactionId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    creditTimestamp: {
        type: Number,
        required: true
    },
    ref: {
        type: mongoose.Schema.Types.Mixed
    },
    refAmount: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('PendingTransaction', pendingSchema);