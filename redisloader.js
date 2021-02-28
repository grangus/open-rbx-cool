//modules
const Redis = require('ioredis');
const mongoose = require('mongoose');
const chalk = require('chalk');
const _ = require('lodash');
const uuid = require('uuid/v4');

//models
const Group = require('./models/Group');
const User = require('./models/User');
const Stat = require('./models/Stat');
const Rate = require('./models/Rate');
const BannedIp = require('./models/BannedIp');
const InvalidToken = require('./models/InvalidToken');
const PendingTransaction = require('./models/PendingTransaction');
const TodaysRedeemed = require('./models/TodaysRedeemed');
const TodaysCompleted = require('./models/TodaysCompleted');
const Announcement = require('./models/Announcement');
const BannedRoblox = require('./models/BannedRoblox');
const BannedFingerprint = require('./models/BannedFingerprint');
const BannedPaypal = require('./models/BannedPaypal');
const Reseller = require('./models/Reseller');
const Admin = require('./models/Admin');
const TransactionWhitelisted = require('./models/TransactionWhitelisted');
const BypassToken = require('./models/BypassToken');

try {
    global.redisConnection = new Redis();
} catch (error) {
    console.log('Failed to connect to Redis. Was it started on the system?');
    process.exit();
}

console.log(chalk.green('Connecting to MongoDB...'));
mongoose.connect('mongodb://127.0.0.1:27017/rewards', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true }, async () => {
    console.log(chalk.green('Connected to MongoDB!'));

    console.log(chalk.green('Flushing Redis cache...'));
    await redisConnection.flushall();

    await redisConnection.set('ayet', JSON.stringify([]));

    console.log(chalk.green('Loading groups...'));
    let groups = await Group.find({});
    console.log(chalk.green('Setting up groups...'));

    if (groups == null) {
        groups = [];
    }

    await redisConnection.set('groups', JSON.stringify(groups));

    console.log(chalk.green('Loading admins...'));
    let admins = await Admin.find({});

    let loadingAdmins = admins.map(async (a) => {
        await redisConnection.set(`admin-${a._id}`, JSON.stringify(a));
        await redisConnection.sadd('adminmap', a._id);
    });

    await Promise.all(loadingAdmins);

    console.log(chalk.green('Loading resellers...'));
    let resellers = await Reseller.find({});

    let loadingResellers = resellers.map(async (r) => {
        await redisConnection.set(`reseller-${r._id}`, JSON.stringify(r));
        await redisConnection.sadd('resellermap', r._id);
    });

    await Promise.all(loadingResellers);

    console.log(chalk.green('Loading users...'));
    let users = await User.find({});

    //await User.updateMany({}, {$set: {fp: "not set"}})
    console.log(chalk.green('Setting up users...'));
    let loadingUsers = users.map(async (u) => {
        await redisConnection.set(u._id, JSON.stringify(u));
        await redisConnection.sadd('idmap', u._id);
    });

    let sorted = _.sortBy(users, ['totalEarned']).slice(-25).reverse();
    let leaderboard = _.map(sorted, _.partialRight(_.pick, ['totalEarned', 'username']));

    await redisConnection.set('leaderboard', JSON.stringify(leaderboard));

    await Promise.all(loadingUsers);
    console.log(chalk.green(`${users.length} user(s) loaded!`));

    console.log(chalk.green('Loading announcement...'));
    let announcement = await Announcement.findOne({});

    if (!announcement) {
        let announced = new Announcement({ announcement: 'Welcome to RBX.COOL!', id: uuid() });
        announcement = await announced.save();
    }

    await redisConnection.set('announcement', JSON.stringify(announcement));

    console.log(chalk.green('Loading stats...'));
    let stats = await Stat.findOne({});

    if (!stats) {
        let stat = new Stat();
        stats = await stat.save();
    }

    console.log(chalk.green('Setting up stats...'));
    await redisConnection.set('stats', JSON.stringify(stats));
    await redisConnection.set('stock', 0);
    //await redisConnection.set('faucet', JSON.stringify({ running: false, value: 0, endsIn: 0, usersEntered: [] }));

    console.log(chalk.green('Loading rates...'));
    let rates = await Rate.findOne({});

    if (!rates) {
        let rate = new Rate();
        rates = await rate.save();
    }

    console.log(chalk.green('Setting up rates...'));
    await redisConnection.set('rates', JSON.stringify(rates));

    console.log(chalk.green('Setting up faucet...'));
    await redisConnection.set('faucetentries', JSON.stringify([]));
    await redisConnection.set('faucetwinner', 'No one!');
    
    console.log(chalk.green('Loading pending transactions...'));
    let pendingTransactions = await PendingTransaction.find({});
    
    let loadingPending = pendingTransactions.map(async (i) => {
        await redisConnection.sadd('pendingtransactions', i.transactionId);
        await redisConnection.set(`pending-${i.transactionId}`, JSON.stringify(i));
    });

    await Promise.all(loadingPending);

    console.log(chalk.green('Loading redeemed...'));
    let redeemedToday = await TodaysRedeemed.find({});

    let loadingRedeemed = redeemedToday.map(async (i) => {
        await redisConnection.sadd('redeemedtoday', i);
    });

    await Promise.all(loadingRedeemed);

    console.log(chalk.green('Loading completed offers...'));
    let completed = await TodaysCompleted.find({});

    let loadingCompleted = completed.map(async (i) => {
        await redisConnection.sadd('completedtoday', i);
    });

    await Promise.all(loadingCompleted);

    console.log(chalk.green('Loading banned IPs...'));
    let banned = await BannedIp.find({});

    console.log(chalk.green('Setting up banned IPs...'));
    let loadingIps = banned.map(async (i) => {
        await redisConnection.sadd('bannedips', i.ip);
    });

    await Promise.all(loadingIps);

    console.log(chalk.green('Loading banned fingerprints...'));
    let bannedFps = await BannedFingerprint.find({});

    console.log(chalk.green('Setting up banned fingerprints...'));
    let loadingFps = bannedFps.map(async (i) => {
        await redisConnection.sadd('bannedfps', i.fp);
    });

    await Promise.all(loadingFps);

    console.log(chalk.green('Loading banned Roblox accounts...'));
    let bannedRoblox = await BannedRoblox.find({});

    console.log(chalk.green('Setting up banned Roblox accounts...'));
    let loadingBannedAccs = bannedRoblox.map(async (i) => {
        await redisConnection.sadd('bannedrobloxaccounts', i.username);
    });

    await Promise.all(loadingBannedAccs);

    console.log(chalk.green('Loading banned PayPal emails...'));
    let bannedPaypal = await BannedPaypal.find({});

    console.log(chalk.green('Setting up banned PayPal emails...'));
    let loadingBannedPPs = bannedPaypal.map(async (i) => {
        await redisConnection.sadd('bannedpaypalemails', i.email);
    });

    await Promise.all(loadingBannedPPs);

    console.log(chalk.green('Loading invalidated tokens...'));
    let tokens = await InvalidToken.find({});

    console.log(chalk.green('Setting up invalidated tokens...'));
    let loadingTokens = tokens.map(async (t) => {
        await redisConnection.sadd('invalidtokens', t.token);
    });

    await Promise.all(loadingTokens);

    console.log(chalk.green('Loading transaction whitelisted...'));
    let transactionWhitelisted = await TransactionWhitelisted.find({});

    console.log(chalk.green('Setting up transaction whitelisted...'));
    let loadingWhitelisted = transactionWhitelisted.map(async (i) => {
        await redisConnection.sadd('transactionwhitelist', i.username);
    });

    await Promise.all(loadingWhitelisted);

    console.log(chalk.green('Loading bypass tokens...'));
    let bypasses = await BypassToken.find({});

    console.log(chalk.green('Setting up bypass tokens...'));
    let loadingBypasses = bypasses.map(async (t) => {
        await redisConnection.sadd('bypasstokens', t.token);
    });

    await Promise.all(loadingBypasses);
    
    console.log('Redis reloaded!');

    await mongoose.disconnect();
    await redisConnection.disconnect();
});