const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

const rateSchema = new mongoose.Schema({
    offerwallRate: {
        type: Number,
        default: parseInt(process.env.OFFERWALL_RATES)
    },
    salesRate: {
        type: Number,
        default: parseInt(process.env.PURCHASE_RATES)
    },
    dailyReward: {
        type: Number,
        default: parseInt(process.env.DAILY_REWARD)
    },
    captchaRate: {
        type: Number,
        default: parseInt(process.env.CAPTCHA_RATES)
    },
    faucetBase: {
        type: Number,
        default: parseInt(process.env.FAUCET_BASE)
    },
    gameRate: {
        type: Number,
        default: parseInt(process.env.GAME_RATES)
    }
});

module.exports = mongoose.model('Rate', rateSchema);