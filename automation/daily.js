//modules
const cron = require('node-cron');
const redis = require('../modules/redis');

//models
const TodaysRedeemed = require('../models/TodaysRedeemed');
const TodaysCompleted = require('../models/TodaysCompleted');

module.exports.startDaily = () => {
    cron.schedule('59 59 23 * * *', async () => {
        await redis.deleteCompletedToday();
        await redis.deleteRedeemedtodayToday();
        await TodaysCompleted.collection.drop();
        await TodaysRedeemed.collection.drop();
    });
};