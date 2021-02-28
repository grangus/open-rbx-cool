const mongoose = require('mongoose');

const ipSchema = new mongoose.Schema({
    ip: {
        required: true,
        type: String
    }
});

module.exports = mongoose.model('BannedIp', ipSchema);