const mongoose = require('mongoose');
const uuid = require('uuid/v4');

const userSchema = new mongoose.Schema({
    email: {
        required: false,
        type: String,
        default: null
    },
    username: {
        required: true,
        type: String
    },
    password: {
        required: true,
        type: String
    },
    balance: {
        type: Number,
        required: false,
        default: 0
    },
    purchasedBalance: {
        type: Number,
        required: false,
        default: 0
    },
    entryBalance: {
        type: Number,
        required: false,
        default: 0
    },
    referer: {
        type: String,
        required: false,
        default: null
    },
    banned: {
        type: Boolean,
        required: false,
        default: false
    },
    linkedDiscord: {
        type: Object,
        required: false,
        default: null
    },
    totalEarned: {
        type: Number,
        required: false,
        default: 0
    },
    totalWithdrawed: {
        type: Number,
        required: false,
        default: 0
    },
    registrationIp: {
        type: String,
        required: true
    },
    redeemedCodes: {
        type: Array,
        required: false,
        default: []
    },
    lastCodeRedemption: {
        type: Number,
        required: false,
        default: 1579758916579
    }, 
    oldEmails: {
        type: Array,
        required: false,
        default: []
    },
    resetCode: {
        type: Object,
        required: false,
        default: {
            recoveryCode: null,
            expiration: null
        }
    },
    referredUsers: {
        type: Array,
        required: false,
        default: []
    },
    fp: {
        type: String,
        required: true
    },
    signature: {
        type: String,
        required: false,
        default: uuid()
    },
    latestTransactions: {
        type: Array,
        required: false,
        default: []
    }
});

module.exports = mongoose.model('User', userSchema);