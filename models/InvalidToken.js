const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expireAt: {
        type: Date,
        default: undefined
    }
});

tokenSchema.index({ expireAt: 1 }, { expireAfterSeconds : 0 });

module.exports = mongoose.model('InvalidToken', tokenSchema);