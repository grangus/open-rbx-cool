const mongoose = require('mongoose');

const statSchema = new mongoose.Schema({
    usersRegistered: {
        type: Number,
        default: 0
    },
    offersCompleted: {
        type: Number,
        default: 0
    },
    robuxPaid: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Stat', statSchema);