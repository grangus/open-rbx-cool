const jwt = require('jsonwebtoken');
const Joi = require('@hapi/joi');
const redis = require('../modules/redis');

module.exports = async (req, res, next) => {
    let token = req.headers.authorization;

    if (!token) {
        console.log('missing token')
        return res.status(403).json({
            status: 'error',
            error: {
                code: 403,
                message: 'Please authenticate to continue!'
            },
            data: null
        });
    }


    let decoded = jwt.decode(token, { json: true });

    let { error } = Joi.object({
        id: Joi.string().required(),
        type: Joi.number().integer().required(),
        iat: Joi.number().integer().required(),
        exp: Joi.number().integer().required()
    }).validate(decoded);

    if (error)  {
        console.log('validation error')
        console.log(error)
        return res.status(403).json({
            status: 'error',
            error: {
                code: 403,
                message: 'Please authenticate to continue!'
            },
            data: null
        });
    }

    if(decoded.type !== 1)  {
        console.log('decoded id isnt 1')
        return res.status(403).json({
            status: 'error',
            error: {
                code: 403,
                message: 'Please authenticate to continue!'
            },
            data: null
        });
    }

    try {
        req.token = token;
        req.user = await redis.getUser(decoded.id);
        req.decoded = decoded;

        if (!req.user) {
            console.log('req.user is not defined')
            return res.status(403).json({
                status: 'error',
                error: {
                    code: 403,
                    message: 'Please authenticate to continue!'
                },
                data: null
            });
        }

        if(req.user.banned) return res.status(403).json({
            status: 'error',
            error: {
                code: 403,
                message: 'You have been banned from our website.'
            },
            data: null
        });
        
        let invalidated = await redis.checkToken(token);

        if (invalidated) {
            console.log('token was found in invalidated store')
            return res.status(403).json({
                status: 'error',
                error: {
                    code: 403,
                    message: 'Please authenticate to continue!'
                },
                data: null
            });
        }

        jwt.verify(token, `${req.user.password}:${req.user.signature}`, async (error, decoded) => {
            if (error) {
                //console.log('verification error')
                //console.log(error)
                return res.status(403).json({
                    status: 'error',
                    error: {
                        code: 403,
                        message: 'Please authenticate to continue!'
                    },
                    data: null
                });
            }

            next();
        });
    } catch (error) {
        console.log('general error in user auth')
        console.log(error);
        return res.status(403).json({
            status: 'error',
            error: {
                code: 403,
                message: 'Please authenticate to continue!'
            },
            data: null
        });
    }

};