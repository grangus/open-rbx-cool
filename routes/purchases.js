//modules
const router = require('express').Router();
const dotenv = require('dotenv').config();
const moment = require('moment');
const coinbase = require('coinbase-commerce-node');
const Webhook = coinbase.Webhook;
const charge = coinbase.resources.Charge;
const Client = coinbase.Client;

Client.init(process.env.COINBASE_SECRET);

//custom modules
const selly = require('../modules/selly');
const validator = require('../modules/validator');
const redis = require('../modules/redis');
const paypal = require('../modules/paypal');
const hook = require('../modules/webhook');

//middlewares
const userAuth = require('../middlewares/userAuth');
const fpCheck = require('../middlewares/fpCheck');
const ipCheck = require('../middlewares/ipCheck');
const ipqs = require('../middlewares/ipqs');
const ipqsDevice = require('../middlewares/ipqsDevice');

//models
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Reseller = require('../models/Reseller');

//misc
const paymentMethods = require('../misc/paymentMethods');

router.get('/purchases/meta', async (req, res) => {
    let rates = await redis.getRates();

    res.status(200).json({
        status: 'ok',
        error: null,
        data: {
            rates: rates.salesRate
        }
    })
});

router.post('/purchases/beta/crypto/checkout', ipCheck, fpCheck, userAuth, async (req, res) => {
    const { error } = validator.purchaseValidation(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    const method = paymentMethods.find(m => m.name.toLowerCase() == 'bitcoin');

    if (req.body.amount > method.maxPurchase) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: `You can only purchase a maximum of R$${method.maxPurchase.toLocaleString()} worth of R$ with ${method.name} at a time.`
        },
        data: null
    });

    if (req.body.amount < method.minPurchase) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: `You can only purchase a minimum of R$${method.minPurchase.toLocaleString()} worth of R$ with ${method.name}.`
        },
        data: null
    });

    let stock = await redis.getStock();

    if (stock < req.body.amount) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'There is currently not enough stock for the transaction you are trying to complete! Please try purchasing a smaller amount or try again later!'
        },
        data: null
    });

    let rates = await redis.getRates();
    let options = {
        'name': 'Robux for Roblox',
        'description': `${req.body.amount.toLocaleString()} R$ for Roblox`,
        'pricing_type': 'fixed_price',
        'local_price': {
            'amount': Math.floor((parseInt(req.body.amount) / 1000 * rates.salesRate) * 100) / 100,
            'currency': 'USD'
        },
        "redirect_url": 'https://rbx.cool/dashboard',
        "cancel_url": 'https://rbx.cool/dashboard'
    };

    try {
        let result = await charge.create(options);

        let transaction = new Transaction({
            transactionId: result.id,
            transactionIp: req.ipAddress,
            userId: req.user._id,
            type: 'crypto',
            status: 'incomplete',
            purchasedAmount: req.body.amount,
            usdAmount: Math.floor((parseInt(req.body.amount) / 1000 * rates.salesRate) * 100) / 100,
            remaining: req.body.amount,
            timestamp: Date.now()
        });

        await transaction.save();
        res.status(200).json({
            status: 'ok',
            data: {
                url: result.hosted_url
            },
            error: null
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: 'error',
            error: 'There was an error creating your payment!',
            data: null
        });
    }
});

router.post('/purchases/coinbase/listener', async (req, res) => {
    let event;

    try {
        event = Webhook.verifyEventBody(req.rawBody, req.headers['x-cc-webhook-signature'], process.env.COINBASE_WEBHOOK_SECRET);
    } catch (error) {
        console.log('failed to verify webhook again');
        return res.status(500).json({
            status: 'error',
            error: 'There was an error with the webhook!',
            data: null
        });
    }

    if (event.type == 'charge:confirmed' || event.type == 'charge:resolved') {
        let transaction = await Transaction.findOne({ transactionId: event.data.id, status: 'incomplete' });

        if (transaction) {
            try {
                let user = await User.findById(transaction.userId);
                let referralCreditAmount = Math.ceil((transaction.purchasedAmount / 100) * parseInt(process.env.REFERRAL_SALE_REWARD_PERCENTAGE));

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

                if(transaction.userId == '5e77aec52f001b3503421d02') {
                    console.log('BUG');
                    console.log(transaction);
                    console.log(result);
                }
                
                user.latestTransactions.unshift({
                    type: 'Credit',
                    destination: 'wallet',
                    amount: `+R$${transaction.purchasedAmount.toLocaleString()}`,
                    color: 'green',
                    time: Date.now()
                });

                user.purchasedBalance += transaction.purchasedAmount;
                user.latestTransactions = user.latestTransactions.splice(0, 4);
                transaction.status = 'complete';

                let saved = await user.save();

                await transaction.save();
                await redis.updateUser(saved._id, saved);

                let embed = hook.generateCryptoPurchaseEmbed(user.username, transaction.purchasedAmount.toLocaleString(), transaction.transactionIp);
                hook.postSaleEmbed(embed);
            } catch (error) {
                console.log(error);
                return res.status(500).json({
                    status: 'error',
                    error: 'There was an error with the webhook!',
                    data: null
                });
            }
        }
    }

    res.status(200).send('OK');
});

router.post('/purchases/ipn/listener', async (req, res) => {
    //console.log(req.body);

    res.status(200).send('OK');
    let postData = 'cmd=_notify-validate';

    Object.keys(req.body).map((key) => {
        postData = `${postData}&${key}=${req.body[key]}`;
    });

    try {
        await paypal.sendEcho(postData);
    } catch (error) {
        return console.log(error);
    }

    if (req.body.payment_status == 'Completed') {
        let paypalBanned = await redis.checkPaypalBan(req.body.payer_email);
        if (paypalBanned) return console.log('ignored postback from banned email');
        //check if txn_id exists in the db and isnt completed
        let transaction = await Transaction.findOne().or([{ transactionId: req.body.txn_id, status: 'incomplete' }, { customId: req.body.custom, status: 'incomplete' }]);

        //if it hasnt been completed, complete the transaction
        if (transaction) {
            let user = await User.findById(transaction.userId);
            let referralCreditAmount = Math.ceil((transaction.purchasedAmount / 100) * parseInt(process.env.REFERRAL_SALE_REWARD_PERCENTAGE));

            let referer = null;

            if (user.referer !== null) {
                referer = await User.findById(user.referer);
            }

            if (!transaction.transactionId) {
                transaction.transactionId = req.body.txn_id;
            }

            if (referer) {
                referer.balance += referralCreditAmount;
                referer.totalEarned += referralCreditAmount;
                await referer.save();
                await redis.updateUser(referer._id, referer);
            }

            if(transaction.userId == '5e77aec52f001b3503421d02') {
                console.log('BUG');
                console.log(transaction);
                console.log(result);
            }

            user.latestTransactions.unshift({
                type: 'Credit',
                destination: 'wallet',
                amount: `+R$${transaction.purchasedAmount.toLocaleString()}`,
                color: 'green',
                time: Date.now()
            });

            user.purchasedBalance += transaction.purchasedAmount;
            user.latestTransactions = user.latestTransactions.splice(0, 4);
            transaction.status = 'complete';

            let saved = await user.save();

            await transaction.save();
            await redis.updateUser(saved._id, saved);

            //post sale embed to discord logs
            let embed = hook.generatePurchaseEmbed(user.username, req.body.payer_email, transaction.purchasedAmount.toLocaleString(), transaction.transactionId, transaction.transactionIp);
            hook.postSaleEmbed(embed);
        }
    }

    if (req.body.payment_status == 'Pending') {
        //send automated email to the client notifying them of their pending payment
    }

    if (req.body.payment_status == 'Reversed') {
        //ban the cb'er
        //transaction id is parent_txn_id instead of txn_id because the reversal 
        //is also a transaction and has its own id as well
        let transaction = await Transaction.findOne({ transactionId: req.body.parent_txn_id });

        //console.log('got a cb');
        //console.log(transaction);
        //console.log(req.body);

        if (transaction) {
            let user = await User.findById(transaction.userId);

            user.banned = true;

            await user.save();
            await redis.addPaypalBan(req.body.payer_email);
            
            transaction.subTransactions.forEach(async (t) => {
                let reseller = await Reseller.findById(t.resellerId);

                reseller.chargebackTotal += t.robuxAmount;

                await reseller.save();
            });
            //add a discord webhook to this
            try {
                //post registration ip with this
                let embed = hook.generateChargebackEmbed(user.username, req.body.payer_email, transaction.purchasedAmount.toLocaleString(), user.registrationIp, req.body.parent_txn_id, transaction.transactionIp);
                hook.postSaleEmbed(embed);
            } catch (error) {
                console.error(error);
            }
        }
    }

    //console.log('unidentified status');
    //console.log(req.body);
    //if the ipn transaction id does not exist in the database, that means the payment was not related to rbx.cool and should be ignored
    //if ipn is "Completed" checkout or w/e, check if a transaction with txn_id exists in the db, if so, modify transaction and credit the user
    //if the ipn type is a pending notification, send an email to user notifying them that they will get robux once the transaction has finished 
    //if the ipn is a chargeback/reversal, find the subtransactions of the transaction, subtract sold robux from the associated resellers' balances
    //ban the user
});

router.post('/purchases/beta/paypal/checkout', ipCheck, fpCheck, userAuth, ipqsDevice, async (req, res) => {
    const { error } = validator.purchaseValidation(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    const whitelisted = await redis.checkTransactionWhitelist(req.user.username);
    if(!whitelisted) {
        if(req.quality.proxy == true || req.quality.vpn == true || req.quality.tor == true) {
            let embed = hook.generatePurchaseVpnEmbed(req.user.username, req.ipAddress, req.quality.fraud_chance);
    
            hook.postFraudEmbed(embed);

            return res.status(400).json({
                status: 'error',
                error: {
                    code: 400,
                    message: "You seem to be using a proxy/VPN. Please disable it try again!"
                },
                data: null
            });
        }

        if(req.quality.fraud_chance > 70) {

            // try {
            //     const user = await User.findById(req.user._id);
                
            //     user.banned = true;
    
            //     const mongoUser = await user.save();
            //     const redisUser = await redis.updateUser(mongoUser._id, mongoUser);
            // } catch (error) {
            //     return res.status(500).json({
            //         status: 'error',
            //         error: {
            //             code: 400,
            //             message: 'Internal error!'
            //         },
            //         data: null
            //     });
            // }
    
            let embed = hook.generateFraudEmbed(req.user.username, req.ipAddress, req.quality.fraud_chance, req.body.amount);
    
            hook.postFraudEmbed(embed);
    
            return res.status(400).json({
                status: 'error',
                error: {
                    code: 400,
                    message: 'Your transaction has been declined. Please join our Discord server and open a support ticket to complete your purchase! You will not be able to purchase until a staff member has assisted you.'
                },
                data: null
            });
        }
    }

    const method = paymentMethods.find(m => m.name.toLowerCase() == 'paypal');

    if (req.body.amount > method.maxPurchase) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: `You can only purchase a maximum of R$${method.maxPurchase.toLocaleString()} worth of R$ with ${method.name} at a time.`
        },
        data: null
    });

    if (req.body.amount < method.minPurchase) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: `You can only purchase a minimum of R$${method.minPurchase.toLocaleString()} worth of R$ with ${method.name}.`
        },
        data: null
    });

    let stock = await redis.getStock();

    if (stock < req.body.amount) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'There is currently not enough stock for the transaction you are trying to complete! Please try purchasing a smaller amount or try again later!'
        },
        data: null
    });

    try {
        let rates = await redis.getRates();
        let result = await paypal.createPayment(Math.floor((parseInt(req.body.amount) / 1000 * rates.salesRate) * 100) / 100, req.user.username);
        //save payment to db with "incomplete" status in the db
        let usdAmount = Math.floor((parseInt(req.body.amount) / 1000 * rates.salesRate) * 100) / 100;
        let fee = ((usdAmount / 100) * 5.4) + 0.3;

        console.log(result);

        let transaction = new Transaction({
            orderId: result.orderID,
            customId: result.custom,
            transactionIp: req.ipAddress,
            userId: req.user._id,
            type: 'paypal',
            status: 'incomplete',
            purchasedAmount: req.body.amount,
            feeRate: fee / parseInt(req.body.amount),
            usdAmount: usdAmount,
            remaining: req.body.amount,
            timestamp: Date.now()
        });

        await transaction.save();

        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: 'error',
            error: error,
            data: null
        });
    }
});

router.post('/purchases/beta/paypal/checkout/complete', fpCheck, userAuth, async (req, res) => {
    const { error } = validator.betaPurchaseCompleteValidation(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    try {
        //change the status of the order to "complete", credit the user and add a recent transaction to the user object
        let result = await paypal.capturePayment(req.body.orderID);

        let paypalBanned = await redis.checkPaypalBan(result.payer.email_address);
        if (paypalBanned) return res.status(403).json({
            status: 'error',
            error: {
                code: 403,
                message: 'Your PayPal has been banned from our website! Your Robux will not be credited to your account. If you believe this is an error, please contact us via email @ staff@rbx.cool.'
            },
            data: null
        });

        //console.log(result.purchase_units[0].payments.captures[0]);

        if (result.purchase_units[0].payments.captures[0].status !== 'COMPLETED') {
            console.log('potential pending payment');
            console.log(result.purchase_units[0].payments.captures[0]);
            let embed = hook.generateAltPurchaseEmbed(user.username, result.payer.email_address, transaction.purchasedAmount.toLocaleString(), transaction.transactionId, transaction.transactionIp, result.purchase_units[0].payments.captures[0].status);
            hook.postSaleEmbed(embed);
            return res.status(200).json({
                status: 'ok',
                data: {
                    message: 'Purchase was successful, however, it seems your payment has gone pending. Pending payments can take up to 24hrs to process & will automatically be credited to your RBX.COOL account. Contact an admin for more information.'
                },
                error: null
            });
        }

        let transaction = await Transaction.findOne({ orderId: req.body.orderID, status: 'incomplete' });
        let user = await User.findById(req.user._id);
        let referralCreditAmount = Math.ceil((transaction.purchasedAmount / 100) * parseInt(process.env.REFERRAL_SALE_REWARD_PERCENTAGE));

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

        if(req.user._id == '5e77aec52f001b3503421d02') {
            console.log('BUG');
            console.log(transaction);
            console.log(result);
        }
        user.latestTransactions.unshift({
            type: 'Credit',
            destination: 'wallet',
            amount: `+R$${transaction.purchasedAmount.toLocaleString()}`,
            color: 'green',
            time: Date.now()
        });

        user.purchasedBalance += transaction.purchasedAmount;
        user.latestTransactions = user.latestTransactions.splice(0, 4);
        transaction.status = 'complete';
        transaction.transactionId = result.purchase_units[0].payments.captures[0].id;

        let saved = await user.save();

        await transaction.save();
        await redis.updateUser(saved._id, saved);

        res.status(200).json({
            status: 'ok',
            data: {
                message: 'Purchase successful! Your balance should be credited to your RBX.COOL account shortly! You can withdraw your balance from the dashboard. You have been automatically entered into the weekly R$ raffle.'
            },
            error: null
        });

        let embed = hook.generatePurchaseEmbed(user.username, result.payer.email_address, transaction.purchasedAmount.toLocaleString(), transaction.transactionId, transaction.transactionIp);
        hook.postSaleEmbed(embed);
    } catch (error) {
        console.log('checkout error')
        console.log(error);
        return res.status(500).json({
            status: 'error',
            error: error,
            data: null
        });
    }
});

router.post('/purchases/:method/create/', fpCheck, userAuth, async (req, res) => {
    return res.status(403).json({
        status: 'error',
        error: {
            code: 403,
            message: 'Unauthorized!'
        },
        data: null
    });

    const { error } = validator.purchaseValidation(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    const method = paymentMethods.find(m => m.name.toLowerCase() == req.params.method.toLowerCase());

    if (!method) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'Invalid payment method!'
        },
        data: null
    });

    if (req.body.amount > method.maxPurchase) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: `You can only purchase a maximum of R$${method.maxPurchase.toLocaleString()} worth of R$ with ${method.name} at a time.`
        },
        data: null
    });

    if (req.body.amount < method.minPurchase) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: `You can only purchase a minimum of R$${method.minPurchase.toLocaleString()} worth of R$ with ${method.name}.`
        },
        data: null
    });

    let stock = await redis.getStock();

    if (stock < req.body.amount) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'There is currently not enough stock for the transaction you are trying to complete! Please try purchasing a smaller amount or try again later!'
        },
        data: null
    });

    try {
        let payment = await selly.createPayment(method.name, req.body.amount, req.user._id);

        res.status(200).json({
            status: 'ok',
            error: null,
            data: {
                url: payment.url
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            error: {
                code: 500,
                message: error
            },
            data: null
        });
    }
});

module.exports = router;