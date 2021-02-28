const request = require('request');
const dotenv = require('dotenv').config();
const redis = require('../modules/redis');
const paypalToken = require('../automation/paypalToken');
const uuid = require('uuid/v4');

module.exports.createPayment = (value, username) => {
    return new Promise(async (res, rej) => {
        let authenticator = await redis.getPayPalAuthenticator();
        let custom = uuid();

        request.post('https://api.paypal.com/v2/checkout/orders/', {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${authenticator.access_token}`
            },
            json: {
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: 'USD',
                        value: value
                    },
                    description: `Robux purchase from RBX.COOL - ${username}`,
                    custom_id: custom
                }]
            }
        }, (error, response, body) => {
            if (error) return rej({ message: 'There was an error creating the payment! Please try again!' });

            if (!body.id) return rej({ message: 'There was an error creating the payment! Please try again!' });

            res({ orderID: body.id, custom: custom });
        });
    });
};

module.exports.capturePayment = (orderID) => {
    return new Promise(async (res, rej) => {
        let authenticator = await redis.getPayPalAuthenticator();

        request.post(`https://api.paypal.com/v2/checkout/orders/${orderID}/capture`, {
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json',
                'Authorization': `Bearer ${authenticator.access_token}`
            },
            json: true
        }, (error, response, body) => {
            if (error) return rej({ message: 'There was an error capturing the payment! Please try again!' });

            //console.log(body.details[0].description);

            if (body.error) return rej({ message: 'There was an error capturing the payment! Please try again!' });

            if (body.status !== 'COMPLETED') return rej({ message: 'There was an error processing your payment! This probably means your card was declined!' });

            res(body);
        });
    });
};

module.exports.updateAuthenticator = () => {
    let auth = Buffer.from(`${process.env.PAYPAL_CLIENT}:${process.env.PAYPAL_SECRET}`).toString('base64');

    request.post('https://api.paypal.com/v1/oauth2/token/', {
        headers: {
            Accept: `application/json`,
            Authorization: `Basic ${auth}`
        },
        body: `grant_type=client_credentials`,
    }, async (error, response, body) => {
        if (error) return this.updateAuthenticator();

        let json = JSON.parse(body);

        if (json.error) return console.error(`PayPal API Error: ${json.error_description}`);

        json.expires_at = Date.now() + ((json.expires_in - 10) * 1000);

        await redis.setPayPalAuthenticator(json);
        paypalToken.main();
    });
};

module.exports.sendEcho = async (postData) => {
    return new Promise((res, rej) => {
        request.post('https://ipnpb.paypal.com/cgi-bin/webscr', {
            headers: {
                'content-length': postData.length,
                'user-agent': 'RBX.COOL-SERVER'
            },
            encoding: 'utf8',
            body: postData
        }, (error, response, body) => {
            if (error) return rej({ message: null, error: `IPN ECHO ERROR: ${error.code}` });

            //verify response and throw errors
            if (!response.body.includes('VERIFIED')) return rej({ error: 'Invalid IPN received!' });

            console.log('IPN VERIFIED!');
            
            return res({ message: 'IPN verified!', error: null });
        });
    });
};