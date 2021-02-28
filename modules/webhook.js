const Discord = require('discord.js');
const dotenv = require('dotenv').config();

module.exports = {
    postPrivateEmbed: (embed) => {
        const hook = new Discord.WebhookClient(process.env.PRIVATE_WEBHOOK_ID, process.env.PRIVATE_WEBHOOK_TOKEN);

        hook.send(embed);
    },
    postPublicEmbed: (embed) => {
        const hook = new Discord.WebhookClient(process.env.PUBLIC_WEBHOOK_ID, process.env.PUBLIC_WEBHOOK_TOKEN);

        hook.send(embed);
    },
    postSaleEmbed: (embed) => {
        const hook = new Discord.WebhookClient(process.env.SALE_WEBHOOK_ID, process.env.SALE_WEBHOOK_TOKEN);

        hook.send(embed);
    },
    postFraudEmbed: (embed) => {
        const hook = new Discord.WebhookClient(process.env.FRAUD_WEBHOOK_ID, process.env.FRAUD_WEBHOOK_TOKEN);

        hook.send(embed);
    },
    postWithdrawEmbed: (embed) => {
        const hook = new Discord.WebhookClient(process.env.WITHDRAW_WEBHOOK_ID, process.env.WITHDRAW_WEBHOOK_TOKEN);

        hook.send(embed);
    },
    postReportEmbed: (embed) => {
        const hook = new Discord.WebhookClient(process.env.REPORT_WEBHOOK_ID, process.env.REPORT_WEBHOOK_TOKEN);

        hook.send(embed);
    },
    generateReportEmbed: (sales) => {
        const embed = new Discord.RichEmbed()
        .setColor('#837AFF');

        Object.keys(sales).map(key => {
            embed.addField(`Day ${key}`, `Total Revenue: ${Math.floor(sales[key].total)} - Sales count: ${sales[key].count}`);
        });

        return embed;
    },
    generateRegistrationEmbed: (username, email, referer, ip, fingerprint) => {
        const embed = new Discord.RichEmbed()
        .setColor('#837AFF')
        .setThumbnail('https://rbx.cool/assets/images/registration.png')
        .addField("New registration!", `Username: ${username}\nEmail: ${email}\nReferrer: ${referer}\nIP: ${ip}\nFingerprint: ${fingerprint}`);

        return embed;
    },
    generatePurchaseEmbed: (username, email, amount, txnId, ip) => {
        const embed = new Discord.RichEmbed()
        .setColor('#eb4034')
        .addField("R$ sold!", `Username: ${username}\nEmail: ${email}\nAmount: ${amount}\nTXN ID: ${txnId}\nIP: ${ip}`);

        return embed;
    },
    generateAltPurchaseEmbed: (username, email, amount, txnId, ip, status) => {
        const embed = new Discord.RichEmbed()
        .setColor('#6b03fc')
        .addField("Potential pending payment!", `Username: ${username}\nEmail: ${email}\nAmount: ${amount}\nTXN ID: ${txnId}\nIP: ${ip}\nStatus: ${status}`);

        return embed;
    },
    generateCryptoPurchaseEmbed: (username, amount, ip) => {
        const embed = new Discord.RichEmbed()
        .setColor('#eb8c34')
        .addField("R$ sold for crypto!", `Username: ${username}\nAmount: ${amount}\nIP: ${ip}`);

        return embed;
    },
    generatePostbackEmbed: (username, email, amount, offerwall) => {
        const embed = new Discord.RichEmbed()
        .setColor('#3471eb')
        .addField("A user earned R$!", `Username: ${username}\nEmail: ${email}\nAmount: ${amount}\nOfferwall: ${offerwall}`);

        return embed;
    },
    generateWithdrawEmbed: (username, robloxName, amount, fingerprint) => {
        const embed = new Discord.RichEmbed()
        .setColor('#34eb4f')
        .addField("A user withdrew R$!", `Username: ${username}\nRoblox Name: ${robloxName}\nAmount: ${amount}\nFingerprint: ${fingerprint}`);

        return embed;
    },
    generateChargebackEmbed: (username, email, amount, ip, txnId, transactionIp) => {
        const embed = new Discord.RichEmbed()
        .setColor('#fc0303')
        .addField("CHARGEBACK", `Username: ${username}\nEmail: ${email}\nAmount: ${amount}\nTXN ID: ${txnId}\nRegistration IP: ${ip}\nTransaction IP: ${transactionIp}`);

        return embed;
    },
    generateFraudEmbed: (username, ip, score, amount) => {
        const embed = new Discord.RichEmbed()
        .setColor('#fc0303')
        .addField("Fraud Detected", `Username: ${username}\nIP: ${ip}\nFraud Score: ${score}\nAmount: ${amount.toLocaleString()}`);

        return embed;
    },
    generatePurchaseVpnEmbed: (username, ip, score) => {
        const embed = new Discord.RichEmbed()
        .setColor('#fc0303')
        .addField("VPN/Proxy Detected", `Username: ${username}\nIP: ${ip}\nFraud Score: ${score}`);

        return embed;
    },
    generateBlockedEmbed: (username, email, ip, score) => {
        const embed = new Discord.RichEmbed()
        .setColor('#fc0303')
        .addField("Fraudulent Registration Blocked", `Username: ${username}\nEmail:${email}\nIP: ${ip}\nFraud Score: ${score}`);

        return embed;
    },
    generateProxyBlockedEmbed: (username, email, ip, score) => {
        const embed = new Discord.RichEmbed()
        .setColor('#fc0303')
        .addField("VPN/Proxy Registration Blocked", `Username: ${username}\nEmail:${email}\nIP: ${ip}\nFraud Score: ${score}`);

        return embed;
    },
    generateFpBlockEmbed: (fp) => {
        const embed = new Discord.RichEmbed()
        .setColor('#fc0303')
        .addField("Fingerprint Registration Blocked", `FP: ${fp}`);

        return embed;
    },
    generateTroll: () => {
        const embed = new Discord.RichEmbed()
        .setColor('#fc0303')
        .addField("he got got", `dab`);

        return embed;
    },
};