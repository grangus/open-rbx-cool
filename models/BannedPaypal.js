const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    email: {
        required: true,
        type: String
    }
});

module.exports = mongoose.model('BannedPaypal', accountSchema);