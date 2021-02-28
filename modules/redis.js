const uuid = require('uuid/v4');
const _ = require('lodash');

module.exports = {
    checkTransactionLock: async (userId) => {
        let result = await redisConnection.sismember('transacting', userId);
        return result;
    },
    getTransaction: async (userId) => {
        let transaction = await redisConnection.get(`transaction-${userId}`);

        if(!transaction) {
            throw 'Transaction not found!'
        }

        return JSON.parse(transaction);
    },
    enableTransactionLock: async(userId) => {
        try {
            await redisConnection.sadd('transacting', userId);
        } catch (error) {
            throw error;
        }
    },
    disableTransactionLock: async (userId) => {
        try {
            await redisConnection.srem('transacting', userId);
        } catch (error) {
            throw error;
        }
    },
    addTransaction: async(userId, amount, accountName, accountId, groupId) => {
        try {
            await redisConnection.set(`transaction-${userId}`, JSON.stringify({amount: amount, accountName: accountName, accountId: accountId, groupId: groupId}));
        } catch (error) {
            throw error;
        }
    },
    deleteTransaction: async (userId) => {
        try {
            await redisConnection.del(`transaction-${userId}`);
        } catch (error) {
            throw error;
        }
    },
    checkIpBan: async (ip) => {
        let result = await redisConnection.sismember('bannedips', ip);
        return result;
    },
    addIpBan: async (ip) => {
        try {
            await redisConnection.sadd('bannedips', ip);
        } catch (error) {
            throw error;
        }
    },
    removeIpBan: async (ip) => {
        try {
            await redisConnection.srem('bannedips', ip);
        } catch (error) {
            throw error;
        }
    },
    checkFpBan: async (fp) => {
        let result = await redisConnection.sismember('bannedfps', fp);
        return result;
    },
    addFpBan: async (fp) => {
        try {
            await redisConnection.sadd('bannedfps', fp);
        } catch (error) {
            throw error;
        }
    },
    removeFpBan: async (fp) => {
        try {
            await redisConnection.srem('bannedfps', fp);
        } catch (error) {
            throw error;
        }
    },
    checkPaypalBan: async (email) => {
        let result = await redisConnection.sismember('bannedpaypalemails', email.toLowerCase());
        return result;
    },
    addPaypalBan: async (email) => {
        try {
            await redisConnection.sadd('bannedpaypalemails', email.toLowerCase());
        } catch (error) {
            throw error;
        }
    },
    removePaypalBan: async (email) => {
        try {
            await redisConnection.srem('bannedpaypalemails', email);
        } catch (error) {
            throw error;
        }
    },
    checkRobloxBan: async (username) => {
        let result = await redisConnection.sismember('bannedrobloxaccounts', username.toLowerCase());
        return result;
    },
    addRobloxBan: async (username) => {
        try {
            await redisConnection.sadd('bannedrobloxaccounts', username.toLowerCase());
        } catch (error) {
            throw error;
        }
    },
    removeRobloxBan: async (username) => {
        try {
            await redisConnection.srem('bannedrobloxaccounts', username);
        } catch (error) {
            throw error;
        }
    },
    getUserMap: async () => {
        let result = await redisConnection.smembers('idmap');
        return result;
    },
    addUser: async (user) => {
        try {
            await redisConnection.set(user._id, JSON.stringify(user));
            await redisConnection.sadd('idmap', user._id);
        } catch (error) {
            throw Error(error);
        }
    },
    getUser: async (id) => {
        let user = await redisConnection.get(id);
        
        if (!user) {
            throw 'User not found in Redis cache!';
        }
    
        return JSON.parse(user);
    },
    updateUser: async (userId, user) => {
        try {
            await redisConnection.set(userId, JSON.stringify(user));
        } catch (error) {
            throw error;
        }
    },
    getResellerMap: async () => {
        let result = await redisConnection.smembers('resellermap');
        return result;
    },
    addReseller: async (user) => {
        try {
            await redisConnection.set(`reseller-${user._id}`, JSON.stringify(user));
            await redisConnection.sadd('resellermap', user._id);
        } catch (error) {
            throw Error(error);
        }
    },
    removeReseller: async (user) => {
        try {
            await redisConnection.del(`reseller-${user._id}`);
            await redisConnection.srem('resellermap', user._id);
        } catch (error) {
            throw Error(error);
        }
    },
    getReseller: async (id) => {
        let user = await redisConnection.get(`reseller-${id}`);
        
        if (!user) {
            throw 'User not found in Redis cache!';
        }
    
        return JSON.parse(user);
    },
    updateReseller: async (userId, user) => {
        try {
            await redisConnection.set(`reseller-${userId}`, JSON.stringify(user));
        } catch (error) {
            throw error;
        }
    },
    getAdminUserMap: async () => {
        let result = await redisConnection.smembers('adminmap');
        return result;
    },
    addAdminUser: async (user) => {
        try {
            await redisConnection.set(`admin-${user._id}`, JSON.stringify(user));
            await redisConnection.sadd('adminmap', user._id);
        } catch (error) {
            throw Error(error);
        }
    },
    getAdminUser: async (id) => {
        let user = await redisConnection.get(`admin-${id}`);
        
        if (!user) {
            throw 'User not found in Redis cache!';
        }
    
        return JSON.parse(user);
    },
    updateAdminUser: async (userId, user) => {
        try {
            await redisConnection.set(`admin-${userId}`, JSON.stringify(user));
        } catch (error) {
            throw error;
        }
    },
    getPayPalAuthenticator: async () => {
        let authenticator = await redisConnection.get('paypal-authenticator');
        
        if (!authenticator) {
            throw 'Authenticator not found in Redis cache!';
        }
    
        return JSON.parse(authenticator);
    },
    setPayPalAuthenticator: async (authenticator) => {
        try {
            await redisConnection.set('paypal-authenticator', JSON.stringify(authenticator));
        } catch (error) {
            throw error;
        }
    },
    checkToken: async (token) => {
        let result = await redisConnection.sismember('invalidtokens', token);
        return result;
    },
    clearFaucet: async () => {
        try {
            await redisConnection.set('faucetentries', JSON.stringify([]));
        } catch (error) {
            throw error;
        }
    },
    getFaucetEntries: async () => {
        let result = await redisConnection.get('faucetentries');
        return JSON.parse(result);
    },
    addFaucetEntry: async (id) => {
        try {
            let entries = await redisConnection.get('faucetentries');
            let parsed = JSON.parse(entries)

            parsed.push(id);

            await redisConnection.set('faucetentries', JSON.stringify(parsed));
        } catch (error) {
            throw error;
        }
    },
    setLastWinner: async (username) => {
        try {
            await redisConnection.set('faucetwinner', username);
        } catch (error) {
            throw error;
        }
    },
    getLastWinner: async () => {
        try {
            let result = await redisConnection.get('faucetwinner');
            return result;
        } catch (error) {
            throw error;
        }
    },
    getRates: async () => {
        let result = await redisConnection.get('rates');
        return JSON.parse(result);
    },
    setRates: async (rates) => {
        try {
            await redisConnection.set('rates', JSON.stringify(rates));
        } catch (error) {
            throw error;
        }
    },
    getStats: async () => {
        let result = await redisConnection.get('stats');
        return JSON.parse(result);
    },
    setStats: async (stats) => {
        try {
            await redisConnection.set('stats', JSON.stringify(stats));
        } catch (error) {
            throw error;
        }
    },
    updateStock: async (newStock) => {
        try {
            await redisConnection.set('stock', newStock);
        } catch (error) {
            throw error;
        }
    },
    getStock: async () => {
        try {
            let stock = await redisConnection.get('stock');
            return parseInt(stock);
        } catch (error) {
            throw error;
        }
    },
    updateAyet: async (offers) => {
        try {
            await redisConnection.set('ayet', JSON.stringify(offers));
        } catch (error) {
            throw error;
        }
    },
    getAyet: async () => {
        try {
            let offers = await redisConnection.get('ayet');
            return JSON.parse(offers);
        } catch (error) {
            throw error;
        }
    },
    getGroups: async () => {
        let result = await redisConnection.get('groups');
        return JSON.parse(result);
    },
    setGroups: async (groups) => {
        try {
            await redisConnection.set('groups', JSON.stringify(groups));
        } catch (error) {
            throw error;
        }
    },
    getRedeemedToday: async () => {
        try {
            let result = await redisConnection.smembers('redeemedtoday');
            return result;
        } catch (error) {
            throw error;
        }
    },
    addRedeemedToday: async (redeemed) => {
        try {
            await redisConnection.sadd('redeemedtoday', redeemed.userId);
        } catch (error) {
            throw error;
        }
    },
    deleteRedeemedtodayToday: async () => {
        try {
            await redisConnection.del('redeemedtoday');
        } catch (error) {
            throw error;
        }
    },
    getCompletedToday: async () => {
        try {
            let result = await redisConnection.smembers('completedtoday');
            return result;
        } catch (error) {
            throw error;
        }
    },
    addCompletedToday: async (completed) => {
        try {
            await redisConnection.sadd('completedtoday', completed.userId);
        } catch (error) {
            throw error;
        }
    },
    deleteCompletedToday: async () => {
        try {
            await redisConnection.del('completedtoday');
        } catch (error) {
            throw error;
        }
    },
    getPendingTransactions: async () => {
        let result = await redisConnection.smembers('pendingtransactions');
        return result;
    },
    getAllPendingTransactions: async () => {
        let transactionIds = await redisConnection.smembers('pendingtransactions');
        let transactions = [];
        
        await Promise.all(transactionIds.map(async (id) => {
            let result = await redisConnection.get(`pending-${id}`);
            transactions.push(JSON.parse(result));
        }));

        return transactions;
    },
    getUserPendingBalance: async (userId) => {
        let transactionIds = await redisConnection.smembers('pendingtransactions');
        let total = 0;
        
        await Promise.all(transactionIds.map(async (id) => {
            let result = await redisConnection.get(`pending-${id}`);
            let transaction = JSON.parse(result);
            if(transaction.userId == userId) {
                total += transaction.amount;
            }
        }));

        return total;
    },
    getPendingTransaction: async (transactionId) => {
        let transaction = await redisConnection.get(`pending-${transactionId}`);

        if(!transaction) {
            return null;
        }

        return JSON.parse(transaction);
    },
    addPendingTransaction: async(transaction) => {
        try {
            await redisConnection.sadd('pendingtransactions', transaction.transactionId);
            await redisConnection.set(`pending-${transaction.transactionId}`, JSON.stringify(transaction));
        } catch (error) {
            throw error;
        }
    },
    deletePendingTransaction: async (transactionId) => {
        try {
            await redisConnection.del(`pending-${transactionId}`);
            await redisConnection.srem('pendingtransactions', transactionId);
        } catch (error) {
            throw error;
        }
    },
    addInvalidTokens: async (tokens) => {
        try {
            await redisConnection.sadd('invalidtokens', tokens);
        } catch (error) {
            throw error;
        }
    },
    getLeaderBoard: async () => {
        let result = await redisConnection.get('leaderboard');
        return JSON.parse(result);
    },
    updateLeaderboard: async (user) => {
        try {
            let current = await redisConnection.get('leaderboard');
            current = JSON.parse(current);
            let inLeaderboard = current.find(u => u.username == user.username);
    
            if(inLeaderboard) {
                let i = current.findIndex(u => u.username == user.username);
                current[i].totalEarned = user.totalEarned;
            } else {
                current.push(_.pick(user, ['username', 'totalEarned']));
            }
    
            let newLeaderboard = _.sortBy(current, ['totalEarned']).slice(-25).reverse();
            await redisConnection.set('leaderboard', JSON.stringify(newLeaderboard));
        } catch (error) {
            throw error;
        }
    },
    getAnnouncement: async () => {
        try {
            let result = await redisConnection.get('announcement');
            return JSON.parse(result);
        } catch (error) {
            throw error;
        }
    },
    updateAnnouncement: async (announcement) => {
        try {
            await redisConnection.set('announcement', JSON.stringify(announcement));
        } catch (error) {
            throw error;
        }
    },
    checkTransactionWhitelist: async (username) => {
        let result = await redisConnection.sismember('transactionwhitelist', username.toLowerCase());
        return result;
    },
    addTransactionWhitelist: async (username) => {
        try {
            await redisConnection.sadd('transactionwhitelist', username.toLowerCase());
        } catch (error) {
            throw error;
        }
    },
    removeTransactionWhitelist: async (username) => {
        try {
            await redisConnection.srem('transactionwhitelist', username.toLowerCase());
        } catch (error) {
            throw error;
        }
    },
    checkBypassToken: async (token) => {
        let result = await redisConnection.sismember('bypasstokens', token.toLowerCase());
        return result;
    },
    addBypassToken: async (token) => {
        try {
            await redisConnection.sadd('bypasstokens', token.toLowerCase());
        } catch (error) {
            throw error;
        }
    },
    removeBypassToken: async (token) => {
        try {
            await redisConnection.srem('bypasstokens', token.toLowerCase());
        } catch (error) {
            throw error;
        }
    },
};