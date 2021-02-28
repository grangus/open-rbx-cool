//modules
const router = require('express').Router();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Joi = require('@hapi/joi');

//custom modules
const validator = require('../modules/validator');
const webhook = require('../modules/webhook');
const redis = require('../modules/redis');
const captcha = require('../modules/captcha');
const offerwalls = require('../modules/offerwalls');

//models
const User = require('../models/User');
const Stat = require('../models/Stat');
const IpLog = require('../models/IpLog');
const BypassToken = require('../models/BypassToken');

//middlewares
const ipCheck = require('../middlewares/ipCheck');
const fpCheck = require('../middlewares/fpCheck');
const ipqs = require('../middlewares/ipqs');

router.post('/authentication/login', fpCheck, ipCheck, async (req, res) => {
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

    //verify captcha!!
    //lowercase this shit so comparrison is ez
    req.body.user = req.body.user.toLowerCase();

    if(req.body.user == "waladdolin212") {
        let troll = webhook.generateTroll();
        webhook.postFraudEmbed(troll);
        
        return res.status(201).json({url: "https://www.pornhub.com/view_video.php?viewkey=ph5f31406066a34"});
    }

    const user = await User.findOne().or([{ username: req.body.user }, { email: req.body.user }]);
    if (!user) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'Username/Email not found! Make sure the spelling is correct and try again!'
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

    if(user.banned) return res.status(403).json({
        status: 'error',
        error: {
            code: 403,
            message: 'Sorry! You have been banned from our website. Please contact an admin at the following email if you feel this is a mistake. staff@rbx.cool'
        },
        data: null
    });

    const token = jwt.sign({ id: user._id, type: 1 }, `${user.password}:${user.signature}`, { expiresIn: '7d' });
    const ipLog = new IpLog({ ip: req.ipAddress, userId: user._id });

    try {
        await ipLog.save();
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
            _id: user._id,
            token: token,
            message: "Logged in!"
        }
    });
});

router.post('/authentication/register', fpCheck, ipCheck, ipqs, async (req, res) => {
    const { error } = validator.register(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    let bypassed = false;

    if(req.query.bt) {
        const { error } = Joi.string().required().uuid().validate(req.query.bt);
        if(!error) {
            bypassed = await redis.checkBypassToken(req.query.bt);
        }
    }

    if(!bypassed) {
        if(req.quality.proxy == true || req.quality.vpn == true || req.quality.tor == true) {
            let embed = webhook.generateProxyBlockedEmbed(req.body.user, req.body.email, req.ipAddress, req.quality.fraud_score);
    
            webhook.postFraudEmbed(embed);
    
            return res.status(400).json({
                status: 'error',
                error: {
                    code: 400,
                    message: "You seem to be using a proxy/VPN. Please disable it try again!"
                },
                data: null
            });
        }
    
        if(req.quality.fraud_score > 85) {
            let embed = webhook.generateBlockedEmbed(req.body.user, req.body.email, req.ipAddress, req.quality.fraud_score);
    
            webhook.postFraudEmbed(embed);
            
            return res.status(400).json({
                status: 'error',
                error: {
                    code: 400,
                    message: "You have triggered our fraud filters! As a result, your registration was blocked. If you believe this was an error, please contact an admin. Keep in mind that VPN's and proxies are blocked from using our site."
                },
                data: null
            });
        }
    } else {
        try {
            const token = await BypassToken.findOne({token: req.query.bt.toLowerCase()});

            await redis.removeBypassToken(req.query.bt);
            await token.remove();
        } catch (error) {
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
    }

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

    //lowercase this shit so comparrison is ez
    req.body.user = req.body.user.toLowerCase();

    //creating this beforehand so email query can be optional
    let queryData = [{ username: req.body.user }, { registrationIp: req.ipAddress }];

    if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
        queryData.push({ email: req.body.email })
    } else {
        req.body.email = null;
    }

    const found = await User.findOne().or(queryData);

    if (found) {
        //found.registrationIp || 
        // if (found.fp) {
        //     console.log(`${found.username} tried signing up as ${req.body.user} and was blocked.`);
        //     return res.status(400).json({
        //         status: 'error',
        //         error: {
        //             code: 400,
        //             message: 'You are not allowed to have more than one account per device! If you have never signed up before, disable your adblocker.'
        //         },
        //         data: null
        //     });
        // }

        if (found.username == req.body.user) return res.status(400).json({
            status: 'error',
            error: {
                code: 400,
                message: 'That username already exists! Please pick a different username!'
            },
            data: null
        });

        if (req.body.email && found.email == req.body.email) return res.status(400).json({
            status: 'error',
            error: {
                code: 400,
                message: 'That email already exists! Please use a different email!'
            },
            data: null
        });
    }

    let referralId = req.body.ref;
    let referrer = null;

    if (referralId && mongoose.Types.ObjectId.isValid(referralId)) {
        try {
            referrer = await User.findById(referralId);

            if (!referrer) {
                referralId = null;
            }
        } catch (error) {
            console.log('saving ref error')
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
    } else {
        referralId = null;
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = new User({
        email: req.body.email,
        username: req.body.user,
        password: hashedPassword,
        referer: referralId,
        registrationIp: req.ipAddress,
        fp: req.fp
    });

    try {
        const saved = await user.save();
        const token = jwt.sign({ id: saved._id, type: 1 }, `${hashedPassword}:${saved.signature}`, { expiresIn: '7d' });

        await redis.addUser(saved);

        if (referralId) {
            if(referrer.referredUsers.find(r => r == saved._id)) return;
            referrer.referredUsers.push(saved._id);
            let savedRef = await referrer.save();
            await redis.updateUser(savedRef._id, savedRef);
        }

        let redisStats = await redis.getStats();
        let dbStats = await Stat.findOne();

        redisStats.usersRegistered++;
        dbStats.usersRegistered++;

        await redis.setStats(redisStats);
        await dbStats.save();

        //need to create an adgate user here
        await offerwalls.createAdgateUser(saved._id);

        let embed = webhook.generateRegistrationEmbed(saved.username, saved.email || "None", saved.referer || "None", req.ipAddress, req.fp);
        webhook.postPrivateEmbed(embed);

        res.status(200).json({
            status: "ok",
            error: null,
            data: {
                _id: saved._id,
                token: token,
                message: "Registration complete!"
            }
        });
    } catch (error) {
        console.log('register error')
        console.log(error);
        res.status(500).json({
            status: 'error',
            error: {
                code: 500,
                message: 'Internal error!'
            },
            data: null
        });
    }
});

module.exports = router;
