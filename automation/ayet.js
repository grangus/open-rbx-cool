const cron = require('node-cron');
const offerwalls = require('../modules/offerwalls');
const redis = require('../modules/redis');

module.exports.start = () => {
    cron.schedule('0-59/20 * * * * *', async () => {
        try {
            let offers = await offerwalls.getAyetOffers()
            await redis.updateAyet(offers);
        } catch (error) {
            console.log(`AYET ERROR: ${error}`);
        }
    });
};