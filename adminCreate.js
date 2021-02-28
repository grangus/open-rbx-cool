//modules
const Redis = require('ioredis');
const mongoose = require('mongoose');
const uuid = require('uuid/v4');
const bcrypt = require('bcrypt');
const chalk = require('chalk');

//models
const Admin = require('./models/Admin');

let args = process.argv.slice(2);
console.log(args[0])
console.log(chalk.green('Connecting to MongoDB...'));
mongoose.connect('mongodb://127.0.0.1:27017/rewards', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true }, async () => {
    const hashedPassword = await bcrypt.hash(args[0], 10);
    console.log(hashedPassword);
    const admin = new Admin({
        username: 'admin',
        password: hashedPassword,
        key: uuid()
    });

    try {
        await admin.save();
    } catch (error) {
        console.log(error);
    }

    console.log(chalk.green('Done!'));
});