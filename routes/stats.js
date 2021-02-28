const router = require('express').Router();
const redis = require('../modules/redis');
const _ = require('lodash');

router.get('/stats/site', async (req, res) => {
    let stats = await redis.getStats();
    stats.stock = await redis.getStock();

    res.status(200).json({ status: 'ok', data: _.pick(stats, ['stock']) });
});

router.get('/stats/leaderboard', async (req, res) => {
    let leaderboard = await redis.getLeaderBoard();
    res.status(200).json({ status: 'ok', data: leaderboard });
});

module.exports = router;