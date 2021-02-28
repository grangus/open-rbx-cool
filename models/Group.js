const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    groupId: {
        type: Number,
        required: true
    },
    ownerId: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        required: true
    },
    cookie: {
        type: String,
        required: true
    },
    stockerName: {
        type: String,
        required: true
    },
    stockerId: {
        type: String,
        required: true
    },
    groupImage: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Group', groupSchema);