//modules
const Redis = require('ioredis');
const express = require('express');
const mongoose = require('mongoose');
const chalk = require('chalk');
const fs = require('fs');
const dotenv = require('dotenv').config();
const helmet = require('helmet');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');
const stock = require('./automation/cronstock');
const daily = require('./automation/daily');
const pendingRewarder = require('./automation/pendingRewarder');
const ayet = require('./automation/ayet');
const faucet = require('./automation/faucet');
const paypal = require('./automation/paypalToken');
const reporter = require('./automation/reports');

const User = require('./models/User');
const Reseller = require('./models/Reseller');

try {
    global.redisConnection = new Redis();
} catch (error) {
    console.log('Failed to connect to Redis. Was it started on the system?');
}

global.websocketServer = io;
global.siteUnavailable = false;


app.use(helmet());
app.use(express.json({
    verify: (req, res, buf) => {
        if(req.url.includes('coinbase')) {
            req.rawBody = buf.toString();
        }
    }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
    if (siteUnavailable) return res.status(500).json({
        status: 'error',
        error: {
            code: 500,
            message: 'Site currently unavailable!'
        },
        data: null
    });

    next();
});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization, Fp");

    next();
});

//dynamic route loading
fs.readdir("./routes", (error, files) => {
    files.forEach(file => {
        app.use("/", require(`./routes/${file}`));
    });
});


server.listen(3001, () => {
    console.log(chalk.green('Server listening on port 3001!'));
});

//attempt connection to mongodb
console.log(chalk.green('Connecting to MongoDB...'));
mongoose.connect('mongodb://127.0.0.1:27017/rewards', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true }, async () => {
    console.log(chalk.green('Connected to MongoDB!'));

    stock.startStockWatch();
    daily.startDaily();
    pendingRewarder.start();
    ayet.start();
    faucet.start();
    reporter.start();
    paypal.main();
    //this should only be uncommented to update users with new fields
    //await Reseller.updateMany({}, {$set: {chargebackTotal: 0}})
    //we dont want people trying to do anything when the site is reloading
    siteUnavailable = false;
    console.log(chalk.bold('Site online'))
});