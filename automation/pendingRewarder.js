//modules
const cron = require('node-cron');
const redis = require('../modules/redis');
const moment = require('moment');
//models
const PendingTransaction = require('../models/PendingTransaction');
const TodaysCompleted = require('../models/TodaysCompleted');
const User = require('../models/User');
const Stat = require('../models/Stat');

module.exports.start = () => {
    cron.schedule('* * * * *', async () => {
        const pending = await PendingTransaction.find();

        if (pending.length > 0) {
            pending.forEach(async (transaction) => {
                if (Date.now() >= transaction.creditTimestamp) {
                    const user = await User.findById(transaction.userId);
                    const stats = await Stat.findOne();

                    const completed = new TodaysCompleted({
                        userId: user._id,
                        username: user.username,
                        amount: transaction.amount,
                        timestamp: transaction.creditTimestamp
                    });

                    if (transaction.ref) {
                        const referrer = await User.findById(transaction.ref._id);
                        
                        referrer.balance += transaction.refAmount;

                        const saved = await referrer.save();
                        await redis.updateUser(saved._id, saved);
                    }

                    try {
                        let balance = user.balance + transaction.amount;
                        let totalEarned = user.totalEarned+ transaction.amount;
                        let latestTransactions = user.latestTransactions.unshift({
                            type: 'Credit',
                            destination: 'wallet',
                            amount: `+R$${transaction.amount.toLocaleString()}`,
                            color: 'green',
                            time: Date.now()
                        });
                    
                        latestTransactions = user.latestTransactions.splice(0, 4);
                        stats.offersCompleted++;

                        const saved = await completed.save();
                        const savedStats = await stats.save();
                        const savedUser = await user.updateOne({_id: user._id}, {$set: {latestTransactions: latestTransactions, totalEarned: totalEarned, balance: balance}});

                        await redis.addCompletedToday(saved);
                        await redis.updateUser(savedUser._id, savedUser);
                        await redis.setStats(savedStats);
                        await redis.deletePendingTransaction(transaction.transactionId);
                        await transaction.remove();
                    } catch (e) {
                        console.log('pending: ' + e);
                    }
                }
            });
        }
    });
};