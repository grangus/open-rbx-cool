const request = require('request').defaults({ timeout: 10000 });
const dotenv = require('dotenv').config();
const _ = require('lodash');

//adgate account creation needs some better error handling

module.exports = {
    getAyetOffers: () => {
        return new Promise((res, rej) => {
            request.get(`https://www.ayetstudios.com/offers/get/${process.env.AYET_ID}?apiKey=${process.env.AYET_API_KEY}`, { json: true }, (error, response, body) => {
                if (error) return res([]);
    
                if (body.status !== 'success') return res([]);
    
                if(body.num_offers == 0) return res([]);

                res(body.offers.map(o => {
                    return _.pick(o, ['icon', 'name', 'platforms', 'conversion_instructions_short', 'payout_usd', 'tracking_link'])
                }));
            });
        });
    },
    getOgOffers: (userId, ip) => {
        return new Promise((res, rej) => {
            request.get(`https://mobverify.com/api/v1/?affiliateid=${process.env.OGADS_ID}&ip=${ip}&device=iPhone,iPad,Android,Desktop&aff_sub4=${userId}`, { json: true }, (error, response, body) => {
                if (error) return res([]);

                res(body.offers);
            });
        });
    },
    getAdgateOffers: (userId, ip) => {
        return new Promise((res, rej) => {
            request.get(`https://wall.adgaterewards.com/apiv1/vc/${process.env.ADGATE_OFFERWALL_ID}/users/${userId}/offers?ip=${ip}`, { json: true, proxy: `http://${process.env.REQUEST_PROXY}` }, (error, response, body) => {
                if (error) return res([]);
    
                if (body.status !== 'success') return res([]);
    
                res(body.data);
            });
        });
    },
    createAdgateUser: (userId) => {
        return new Promise((res, rej) => {
            request.post(`https://wall.adgaterewards.com/apiv1/vc/${process.env.ADGATE_OFFERWALL_ID}/users/${userId}`, {
                json: {
                    "devices": []
                }
            }, (error, response, body) => {
                res();
            });
        });
    },
    getKiwiOffers: (userId, ip) => {
        return new Promise((res, rej) => {
            request.get(`https://www.kiwiwall.com/get-offers/${process.env.KIWI_KEY}?s=${userId}&ip_address=${ip}`, { json: true }, (error, response, body) => {
                if (error) return res([]);
    
                res(body.offers);
            });
        });
    },
    getOffertoroOffers: (ip) => {
        return new Promise((res, rej) => {
            request.get(`http://www.offertoro.com/api/?pubid=${process.env.OFFERTORO_PUB_ID}&appid=${process.env.OFFERTORO_APP_ID}&secretkey=${process.env.OFFERTORO_SECRET_KEY}&country=us&platform=web&format=json`, { json: true }, (error, response, body) => {
                if (error) return res([]);
    
                res(body.response.offers);
            });
        });
    },
    getAdgemOffers: (userId, ip) => {
        return new Promise((res, rej) => {
            request.get(`https://api.adgem.com/v1/wall?appid=${process.env.ADGEM_OFFERWALL_ID}&playerid=${userId}&json&ip=${ip}`, { json: true }, (error, response, body) => {
                if (error) return res([]);
    
                if (body.status !== 'success') return res([]);
    
                res(body.data[0].data);
            });
        });
    }
};