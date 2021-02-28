const cron = require('node-cron');
const redis = require('../modules/redis');
const User = require('../models/User');

module.exports.start = () => {
    cron.schedule('*/5 * * * *', async () => {
        let entries = await redis.getFaucetEntries();
        let rates = await redis.getRates();
        let earned = Math.floor((entries.length * 0.001) * (1000 / rates.captchaRate)) + rates.faucetBase;

        if (entries.length > 0) {
            let winner = await User.findById(entries[Math.floor(Math.random() * entries.length)]);

            winner.entryBalance += earned;

            try {
                let saved = await winner.save();
                await redis.updateUser(saved._id, saved);
                await redis.clearFaucet();
                await redisConnection.set('faucetwinner', winner.username);
            } catch (error) {
                console.log(error);
                console.log('failed to restart faucet')
            }
        } else {
            await redisConnection.set('faucetwinner', 'No one!');
        }
    });
};