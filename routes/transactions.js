//modules
const router = require('express').Router();
const crypto = require('crypto');
const moment = require('moment');

//custom modules
const redis = require('../modules/redis');
const captcha = require('../modules/captcha');
const rbx = require('../modules/rbx');
const webhook = require('../modules/webhook');
const validator = require('../modules/validator');

//models
const User = require('../models/User');
const Stat = require('../models/Stat');
const Reseller = require('../models/Reseller');
const Transaction = require('../models/Transaction');

//middlewares
const userAuth = require('../middlewares/userAuth');
const fpCheck = require('../middlewares/fpCheck');

router.post('/transactions/create', fpCheck, userAuth, async (req, res) => {
    const { error } = validator.createTransaction(req.body);
    if (error) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: error.details[0].message
        },
        data: null
    });

    req.body.amount = parseInt(req.body.amount);
    
    let banned = await redis.checkRobloxBan(req.body.username);
    if (banned) return res.status(403).json({
        status: 'error',
        error: {
            code: 403,
            message: 'There was an issue creating your transaction! Please try again later!'
        },
        data: null
    });

    let isTransacting = await redis.checkTransactionLock(req.user._id);
    if (isTransacting) return res.status(409).json({
        status: 'error',
        error: {
            code: 409,
            message: 'You currently have another transaction in progress! If you would like to cancel the transaction, press cancel.'
        },
        data: null
    });

    if ((req.user.balance + req.user.purchasedBalance + req.user.entryBalance) < req.body.amount) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'You do not have enough funds to withdraw that amount! Please try withdrawing a smaller amount!'
        },
        data: null
    });

    let stock = await redis.getStock();

    if (stock < req.body.amount) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'There is currently not enough stock for the transaction you are trying to complete! Please try again later!'
        },
        data: null
    });

    let groups = await redis.getGroups();

    let temp = groups.filter(g => g.stockerName == "jake");

    temp.forEach((tg) => {
        let index = groups.findIndex(g => g.groupId == tg.groupId);
        groups.splice(index, 1);
        groups.unshift(tg);
    });

    let payoutGroup = groups.find(g => g.balance >= req.body.amount);
    //let payoutGroups = groups.filter(g => g.balance >= req.body.amount);
    //let payoutGroup = payoutGroups[Math.floor(Math.random() * payoutGroups.length)];

    //console.log(payoutGroup);
    if (!payoutGroup) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'There are no groups with enough balance to complete your transaction! Please try with a smaller amount!'
        },
        data: null
    });

    try {
        await redis.enableTransactionLock(req.user._id);
    } catch (error) {
        console.log('redis error');
        console.log(error);
        return res.status(400).json({
            status: 'error',
            error: {
                code: 400,
                message: 'Internal error!'
            },
            data: null
        });

    }

    let accountId;

    try {
        accountId = await rbx.getIdFromUsernameLegacy(req.body.username);
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            status: 'error',
            error: {
                code: 400,
                message: error.message
            },
            data: null
        });
    }

    await redis.addTransaction(req.user._id, req.body.amount, req.body.username, accountId, payoutGroup.groupId);

    res.status(200).json({
        status: "ok",
        error: null,
        data: {
            message: "Transaction created successfully!",
            groupName: payoutGroup.name,
            groupId: payoutGroup.groupId,
            groupImage: payoutGroup.groupImage
        }
    });
});

router.post('/transactions/complete', userAuth, async (req, res) => {
    let isTransacting = await redis.checkTransactionLock(req.user._id);
    if (!isTransacting) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'You currently do not have a transaction in progress!'
        },
        data: null
    });

    let transaction = await redis.getTransaction(req.user._id);
    let stock = await redis.getStock();

    // let banned = await redis.checkRobloxBan(req.body.username);
    // if (banned) return res.status(403).json({
    //     status: 'error',
    //     error: {
    //         code: 403,
    //         message: 'Sike nigga! You thought you were gonna withdraw!'
    //     },
    //     data: null
    // });

    if (stock < transaction.amount) {
        await redis.deleteTransaction(req.user._id);
        await redis.disableTransactionLock(req.user._id);
        return res.status(400).json({
            status: 'error',
            error: {
                code: 400,
                message: 'The site does not have enough stock to complete your transaction! Please try again!'
            },
            data: null
        });
    }

    let groups = await redis.getGroups();
    let payoutGroup = groups.find(g => g.groupId == transaction.groupId);

    //console.log(payoutGroup);
    if (!payoutGroup) {
        await redis.deleteTransaction(req.user._id);
        await redis.disableTransactionLock(req.user._id);
        return res.status(400).json({
            status: 'error',
            error: {
                code: 400,
                message: 'There are no groups with enough balance to complete your transaction! Please try with a smaller amount!'
            },
            data: null
        });
    }

    try {
        await rbx.verifyMembership(payoutGroup.groupId, transaction.accountId);
        await rbx.groupPayout(payoutGroup.groupId, transaction.accountId, transaction.amount, payoutGroup.cookie);
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            error: {
                code: 500,
                message: error.message || error
            },
            data: null
        });
    }

    const stats = await Stat.findOne();
    const user = await User.findById(req.user._id);
    const reseller = await Reseller.findById(payoutGroup.stockerId);
    const transactions = await Transaction.find({ userId: req.user._id, status: 'complete', type: 'paypal', remaining: { $gt: 0 }, feeRate: { $exists: true } });

    transaction.amount = parseInt(transaction.amount);

    stats.robuxPaid += transaction.amount;
    user.totalWithdrawed += transaction.amount;

    let totalBalance = user.balance + user.purchasedBalance + req.user.entryBalance;
    let toSubtract = (user.balance + user.purchasedBalance + req.user.entryBalance) - transaction.amount;

    for (i = totalBalance; i > toSubtract; i--) {
        if (user.balance > 0) {
            user.balance--;
            reseller.rewarded++;
        } else {
            if (user.entryBalance > 0) {
                user.entryBalance--;
                reseller.faucet++;
            } else {
                user.purchasedBalance--;
                reseller.sold++;
            }
        }
    }

    //i need to study algorithms
    //dont touch this plz
    if (transactions.length > 0) {
        let subtracting = transaction.amount;

        transactions.forEach(async (t, i) => {
            //t = transaction, i = index
            if (subtracting == 0) return;

            if (t.remaining >= subtracting) {
                //push the reseller id and amount withdrawn to the subtransactions for later use & save it
                t.subTransactions.push({ resellerId: payoutGroup.stockerId, robuxAmount: subtracting }); //might need to change this to USD later
                t.remaining -= subtracting;
                await t.save();

                let fee = t.feeRate * subtracting;
                reseller.transactionFees += fee;
                subtracting = 0;
            } else {
                //if the remaining amount in a transaction is less than the amount the user is withdrawing
                //subtract the remaining amount from the subtracting variable & create a subtransaction with the remaining amount
                let subtracted = subtracting;

                t.subTransactions.push({ resellerId: payoutGroup.stockerId, robuxAmount: t.remaining });

                let fee = t.feeRate * t.remaining;
                reseller.transactionFees += fee;


                subtracting -= t.remaining;
                t.remaining -= subtracted;

                await t.save();
            }
        });
    }

    //find purchase transactions associated with the current user id that have a remaining property greater than 0
    //if there are more than 0 transactions, create a for loop that adds sub transactions to the transaction and subtracts from the remaining amount
    //until there are no more transactions or if the transaction amount has become 0
    //update each transaction with an async map and use promise.all to await them

    user.latestTransactions.unshift({
        type: 'Withdraw',
        destination: transaction.accountName,
        amount: `-R$${transaction.amount.toLocaleString()}`,
        color: 'red',
        time: Date.now()
    });

    user.latestTransactions = user.latestTransactions.splice(0, 4);

    try {
        let savedStats = await stats.save();
        let savedUser = await user.save();
        let savedReseller = await reseller.save();

        await redis.setStats(savedStats);
        await redis.updateUser(savedUser._id, savedUser);
        await redis.updateReseller(savedReseller._id, savedReseller);
        await redis.deleteTransaction(req.user._id);
        await redis.disableTransactionLock(req.user._id);
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
            message: 'Payout successful!'
        }
    });

    let embed = webhook.generateWithdrawEmbed(user.username, transaction.accountName, transaction.amount, 'Not Available yet!');
    webhook.postWithdrawEmbed(embed);
});

router.post('/transactions/cancel', userAuth, async (req, res) => {
    let isTransacting = await redis.checkTransactionLock(req.user._id);
    if (!isTransacting) return res.status(400).json({
        status: 'error',
        error: {
            code: 400,
            message: 'You currently do not have a transaction in progress!'
        },
        data: null
    });

    try {
        await redis.deleteTransaction(req.user._id);
        await redis.disableTransactionLock(req.user._id);
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
            message: 'Transaction was cancelled successfully!'
        }
    });
});

module.exports = router;