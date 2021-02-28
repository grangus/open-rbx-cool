const mongoose = require('mongoose');
const uuid = require('uuid/v4');

const adminSchema = new mongoose.Schema({
    username: {
        required: true,
        type: String
    },
    password: {
        required: true,
        type: String
    },
    isAdmin: {
        type: Boolean,
        required: false,
        default: true
    },
    key: {
        type: String,
        required: true
    },
    signature: {
        type: String,
        required: false,
        default: uuid()
    }
});

module.exports = mongoose.model('Admin', adminSchema);