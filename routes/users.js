//modules
const router = require('express').Router();
const uuid = require('uuid/v4');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcrypt');

//custom modules
const redis = require('../modules/redis');
const validator = require('../modules/validator');

//models
const User = require('../models/User');
const InvalidToken = require('../models/InvalidToken');

//middlewares
const userAuth = require('../middlewares/userAuth');

router.get('/users/me', userAuth, async (req, res) => {
    let picked = _.pick(req.user, ['username', 'email','balance', 'purchasedBalance', 'entryBalance', 'banned', 'linkedDiscord', '_id', 'latestTransactions']);

    picked.referrals = req.user.referredUsers.length;

    picked.pendingBalance = await redis.getUserPendingBalance(req.user._id);
    picked.stock = await redis.getStock();

    
    res.status(200).json({
        status: "ok",
        error: null,
        data: picked
    });

});

router.post('/users/me/logout', userAuth, async (req, res) => {
    let invalid = new InvalidToken({
        token: req.token,
        expireAt: req.decoded.exp
    });

    try {
        await invalid.save();
        await redis.addInvalidTokens(req.token);
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
        status: 'ok',
        error: null,
        data: {
            message: 'Logged out successfully!'
        }
    });
});

router.post('/users/me/sessions/clear', userAuth, async (req, res) => {

    const user = await User.findById(req.user._id);

    user.signature = uuid();

    const token = jwt.sign({ id: user._id, type: 1 }, `${user.password}:${user.signature}`, { expiresIn: '7d' });

    try {
        const saved = await user.save();
        await redis.updateUser(saved._id, saved);
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

    res.status(200).header('authorization', token).json({
        status: "ok",
        error: null,
        data: {
            message: "Sessions cleared successfully!"
        }
    });
});

router.post('/users/me/email/update', userAuth, async (req, res) => {
    const { error } = validator.emailChange(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    const user = await User.findById(req.user._id);

    const passwordMatches = await bcrypt.compare(req.body.password, user.password);
    if (!passwordMatches) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'Incorrect password! Please make sure your details are correct and try again!'
        },
        data: null
    });

    if (user.email == req.body.email) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'You cannot change your email to the same email!'
        },
        data: null
    });

    try {
        user.email = req.body.email;
        let saved = await user.save();
        await redis.updateUser(saved._id, saved);
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
        status: 'ok',
        error: null,
        data: {
            message: 'Email changed successfully!'
        }
    });
});

router.post('/users/me/password/change', userAuth, async (req, res) => {
    const { error } = validator.passwordChange(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    const user = await User.findById(req.user._id);

    const passwordMatches = await bcrypt.compare(req.body.currentPassword, user.password);
    if (!passwordMatches) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'Incorrect password! Please make sure your details are correct and try again!'
        },
        data: null
    });

    user.password = await bcrypt.hash(req.body.newPassword, 10);
    const token = jwt.sign({ id: user._id, type: 1 }, `${user.password}:${user.signature}`, { expiresIn: '7d' });

    try {
        const saved = await user.save();
        await redis.updateUser(saved._id, saved);
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
        status: 'ok',
        error: null,
        data: {
            authorization: token,
            message: 'Password changed successfully!'
        }
    });
});

module.exports = router;