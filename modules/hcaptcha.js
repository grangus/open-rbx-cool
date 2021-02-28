const request = require('request');
const dotenv = require('dotenv').config();

module.exports = {
    verifyToken: (token, ip) => {
        return new Promise((res, rej) => {
            request.post(`https://hcaptcha.com/siteverify?secret=${process.env.HCAPTCHA_SECRET}&response=${token}&remoteip=${ip}`, {json: true}, (error, response, body) => {
                if(error) return rej('Captcha validation error!');
    
                if(body.success) {
                    res('Captcha solved successfully!');
                } else {
                    rej('Captcha failed! Try again!');
                }
            });
        });
    }
};