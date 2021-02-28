const mongoose = require('mongoose');

const codeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true
    },
    codeType: {
        type: Number,
        required: true
    },
    value: {
        type: Number, 
        required: true
    },
    uses: {
        type: Number, 
        required: false,
        default: 0
    },
    maxUses: {
        type: Number, 
        required: false,
        default: 0
    }
});

module.exports = mongoose.model('Code', codeSchema);