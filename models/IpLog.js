const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    ip: {
        required: true,
        type: String
    },
    userId: {
        required: true,
        type: String
    }
});

module.exports = mongoose.model('IpLog', logSchema);