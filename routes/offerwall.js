//modules
const router = require('express').Router();
const _ = require('lodash');

//custom modules
const offerwalls = require('../modules/offerwalls');
const redis = require('../modules/redis');

//middlewares
const userAuth = require('../middlewares/userAuth');
const ipCheck = require('../middlewares/ipCheck');

router.get('/offerwall/offertoro', userAuth, async (req, res) => {
    let data = await offerwalls.getOffertoroOffers();
    let rates = await redis.getRates();

    data.forEach(a => {
        a.payout = Math.floor(((parseFloat(a.payout) / 100) * (1000 / rates.offerwallRate)) * 100);
        if (a.payout == 0) {
            a.payout = 1;
        }
    });

    res.status(200).json({
        status: "ok",
        error: null,
        data: _.uniqBy(data, 'offer_name')
    });
});

router.get('/offerwall/ayet', userAuth, async (req, res) => {
    let data = await redis.getAyet();
    let rates = await redis.getRates();

    data.forEach(a => {
        a.payout_usd = Math.floor(((parseFloat(a.payout_usd) / 100) * (1000 / rates.offerwallRate)) * 100);
        if (a.payout_usd == 0) {
            a.payout_usd = 1;
        }
    });

    res.status(200).json({
        status: "ok",
        error: null,
        data: _.uniqBy(data, 'name')
    });
});

router.get('/offerwall/ogads', userAuth, ipCheck, async (req, res) => {
    let data = await offerwalls.getOgOffers(req.user._id, req.ipAddress);
    let rates = await redis.getRates();

    data.forEach(a => {
        a.payout = Math.floor(((parseFloat(a.payout) / 100) * (1000 / rates.offerwallRate)) * 100);
        if (a.payout == 0) {
            a.payout = 1;
        }
    });

    res.status(200).json({
        status: "ok",
        error: null,
        data: _.uniqBy(data, 'name_short')
    });
});

router.get('/offerwall/adgate', userAuth, ipCheck, async (req, res) => {
    let data = await offerwalls.getAdgateOffers(req.user._id, req.ipAddress);
    let rates = await redis.getRates();
    
    data.forEach(a => {
        a.points = Math.floor(((parseFloat(a.points) / 100) * (1000 / rates.offerwallRate)) * 100);
        if (a.points == 0) {
            a.points = 1;
        }
    });

    res.status(200).json({
        status: "ok",
        error: null,
        data: _.uniqBy(data, 'anchor')
    });
});

router.get('/offerwall/kiwi', userAuth, ipCheck, async (req, res) => {
    let data = await offerwalls.getKiwiOffers(req.user._id, req.ipAddress);
    let rates = await redis.getRates();

    if(data) {
        data.forEach(a => {
            a.amount = Math.floor(((parseFloat(a.amount) / 100) * (1000 / rates.offerwallRate)) * 100);
            if (a.amount == 0) {
                a.amount = 1;
            }
        });
    
        res.status(200).json({
            status: "ok",
            error: null,
            data: _.uniqBy(data, 'name')
        });
    } else {
        res.status(200).json({
            status: "ok",
            error: null,
            data: []
        });
    }
});

router.get('/offerwall/adgem', userAuth, ipCheck, async (req, res) => {
    let data = await offerwalls.getAdgemOffers(req.user._id, req.ipAddress);
    let rates = await redis.getRates();

    if(data) {
        data.forEach(a => {
            a.amount = Math.floor(((parseFloat(a.amount) / 100) * (1000 / rates.offerwallRate)) * 100);
            if (a.amount == 0) {
                a.amount = 1;
            }
        });
    
        res.status(200).json({
            status: "ok",
            error: null,
            data: _.uniqBy(data, 'name')
        });
    } else {
        res.status(200).json({
            status: "ok",
            error: null,
            data: []
        });
    }
});

module.exports = router;