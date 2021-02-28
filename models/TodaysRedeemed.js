const mongoose = require('mongoose');

const redeemedSchema = new mongoose.Schema({
    userId: {
        type: String, 
        required: true
    }
});

module.exports = mongoose.model('TodaysRedeemed', redeemedSchema);