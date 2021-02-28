const mongoose = require('mongoose');

const announceSchema = new mongoose.Schema({
    announcement: {
        type: String,
        required: true
    },
    id: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Announcement', announceSchema);