const mongoose = require('mongoose');

const offersSchema = new mongoose.Schema({
    userId: {
        type: String, 
        required: true
    },
    username: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('TodaysOffers', offersSchema);