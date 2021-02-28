const request = require('request');
const dotenv = require('dotenv').config();

module.exports = {
    verifyToken: (token, ip) => {
        return new Promise((res, rej) => {
            request.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${token}&remoteip=${ip}`, {json: true}, (error, response, body) => {
                if(error) return rej('Captcha validation error!');
    
                if(body.success) {
                    if(body.score < 0.2 && !process.env.DOMAIN.startsWith('testing')) return rej('Captcha failed! Try again!');
    
                    res('Captcha solved successfully!');
                } else {
                    rej('Captcha failed! Try again!');
                }
            });
        });
    }
};