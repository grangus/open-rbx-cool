const mongoose = require('mongoose');

const fpSchema = new mongoose.Schema({
    fp: {
        required: true,
        type: String
    }
});

module.exports = mongoose.model('BannedFingerprint', fpSchema);