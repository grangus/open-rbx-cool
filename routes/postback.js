//modules
const router = require('express').Router();
const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
const moment = require('moment');
//custom modules
const redis = require('../modules/redis');
const webhook = require('../modules/webhook');

//models
const User = require('../models/User');
const Stats = require('../models/Stat');
const PendingTransaction = require('../models/PendingTransaction');
const TodaysCompleted = require('../models/TodaysCompleted');

//misc
const offerwallMeta = require('../misc/offerwallMeta');


router.all('/postback/credit/:userId/:amount/:transactionId/:secret/:source', async (req, res) => {
    return res.status(403).json({
        status: 'error',
        error: {
            code: 403,
            message: 'Unauthorized!'
        },
        data: null
    });
    
    if (!req.params.secret || req.params.secret !== process.env.POSTBACK_SECRET) return res.status(403).json({
        status: 'error',
        error: {
            code: 403,
            message: 'Unauthorized!'
        },
        data: null
    });

    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'Invalid user ID!'
        },
        data: null
    });

    if (isNaN(req.params.amount)) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'Invalid credit amount!'
        },
        data: null
    });

    if (typeof (req.params.transactionId) !== 'string') return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'Invalid transaction ID!'
        },
        data: null
    });

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'User not found!'
        },
        data: null
    });

    //if the credit postback isnt from a purchase
    if (req.params.source !== 'selly') {
        if (typeof (req.params.source) !== 'string' || !offerwallMeta.find(o => o.offerwall.toLowerCase() == req.params.source.toLowerCase())) return res.status(400).json({
            status: 'error',
            error: {
                code: 400,
                message: 'Invalid offerwall name!'
            },
            data: null
        });

        const stat = await Stats.findOne();
        const rates = await redis.getRates();
        const creditAmount = Math.floor(((parseFloat(req.params.amount) / 100) * (1000 / rates.offerwallRate)) * 100);
        const offerwall = offerwallMeta.find(o => o.offerwall.toLowerCase() == req.params.source.toLowerCase());
        const referralCreditAmount = Math.ceil((creditAmount / 100) * parseInt(process.env.REFERRAL_REWARD_PERCENTAGE));

        let referer = null;

        if (user.referer !== null) {
            referer = await User.findById(user.referer);
        }

        //if the amount is negative, it means a chargeback occurred
        if (creditAmount < 0) {
            //check if the pending transaction exists
            let transaction = await redis.getPendingTransaction(req.params.transactionId);

            //if the transaction has been credited & the user cannot afford to go negative(he withdrew), ban the user
            if (!transaction && ((user.balance + user.purchasedBalance + user.entryBalance) + creditAmount) < 0) {
                user.banned = !user.banned;

                try {
                    const saved = await user.save();
                    await redis.updateUser(saved._id, saved);
                } catch (error) {
                    console.log('postback error');
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

                return res.status(offerwall.statusCode).send(offerwall.successResponse);
            }

            //if the transaction has been credited and the user can afford to return the credit, subtract the credit from the user
            if (!transaction && ((user.balance + user.purchasedBalance + user.entryBalance) + creditAmount) >= 0) {
                let totalBalance = user.balance + user.purchasedBalance + user.entryBalance;
                let toSubtract = (user.balance + user.purchasedBalance + user.entryBalance) + creditAmount;

                for (i = totalBalance; i < toSubtract; i--) {
                    if (user.balance > 0) {
                        user.balance--;
                    } else {
                        if (user.entryBalance > 0) {
                            user.entryBalance--;
                        } else {
                            user.purchasedBalance--;
                        }
                    }
                }

                try {
                    const saved = await user.save();
                    await redis.updateUser(saved._id, saved);
                } catch (error) {
                    console.log('postback error');
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

                return res.status(offerwall.statusCode).send(offerwall.successResponse);
            }

            //if the transaction still exists, remove it

            try {
                await redis.deletePendingTransaction(req.params.transactionId);
            } catch (error) {
                console.log('postback error');
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

            return res.status(offerwall.statusCode).send(offerwall.successResponse);
        }

        //this should create a pending transaction and save it
        if (creditAmount >= offerwall.pendingAmount) {
            const pending = new PendingTransaction({
                amount: creditAmount,
                transactionId: req.params.transactionId,
                userId: user._id,
                username: user.username,
                creditTimestamp: Date.now() + 86400000,
                ref: referer,
                refAmount: referralCreditAmount
            });

            const saved = await pending.save();
            await redis.addPendingTransaction(saved);

            return res.status(offerwall.statusCode).send(offerwall.successResponse);
        }

        //update user balance, add user to daily offers completed, update site stats, emit socket event, post webhook, award referrer

        if (referer) {
            referer.balance += referralCreditAmount;
            referer.totalEarned += referralCreditAmount;
            await referer.save();
            await redis.updateUser(referer._id, referer);
        }

        const completed = new TodaysCompleted({
            userId: user._id,
            username: user.username,
            amount: creditAmount,
            timestamp: Date.now()
        });


        user.balance += creditAmount;
        user.totalEarned += creditAmount;

        user.latestTransactions.unshift({
            type: 'Credit',
            destination: 'wallet',
            amount: `+R$${creditAmount.toLocaleString()}`,
            color: 'green',
            time: Date.now()
        });
    
        user.latestTransactions = user.latestTransactions.splice(0, 4);

        stat.offersCompleted++;

        const saved = await user.save();
        const completedSaved = await completed.save();
        const savedStat = await stat.save();

        await redis.updateUser(saved._id, saved);
        await redis.addCompletedToday(completedSaved);
        await redis.setStats(savedStat);

        let embed = webhook.generatePostbackEmbed(saved.username, saved.email, saved.balance, req.params.source);
        webhook.postPrivateEmbed(embed);

        return res.status(offerwall.statusCode).send(offerwall.successResponse);
    } else {
        //add user balance, post message to private webhook

        if (req.body.status == 51) {
            user.banned = true;

            let saved = await user.save();
            await redis.updateUser(saved._id, saved);

            return res.status(200).send({
                status: "ok",
                error: null,
                data: {
                    message: "User banned!"
                }
            });
        }


        if (req.body.status !== 100) return res.status(200).send({
            status: "ok",
            error: null,
            data: {
                message: "Webhook received!"
            }
        });

        try {
            let amount = parseInt(req.params.amount);
            let referralCreditAmount = Math.ceil((amount / 100) * parseInt(process.env.REFERRAL_SALE_REWARD_PERCENTAGE));

            let referer = null;

            if (user.referer !== null) {
                referer = await User.findById(user.referer);
            }

            if (referer) {
                referer.balance += referralCreditAmount;
                referer.totalEarned += referralCreditAmount;
                await referer.save();
                await redis.updateUser(referer._id, referer);
            }

            user.purchasedBalance += amount;

            user.latestTransactions.unshift({
                type: 'Credit',
                destination: 'wallet',
                amount: `+R$${amount.toLocaleString()}`,
                color: 'green',
                time: Date.now()
            });
    
            user.latestTransactions = user.latestTransactions.splice(0, 4);

            let saved = await user.save();
            await redis.updateUser(saved._id, saved);
        } catch (error) {
            console.log('selly error')
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

        res.status(200).send({
            status: "ok",
            error: null,
            data: {
                message: "R$ added to balance successfully!"
            }
        });

        let embed = webhook.generatePurchaseEmbed(user.username, user.email || 'None', parseInt(req.params.amount).toLocaleString())
        webhook.postSaleEmbed(embed);
    }

});

module.exports = router;