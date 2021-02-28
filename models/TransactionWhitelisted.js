const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    username: {
        required: true,
        type: String
    }
});

module.exports = mongoose.model('TransactionWhitelisted', accountSchema);