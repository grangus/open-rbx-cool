//modules
const router = require('express').Router();
const bcrypt = require('bcrypt');
const uuid = require('uuid/v4');
const ms = require('ms');

//custom modules
const mail = require('../modules/mail');
const redis = require('../modules/redis');
const captcha = require('../modules/captcha');
const validator = require('../modules/validator');
const generator = require('../modules/generatePassword');

//middlewares
const ipCheck = require('../middlewares/ipCheck');
const fpCheck = require('../middlewares/fpCheck');

//models
const User = require('../models/User');

router.post('/recovery/send', ipCheck, fpCheck, async (req, res) => {
    // return res.status(400).json({
    //     status: 'error',
    //     error: {
    //         code: 400,
    //         message: 'Password recovery is currently down. If you need to reset your password, please email us at staff@rbx.cool or make a post on our forum.'
    //     },
    //     data: null
    // });

    const { error } = validator.passwordReset(req.body);
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

    req.body.email = req.body.email.toLowerCase();

    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'Email does not exist!'
        },
        data: null
    });

    user.resetCode = {
        recoveryCode: uuid(),
        expiration: Date.now() + ms('1d')
    };

    try {
        await user.save();
        await mail.sendResetEmail(user.resetCode.recoveryCode, req.body.email, user.username);
    } catch (error) {
        console.log('reset sending error')
        console.log(error);
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
            message: 'Password reset email sent successfully!'
        }
    });
});

router.post('/recovery/:code', ipCheck, fpCheck, async (req, res) => {
    const { error } = validator.passwordResetComplete(req.params.code);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    const user = await User.findOne({ 'resetCode.recoveryCode': req.params.code });
    if (!user) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'The code you supplied is invalid or expired!'
        },
        data: null
    });

    if (Date.now() >= user.resetCode.expiration) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'The code you supplied is invalid or expired!'
        },
        data: null
    });

    const newPassword = generator();
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    user.password = hashedPassword;

    try {
        const saved = await user.save();
        await mail.sendNewPassword(user.email, newPassword);
        await redis.updateUser(saved._id, saved);
    } catch (error) {
        console.log('pw sending error')
        console.log(error);
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
            message: 'Check your email for your new password!'
        }
    });
});

module.exports = router;