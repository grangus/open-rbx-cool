const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    token: {
        required: true,
        type: String
    }
});

module.exports = mongoose.model('BypassToken', schema);