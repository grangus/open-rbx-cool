const redis = require('../modules/redis');

module.exports = async (req, res, next) => {
    let ip = req.headers['cf-connecting-ip'] || req.ip;

    req.ipAddress = ip;

    try {
        let banned = await redis.checkIpBan(ip);

        if (banned) return res.status(403).json({
            status: 'error',
            error: {
                code: 403,
                message: 'Your IP has been banned from our website!'
            },
            data: null
        });

        next();
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: {
                code: 500,
                message: 'Internal error! Check back later!'
            },
            data: null
        });
    }
};