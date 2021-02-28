//modules
const router = require('express').Router();
const dotenv = require('dotenv').config();
const parser = require('cron-parser');
const ms = require('ms');

//custom modules
const captcha = require('../modules/hcaptcha');
const redis = require('../modules/redis');
const validator = require('../modules/validator');

//models
const User = require('../models/User');
const Code = require('../models/Code');
const TodaysRedeemed = require('../models/TodaysRedeemed');

//middlewares
const userAuth = require('../middlewares/userAuth');
const fpCheck = require('../middlewares/fpCheck');
const ipCheck = require('../middlewares/ipCheck');

router.post('/promotions/daily/redeem', userAuth, fpCheck, ipCheck, async (req, res) => {
    const { error } = validator.captcha(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    try {
        await captcha.verifyToken(req.body.captchaToken, req.ipAddress);
    } catch (error) {
        return res.status(400).json({
            status: 'error',
            error: {
                code: 400,
                message: error
            },
            data: null
        });
    }

    const redeemed = await redis.getRedeemedToday();
    const completed = await redis.getCompletedToday();
    const alreadyRedeemed = redeemed.find(i => i == req.user._id);
    const completedOffer = await completed.find(i => i == req.user._id);

    if (alreadyRedeemed) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'You have already redeemed your daily login reward! Come back again tomorrow!'
        },
        data: null
    });

    if (!completedOffer) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'You must complete at least one offer before you can redeem your daily reward!'
        },
        data: null
    });

    const user = await User.findById(req.user._id);
    const redemption = new TodaysRedeemed({ userId: req.user._id });

    user.balance += parseInt(process.env.DAILY_REWARD);
    user.totalEarned += parseInt(process.env.DAILY_REWARD);

    try {
        const saved = await user.save();
        const savedRedemption = await redemption.save();
        await redis.updateUser(saved._id, saved);
        await redis.updateLeaderboard(saved);
        await redis.addRedeemedToday(savedRedemption);
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            error: {
                code: 500,
                message: 'Internal error!'
            },
            data: null
        });
    }

    res.status(200).json({
        status: "ok",
        error: null,
        data: {
            message: "Reward redeemed successfully!"
        }
    });
});

router.post('/promotions/code/redeem', userAuth, fpCheck, ipCheck, async (req, res) => {
    const { error } = validator.code(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    try {
        await captcha.verifyToken(req.body.captchaToken, req.ipAddress);
    } catch (error) {
        return res.status(400).json({
            status: 'error',
            error: {
                code: 400,
                message: error
            },
            data: null
        });
    }

    const user = await User.findById(req.user._id);

    if (user.redeemedCodes.find(c => c == req.body.code)) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'You have already redeemed this code!'
        },
        data: null
    });

    if (Math.floor((Date.now() - user.lastCodeRedemption) / 1000) < 120) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'Woah there! You can only redeem a code once every 2 minutes!'
        },
        data: null
    });

    const code = await Code.findOne({ code: req.body.code });
    if (!code) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'That code does not exist!'
        },
        data: null
    });

    if (user.totalEarned < 1 && code.codeType !== 1) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'You must complete at least one offer before you are able to redeem promocodes!'
        },
        data: null
    });

    user.balance += code.value;
    user.redeemedCodes.push(code.code);
    user.lastCodeRedemption = Date.now();
    code.uses++;

    try {
        const saved = await user.save();
        await redis.updateUser(saved._id, saved);
        await redis.updateLeaderboard(saved);
        await code.save();

        if (code.codeType == 1) {
            await code.remove();
        }

        if (code.codeType == 3 && code.uses >= code.maxUses) {
            await code.remove();
        }

    } catch (error) {
        console.log('promo error')
        console.log(error)
        return res.status(500).json({
            status: 'error',
            error: {
                code: 500,
                message: 'Internal error!'
            },
            data: null
        });
    }

    res.status(200).json({
        status: "ok",
        error: null,
        data: {
            message: "Code redeemed successfully!"
        }
    });
});

router.get('/promotions/faucet/info', userAuth, async (req, res) => {
    let entries = await redis.getFaucetEntries();
    let userEntries = entries.filter(e => e == req.user._id);
    let rates = await redis.getRates();
    let lastWinner = await redis.getLastWinner();
    let award = Math.floor((entries.length * 0.001) * (1000 / rates.captchaRate)) + rates.faucetBase;
    
    res.status(200).json({
        status: "ok",
        error: null,
        data: {
            award: award,
            entries: userEntries.length,
            endsIn: ms(parser.parseExpression('*/5 * * * *').next().getTime() - Date.now()),
            lastWinner: lastWinner
        }
    });
});

router.post('/promotions/faucet/enter', userAuth, fpCheck, ipCheck, async (req, res) => {
    const { error } = validator.captcha(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    try {
        await captcha.verifyToken(req.body.captchaToken, req.ipAddress);
    } catch (error) {
        return res.status(400).json({
            status: 'error',
            error: {
                code: 400,
                message: error
            },
            data: null
        });
    }
    let entries = await redis.getFaucetEntries();
    let userEntries = entries.filter(e => e == req.user._id);

    if(userEntries.length >= 10) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'You can only enter the faucet a total of 10 times!'
        },
        data: null
    });

    try {
        await redis.addFaucetEntry(req.user._id);
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            error: {
                code: 500,
                message: 'Internal error!'
            },
            data: null
        });
    }

    res.status(200).json({
        status: "ok",
        error: null,
        data: {
            message: "Added entry to faucet! Keep entering for a higher chance to win!"
        }
    });
});

module.exports = router;