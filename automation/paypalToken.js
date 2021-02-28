const redis = require('../modules/redis');
const paypal = require('../modules/paypal');

module.exports.main = async () => {
    let authenticator;

    try {
        authenticator = await redis.getPayPalAuthenticator();
    } catch (error) {
        authenticator = null;
    }

    if(!authenticator || Date.now() >= authenticator.expires_at) {
        paypal.updateAuthenticator();
    } else {
        setTimeout(() => {
            this.main();
        }, Date.now() - authenticator.expires_at);
    }
};