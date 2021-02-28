//modules
const cron = require('node-cron');
const moment = require('moment');
const hook = require('../modules/webhook');

//models
const Transaction = require('../models/Transaction');

module.exports.start = () => {
    cron.schedule('00 59 * * * *', async () => {
        let currentTime = moment();
        let transactionStartTime = currentTime.startOf('day').subtract(7, 'd').toDate().getTime();
        let transactions = await Transaction.find({ usdAmount: { $exists: true }, timestamp: { $gte: transactionStartTime }, status: "complete" });
        let sales = transactions.reduce((days, sale) => {
            let day = moment(sale.timestamp).startOf('day').date();

            if (!days[day]) days[day] = { total: 0, count: 0 };

            days[day].total += sale.usdAmount;
            days[day].count++;
            return days;
        }, {});

        let embed = hook.generateReportEmbed(sales);
        hook.postReportEmbed(embed);
    });
};