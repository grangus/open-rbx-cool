const Joi = require('@hapi/joi');

module.exports = {
    register: (data) => {
        const schema = Joi.object({
            user: Joi.string().alphanum().required().max(32),
            email: Joi.string().email().max(100),
            password: Joi.string().required().min(8).max(100),
            captchaToken: Joi.string().required(),
            ref: Joi.string()
        });

        return schema.validate(data);
    },
    login: (data) => {
        const schema = Joi.object({
            user: Joi.string().required().max(32),
            password: Joi.string().required().max(100),
            captchaToken: Joi.string().required()
        });

        return schema.validate(data);
    },
    createTransaction: (data) => {
        const schema = Joi.object({
            amount: Joi.number().integer().min(1),
            username: Joi.string().required().max(100)
        });

        return schema.validate(data);
    },
    passwordReset: (data) => {
        const schema = Joi.object({
            email: Joi.string().email().required().max(100),
            captchaToken: Joi.string().required()
        });

        return schema.validate(data);
    },
    passwordResetComplete: (data) => {
        const schema = Joi.string().uuid()

        return schema.validate(data);
    },
    groupAdd: (data) => {
        const schema = Joi.object({
            groupId: Joi.number().integer().required(),
            cookie: Joi.string().required()
        });

        return schema.validate(data);
    },
    groupRemove: (data) => {
        const schema = Joi.object({
            groupId: Joi.number().integer().required()
        });

        return schema.validate(data);
    },
    captcha: (data) => {
        const schema = Joi.object({
            captchaToken: Joi.string().required()
        });

        return schema.validate(data);
    },
    code: (data) => {
        const schema = Joi.object({
            code: Joi.string().required().max(64),
            captchaToken: Joi.string().required()
        });

        return schema.validate(data);
    },
    emailChange: (data) => {
        const schema = Joi.object({
            password: Joi.string().required().max(100),
            email: Joi.string().email().required()
        });

        return schema.validate(data);
    },
    passwordChange: (data) => {
        const schema = Joi.object({
            currentPassword: Joi.string().required().max(100),
            newPassword: Joi.string().required().min(8).max(100)
        });

        return schema.validate(data);
    },
    userValidation: (data) => {
        const schema = Joi.object({
            username: Joi.string().required()
        });
    
        return schema.validate(data);
    },
    resellerCreation: (data) => {
        const schema = Joi.object({
            username: Joi.string().required(),
            saleRates: Joi.number(),
            rewardRates: Joi.number(),
            faucetRates: Joi.number()
        });
    
        return schema.validate(data);
    },
    banIp: (data) => {
        const schema = Joi.object({
            ip: Joi.string().ip().required()
        });
    
        return schema.validate(data);
    },
    banEmail: (data) => {
        const schema = Joi.object({
            email: Joi.string().email().required()
        });
    
        return schema.validate(data);
    },
    banFp: (data) => {
        const schema = Joi.object({
            fp: Joi.string().required()
        });
    
        return schema.validate(data);
    },
    updateAnnouncement: (data) => {
        const schema = Joi.object({
            announcement: Joi.string().required().max(150).min(1)
        });
    
        return schema.validate(data);
    },
    promoCreate: (data) => {
        const schema = Joi.object({
            code: Joi.string().required(),
            value: Joi.number().integer().required()
        });
    
        return schema.validate(data);
    },
    singleUse: (data) => {
        const schema = Joi.object({
            value: Joi.number().integer().required()
        });
    
        return schema.validate(data);
    },
    multiUse: (data) => {
        const schema = Joi.object({
            code: Joi.string().required(),
            value: Joi.number().integer().required(),
            uses: Joi.number().integer().required()
        });
    
        return schema.validate(data);
    },
    codeValidation: (data) => {
        const schema = Joi.object({
            code: Joi.string().required()
        });
    
        return schema.validate(data);
    },
    purchaseValidation: (data) => {
        const schema = Joi.object({
            amount: Joi.number().integer().required()
        });
    
        return schema.validate(data);
    },
    betaPurchaseValidation: (data) => {
        const schema = Joi.object({
            amount: Joi.number().greater(0).required()
        });
    
        return schema.validate(data);
    },
    betaPurchaseCompleteValidation: (data) => {
        const schema = Joi.object({
            orderID: Joi.string().required()
        });
    
        return schema.validate(data);
    },
    ratesChange: (data) => {
        const schema = Joi.object({
            offerwallRate: Joi.number().allow(''),
            salesRate: Joi.number().allow(''),
            dailyReward: Joi.number().allow(''),
            captchaRate: Joi.number().allow(''),
            faucetBase: Joi.number().allow(''),
            gameRate: Joi.number().allow(''),
        });
    
        return schema.validate(data);
    },
    resellerRatesChange: (data) => {
        const schema = Joi.object({
            username: Joi.string().required(),
            rewardRates: Joi.number().allow(''),
            saleRates: Joi.number().allow(''),
            faucetRates: Joi.number().allow('')
        });
    
        return schema.validate(data);
    },
    escapeGroupName: (name) => {
        let chars = {
            '&': "&amp;",
            '"': "&quot;",
            '<': "&lt;",
            '>': "&gt;",
            '=': "&#61;"
        };

        return name.replace( /[&"<>=]/g, (c) => chars[c] );
    }
};