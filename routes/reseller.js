//modules
const router = require('express').Router();
const bcrypt = require('bcrypt');
const _ = require('lodash');
const jwt = require('jsonwebtoken');

//custom modules
const redis = require('../modules/redis');
const captcha = require('../modules/captcha');
const validator = require('../modules/validator');
const rbx = require('../modules/rbx');

//middlewares
const ipCheck = require('../middlewares/ipCheck');
const fpCheck = require('../middlewares/fpCheck');
const resellerAuth = require('../middlewares/resellerAuth');

//models
const Reseller = require('../models/Reseller');
const Group = require('../models/Group');

router.get('/reseller/current', resellerAuth, (req, res) => {
    let picked = _.pick(req.user, ['username', 'sold', 'faucet', 'rewarded', 'saleRates', 'rewardRates', 'faucetRates', 'chargebackTotal', 'transactionFees']);

    res.status(200).json({
        status: 'ok',
        error: null,
        data: picked
    });
});

router.post('/reseller/login', ipCheck, fpCheck, async (req, res) => {
    const { error } = validator.login(req.body);
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

    req.body.user = req.body.user.toLowerCase();

    const user = await Reseller.findOne({ username: req.body.user });
    if (!user) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'User not found! Make sure the spelling is correct and try again!'
        },
        data: null
    });

    const passwordsMatch = await bcrypt.compare(req.body.password, user.password);
    if (!passwordsMatch) return res.status(403).json({
        status: 'error',
        error: {
            code: 403,
            message: 'Password is incorrect! Check your credentials and try again!'
        },
        data: null
    });

    const token = jwt.sign({ id: user._id, type: 2 }, `${user.password}:${user.signature}`, { expiresIn: '7d' });

    res.status(200).json({
        status: "ok",
        error: null,
        data: {
            token: token,
            message: "Logged in!"
        }
    });
});

router.get('/reseller/groups', ipCheck, resellerAuth, async (req, res) => {
    let groups = await redis.getGroups();

    res.status(200).json({ status: 'ok', error: null, data: groups.filter(g => g.stockerId == req.user._id) });
});

router.post('/reseller/groups/add', ipCheck, resellerAuth, async (req, res) => {
    const { error } = validator.groupAdd(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    let proxies = process.env.REQUEST_PROXY.split(',');

    let proxy = proxies[Math.floor(Math.random() * proxies.length)];
    
    try {
        let info = await rbx.getCookieInfo(req.body.cookie, proxy);
        let verification = await rbx.verifyOwnership(req.body.groupId, info.UserID, proxy);
        let balance = await rbx.getGroupBalance(req.body.groupId, req.body.cookie, proxy);
        let icon = await rbx.getGroupIcon(req.body.groupId);

        let groups = await redis.getGroups();

        if (groups.find(g => g.groupId == req.body.groupId)) return res.status(400).json({
            status: 'error',
            error: {
                code: 400,
                message: 'That group has already been stocked!'
            },
            data: null
        });

        if(balance < 1) return res.status(400).json({
            status: 'error',
            error: {
                code: 400,
                message: 'The group supplied has no R$!'
            },
            data: null
        });

        await rbx.disableManualJoins(req.body.groupId, req.body.cookie, proxy);
        
        let group = new Group({
            name: validator.escapeGroupName(verification.name),
            groupId: req.body.groupId,
            ownerId: info.UserID,
            balance: balance,
            cookie: req.body.cookie,
            stockerName: req.user.username,
            stockerId: req.user._id,
            groupImage: icon
        });

        let saved = await group.save();

        groups.push(saved);

        await redis.setGroups(groups);
    } catch (error) {
        return res.status(400).json({
            status: 'error',
            error: {
                code: 400,
                message: error.message || error
            },
            data: null
        });
    }

    res.status(200).json({
        status: "ok",
        error: null,
        data: {
            message: "Group added to site successfully!"
        }
    });
});

router.post('/reseller/groups/remove', ipCheck, resellerAuth, async (req, res) => {
    const { error } = validator.groupRemove(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    let group = await Group.findOne({groupId: req.body.groupId})

    if(!group) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'That group is not stocked!'
        },
        data: null
    });

    if(group.stockerId !== req.user._id) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'You cannot remove a group you did not stock!'
        },
        data: null
    });

    await group.remove();

    let groups = await Group.find();
    await redis.setGroups(groups);

    res.status(200).json({
        status: "ok",
        error: null,
        data: {
            message: "Group removed from the site!"
        }
    });
});

module.exports = router;