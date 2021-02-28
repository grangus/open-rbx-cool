const nodemailer = require('nodemailer');
const dotenv = require('dotenv').config();

module.exports = {
    sendResetEmail: async (verificationCode, email, username) => {
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    
        try {
            await transporter.sendMail({
                from: '"RBX.Cool" <recovery@mail.rbx.cool>',
                to: email,
                subject: "RBX.Cool Password Reset",
                html: `Hello, ${username}. Your password reset verification code is: <b>${verificationCode}</b><br>You can use it here: https://rbx.cool/reset/code<br><b>If you did not request this, you can safely ignore this email.</b>`
            });
        } catch (error) {
            throw error;
        }
    },
    sendNewPassword: async (email, password) => {
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    
        try {
            await transporter.sendMail({
                from: '"RBX.Cool" <recovery@mail.rbx.cool>',
                to: email,
                subject: "Your RBX.Cool Password",
                text: `Your new password is: ${password}`
            });
        } catch (error) {
            throw error;
        }
    }
};