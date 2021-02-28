const fetch = require('node-fetch');
const dotenv = require('dotenv').config();
const redis = require('./redis');

module.exports = {
    createPayment: async (gateway, value, userId) => {
        let rates = await redis.getRates();

        try {
            let response = await fetch('https://selly.io/api/v2/pay', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${process.env.SELLY_EMAIL}:${process.env.SELLY_API_KEY}`).toString('base64')}`,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    "title": `${parseInt(value).toLocaleString()} R$ for Roblox`,
                    "gateway": gateway,
                    "confirmations": 1,
                    "value": Math.floor((parseInt(value) / 1000 * rates.salesRate) * 100) / 100,
                    "currency": "USD",
                    "return_url": `https://${process.env.DOMAIN}/dashboard`,
                    "webhook_url": `https://api.${process.env.DOMAIN}/postback/credit/${userId}/${value}/null/${process.env.POSTBACK_SECRET}/selly`
                })
            });

            let json = await response.json();

            if(response.status !== 200) {
                console.log(`selly error message: ${json.message}`);

                throw "There was an error creating the payment!"; 
            }

            return json;
        } catch (error) {
            console.log(`selly error: ${error}`);
            throw "There was an error creating the payment!";
        }
    }
};