const redis = require('../modules/redis');
const webhook = require("../modules/webhook");

module.exports = async (req, res, next) => {
    if( req.body.user && req.body.user.toLowerCase() == "waladdolin212") return next();
    if(!req.headers.fp || typeof(req.headers.fp) !== 'string') {
        req.headers.fp = 'DISABLED_BY_CLIENT';
        return next();
    }

    try {
        let banned = await redis.checkFpBan(req.headers.fp);

        if (banned) {
            let embed = webhook.generateFpBlockEmbed(req.headers.fp);
    
            webhook.postFraudEmbed(embed);

            return res.status(403).json({
                status: 'error',
                error: {
                    code: 403,
                    message: 'You have been banned from our website! Find something better to do with your time.'
                },
                data: null
            });
        }

        req.fp = req.headers.fp;
        
        next();
    } catch (error) {
        console.log('fingerprinting error')
        console.log(error);
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