//modules
const router = require('express').Router();
const uuid = require('uuid/v4');
const dotenv = require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const moment = require('moment');
const ms = require('ms');

//custom modules
const redis = require('../modules/redis');
const validator = require('../modules/validator');
const captcha = require('../modules/captcha');

//models
const Group = require('../models/Group');
const User = require('../models/User');
const BannedIp = require('../models/BannedIp');
const BannedFingerprint = require('../models/BannedFingerprint');
const Code = require('../models/Code');
const Announcement = require('../models/Announcement');
const BannedRoblox = require('../models/BannedRoblox');
const BannedPaypal = require('../models/BannedPaypal');
const Admin = require('../models/Admin');
const Reseller = require('../models/Reseller');
const Rate = require('../models/Rate');
const PendingTransaction = require('../models/PendingTransaction');
const Transaction = require('../models/Transaction');
const TransactionWhitelisted = require('../models/TransactionWhitelisted');
const BypassToken = require('../models/BypassToken');

//middlewares
const adminAuth = require('../middlewares/adminAuth');

router.get('/admin/bypasstoken/generate', adminAuth, async (req, res) => {
    const token = uuid();
    const bypassToken = new BypassToken({token: token});

    try {
        await bypassToken.save();
        await redis.addBypassToken(token);
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


    res.status(200).json({token});
});

router.get('/admin/current', adminAuth, (req, res) => {
    let picked = _.pick(req.user, ['username']);

    res.status(200).json({
        status: 'ok',
        error: null,
        data: picked
    });
});

router.get('/admin/availability/toggle', adminAuth, (req, res) => {
    global.siteUnavailable = !global.siteUnavailable;
    res.status(200).send('OK');
});

router.post('/admin/authentication/login', async (req, res) => {
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

    const user = await Admin.findOne({ username: req.body.user })
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

    const token = jwt.sign({ id: user._id, type: 3 }, `${user.password}:${user.signature}`, { expiresIn: '7d' });

    res.status(200).json({
        status: "ok",
        error: null,
        data: {
            token: token,
            message: "Logged in!"
        }
    });
});

router.post('/admin/users/ban/update', adminAuth, async (req, res) => {
    const { error } = validator.userValidation(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    req.body.username = req.body.username.toLowerCase();

    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'User does not exist!'
        },
        data: null
    });

    const status = !user.banned;

    try {
        user.banned = status;
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
            message: `Ban status updated successfully! New status: ${status ? 'banned' : 'unbanned'}`
        }
    });
});

router.post('/admin/ips/ban/update', adminAuth, async (req, res) => {
    const { error } = validator.banIp(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    const banned = await BannedIp.findOne({ ip: req.body.ip });

    if (banned) {
        await redis.removeIpBan(req.body.ip);
        await banned.remove();
        return res.status(200).json({
            status: 'ok',
            error: null,
            data: {
                message: 'IP ban revoked successfully!'
            }
        });
    }

    const bannedIp = new BannedIp({ ip: req.body.ip });

    try {
        await bannedIp.save();
        await redis.addIpBan(req.body.ip);
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
            message: 'IP ban added successfully!'
        }
    });
});

router.post('/admin/paypals/ban/update', adminAuth, async (req, res) => {
    const { error } = validator.banEmail(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    const banned = await BannedPaypal.findOne({ email: req.body.email.toLowerCase() });

    if (banned) {
        await redis.removePaypalBan(req.body.email.toLowerCase());
        await banned.remove();
        return res.status(200).json({
            status: 'ok',
            error: null,
            data: {
                message: 'PayPal ban revoked successfully!'
            }
        });
    }

    const bannedPP = new BannedPaypal({ email: req.body.email.toLowerCase() });

    try {
        await bannedPP.save();
        await redis.addPaypalBan(req.body.email);
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
            message: 'PayPal ban added successfully!'
        }
    });
});

router.post('/admin/fps/ban/update', adminAuth, async (req, res) => {
    const { error } = validator.banFp(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    const banned = await BannedFingerprint.findOne({ fp: req.body.fp });

    if (banned) {
        await redis.removeFpBan(req.body.fp);
        await banned.remove();
        return res.status(200).json({
            status: 'ok',
            error: null,
            data: {
                message: 'Fingerprint ban revoked successfully!'
            }
        });
    }

    const bannedFp = new BannedFingerprint({ fp: req.body.fp });

    try {
        await bannedFp.save();
        await redis.addFpBan(req.body.fp);
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
            message: 'Fingerprint ban added successfully!'
        }
    });
});

router.post('/admin/roblox/ban/update', adminAuth, async (req, res) => {
    const { error } = validator.userValidation(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    req.body.username = req.body.username.toLowerCase();

    const banned = await BannedRoblox.findOne({ username: req.body.username });

    if (banned) {
        await redis.removeRobloxBan(req.body.username);
        await banned.remove();
        return res.status(200).json({
            status: 'ok',
            error: null,
            data: {
                message: 'Roblox account ban revoked successfully!'
            }
        });
    }

    const bannedAccount = new BannedRoblox({ username: req.body.username });

    try {
        await bannedAccount.save();
        await redis.addRobloxBan(req.body.username);
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
            message: 'Roblox account ban added successfully!'
        }
    });
});

router.post('/admin/groups/remove', adminAuth, async (req, res) => {
    const { error } = validator.groupRemove(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    let group = await Group.findOne({ groupId: req.body.groupId })

    if (!group) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'That group is not stocked!'
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

router.post('/admin/announcement/update', adminAuth, async (req, res) => {
    const { error } = validator.updateAnnouncement(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    const announced = await Announcement.findOne({});

    announced.announcement = req.body.announcement;
    announced.id = uuid();

    try {
        const saved = await announced.save();
        await redis.updateAnnouncement(saved);
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
            message: 'Announcement updated successfully!'
        }
    });
});

router.post('/admin/users/userinfo', adminAuth, async (req, res) => {
    const { error } = validator.userValidation(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    req.body.username = req.body.username.toLowerCase();

    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'User does not exist!'
        },
        data: null
    });

    res.status(200).json({
        status: 'ok',
        error: null,
        data: user
    });
});

router.post('/admin/resellers/userinfo', adminAuth, async (req, res) => {
    const { error } = validator.userValidation(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    req.body.username = req.body.username.toLowerCase();

    const user = await Reseller.findOne({ username: req.body.username });
    if (!user) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'Reseller does not exist!'
        },
        data: null
    });

    res.status(200).json({
        status: 'ok',
        error: null,
        data: user
    });
});

router.post('/admin/resellers/reset', adminAuth, async (req, res) => {
    const { error } = validator.userValidation(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    req.body.username = req.body.username.toLowerCase();

    const user = await Reseller.findOne({ username: req.body.username });
    if (!user) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'Reseller does not exist!'
        },
        data: null
    });

    try {
        user.sold = 0;
        user.rewarded = 0;
        user.faucet = 0;
        user.transactionFees = 0;
        user.chargebackTotal = 0;
        let saved = await user.save();
        await redis.updateReseller(saved._id, saved);
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
            message: 'Reseller stats reset successfully!'
        }
    });
});

router.post('/admin/promos/promo/create', adminAuth, async (req, res) => {
    const { error } = validator.promoCreate(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    const promoExists = await Code.findOne({ code: req.body.code });
    if (promoExists) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'Promocode already exists. Please specify a different code!'
        },
        data: null
    });

    const code = new Code({
        code: req.body.code,
        codeType: 2,
        value: req.body.value
    });

    try {
        await code.save();
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
            message: 'Promocode created successfully!'
        }
    });
});

router.post('/admin/promos/code/create', adminAuth, async (req, res) => {
    const { error } = validator.singleUse(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    const random = uuid();
    const code = new Code({
        code: random,
        codeType: 1,
        value: req.body.value
    });

    try {
        await code.save();
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
        data: random
    });
});

router.post('/admin/promos/code/multiuse/create', adminAuth, async (req, res) => {
    const { error } = validator.multiUse(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    const code = new Code({
        code: req.body.code,
        codeType: 3,
        value: req.body.value,
        maxUses: req.body.uses
    });

    try {
        await code.save();
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
            message: 'Code created successfully!'
        }
    });
});

router.post('/admin/promos/delete', adminAuth, async (req, res) => {
    const { error } = validator.codeValidation(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    const code = await Code.findOne({ code: req.body.code });
    if (!code) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'Code does not exist!'
        },
        data: null
    });

    try {
        await code.remove();
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
            message: 'Code deleted successfully!'
        }
    });
});

router.post('/admin/promos/code/info', adminAuth, async (req, res) => {
    const { error } = validator.codeValidation(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    const code = await Code.findOne({ code: req.body.code });
    if (!code) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'Code does not exist!'
        },
        data: null
    });

    res.status(200).json({
        status: 'ok',
        error: null,
        data: code
    });
});

//same as normal stats but will most likely add other things later
router.get('/admin/stats', adminAuth, async (req, res) => {
    let stats = await redis.getStats();
    stats.stock = await redis.getStock();

    let currentTime = moment();
    let transactionStartTime = currentTime.startOf('day').subtract(7, 'd').toDate().getTime();
    let transactions = await Transaction.find({usdAmount: {$exists: true}, timestamp: {$gte: transactionStartTime}, status: "complete"});
    
    stats.sales = transactions.reduce((days, sale) => {
        let day = moment(sale.timestamp).startOf('day').date();
    
        if(!days[day]) days[day] = {total: 0, count: 0};
    
        days[day].total += sale.usdAmount;
        days[day].count++;
        return days;
    }, {});

    res.status(200).json({ status: 'ok', error: null, data: _.pick(stats, ['stock', 'usersRegistered', 'offersCompleted', 'robuxPaid', 'sales']) });
});

router.get('/admin/transactions/pending', adminAuth, async (req, res) => {
    let transactions = await redis.getAllPendingTransactions();
    let mapped = transactions.map(t => {
        return {
            username: t.username,
            amount: t.amount,
            time: ms(t.creditTimestamp - Date.now()),
            transactionId: t.transactionId
        };
    });

    res.status(200).json({ status: 'ok', error: null, data: mapped });
});

router.post('/admin/transactions/pending/remove/:id', adminAuth, async (req, res) => {
    if (typeof (req.params.id) !== 'string') return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'Invalid ID!'
        },
        data: null
    });

    let transaction = await PendingTransaction.findOne({ transactionId: req.params.id });
    if (!transaction) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'Invalid ID!'
        },
        data: null
    });

    try {
        await redis.deletePendingTransaction(req.params.id);
        await transaction.remove();
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
            message: 'Pending transaction removed successfully!'
        }
    });
});

router.get('/admin/groups', adminAuth, async (req, res) => {
    let groups = await redis.getGroups();

    res.status(200).json({ status: 'ok', error: null, data: groups });
});

router.post('/admin/groups/remove', adminAuth, async (req, res) => {
    const { error } = validator.groupRemove(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    let group = await Group.findOne({ groupId: req.body.groupId })

    if (!group) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'That group is not stocked!'
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

router.get('/admin/promocodes/list', adminAuth, async (req, res) => {
    let promocodes = await Code.find();

    res.status(200).json({ status: 'ok', error: null, data: promocodes });
});

router.post('/admin/reseller/create', adminAuth, async (req, res) => {
    const { error } = validator.resellerCreation(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    req.body.username = req.body.username.toLowerCase();

    const resellerExists = await Reseller.findOne({ username: req.body.username });
    if (resellerExists) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'A reseller with that username already exists!'
        },
        data: null
    });

    let password = uuid();
    let hashedPassword = await bcrypt.hash(password, 10);
    let reseller = new Reseller({
        username: req.body.username,
        password: hashedPassword,
        rewardRates: req.body.rewardRates,
        saleRates: req.body.saleRates
    });

    try {
        const saved = await reseller.save();
        await redis.addReseller(saved);
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
            password: password,
            message: "Reseller created successfully!"
        }
    });
});

router.post('/admin/reseller/delete', adminAuth, async (req, res) => {
    const { error } = validator.userValidation(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    req.body.username = req.body.username.toLowerCase();

    const reseller = await Reseller.findOne({ username: req.body.username });
    if (!reseller) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'Reseller not found!'
        },
        data: null
    });


    try {
        await redis.removeReseller(reseller);
        await reseller.remove();
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
            message: "Reseller deleted successfully!"
        }
    });
});

router.post('/admin/site/rates/change', adminAuth, async (req, res) => {
    const { error } = validator.ratesChange(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });


    const rates = await Rate.findOne();

    rates.offerwallRate = req.body.offerwallRate || rates.offerwallRate;
    rates.salesRate = req.body.salesRate || rates.salesRate;
    rates.dailyReward = req.body.dailyReward || rates.dailyReward;
    rates.faucetBase = req.body.faucetBase || rates.faucetBase;
    rates.gameRate = req.body.gameRate || rates.gameRate;
    rates.captchaRate = req.body.captchaRate || rates.captchaRate;

    try {
        const saved = await rates.save();
        await redis.setRates(rates);
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
            message: "Site rates updated successfully!"
        }
    });
});

router.post('/admin/reseller/rates/change', adminAuth, async (req, res) => {
    const { error } = validator.resellerRatesChange(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });


    const reseller = await Reseller.findOne({ username: req.body.username.toLowerCase() });

    reseller.rewardRates = req.body.rewardRates || reseller.rewardRates;
    reseller.saleRates = req.body.saleRates || reseller.saleRates;
    reseller.faucetRates = req.body.faucetRates || reseller.faucetRates;

    try {
        const saved = await reseller.save();
        await redis.updateReseller(saved._id, saved);
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
            message: "Reseller rates updated successfully!"
        }
    });
});

router.post('/admin/transactions/whitelist/update', adminAuth, async (req, res) => {
    const { error } = validator.userValidation(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    req.body.username = req.body.username.toLowerCase();

    const whitelisted = await TransactionWhitelisted.findOne({ username: req.body.username });

    if (whitelisted) {
        await redis.removeTransactionWhitelist(req.body.username);
        await whitelisted.remove();
        return res.status(200).json({
            status: 'ok',
            error: null,
            data: {
                message: 'Account transaction whitelist revoked successfully!'
            }
        });
    }

    const transactionWhitelisted = new TransactionWhitelisted({ username: req.body.username });

    try {
        await transactionWhitelisted.save();
        await redis.addTransactionWhitelist(req.body.username);
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
            message: 'Account transaction whitelist added successfully!'
        }
    });
});


module.exports = router;