const jwt = require('jsonwebtoken');
const Joi = require('@hapi/joi');
const redis = require('../modules/redis');

module.exports = async (req, res, next) => {
    let token = req.headers.authorization;

    if (!token) return res.status(403).json({
        status: 'error',
        error: {
            code: 403,
            message: 'Please authenticate to continue!'
        },
        data: null
    });


    let decoded = jwt.decode(token, { json: true });

    let { error } = Joi.object({
        id: Joi.string().required(),
        type: Joi.number().integer().required(),
        iat: Joi.number().integer().required(),
        exp: Joi.number().integer().required()
    }).validate(decoded);

    if (error) return res.status(403).json({
        status: 'error',
        error: {
            code: 403,
            message: 'Please authenticate to continue!'
        },
        data: null
    });

    if(decoded.type !== 3) return res.status(403).json({
        status: 'error',
        error: {
            code: 403,
            message: 'Please authenticate to continue!'
        },
        data: null
    });

    try {
        req.token = token;
        req.user = await redis.getAdminUser(decoded.id);

        if (!req.user) return res.status(403).json({
            status: 'error',
            error: {
                code: 403,
                message: 'Please authenticate to continue!'
            },
            data: null
        });

        let invalidated = await redis.checkToken(token);

        if (invalidated) return res.status(403).json({
            status: 'error',
            error: {
                code: 403,
                message: 'Please authenticate to continue!'
            },
            data: null
        });

        jwt.verify(token, `${req.user.password}:${req.user.signature}`, async (error, decoded) => {
            if (error) return res.status(403).json({
                status: 'error',
                error: {
                    code: 403,
                    message: 'Please authenticate to continue!'
                },
                data: null
            });

            next();
        });
    } catch (error) {
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