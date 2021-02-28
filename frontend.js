const chalk = require('chalk');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const helmet = require('helmet');
const router = express.Router();
const path = require('path');

const htmlPath = path.resolve(__dirname, './html');

const iframe = require('./middlewares/iframe.js');
const onesignal = require('./middlewares/onesignal');

app.disable('x-powered-by');

app.use(iframe);
app.use(helmet());
app.use(router);
app.use(onesignal);

app.use('/assets', express.static('assets'));

app.use((req, res, next) => {
    console.log(req.headers['cf-connecting-ip'] || req.ip);
    console.log(req.headers);

    next();
});

server.listen(3000, () => {
    console.log(chalk.green('Server listening on port 3000!'));
});

router.get('/', (req, res) => {
    res.sendFile(`${htmlPath}/index.html`);
});

router.get('/login', (req, res) => {
    res.sendFile(`${htmlPath}/login.html`);
});

router.get('/register', (req, res) => {
    res.sendFile(`${htmlPath}/register.html`);
});

router.get('/earn', (req, res) => {
    res.sendFile(`${htmlPath}/gone.html`);
});

router.get('/purchase', (req, res) => {
    res.redirect('/purchase/beta');
    //res.sendFile(`${htmlPath}/purchase.html`);
});

router.get('/purchase/beta', (req, res) => {
    res.sendFile(`${htmlPath}/beta_purchase.html`);
});

//redirect this
router.get('/discord', (req, res) => {
    res.redirect('https://discord.gg/UbnMtKx');
});

router.get('/drops', (req, res) => {
    res.sendFile(`${htmlPath}/gone.html`);
});

router.get('/giveaway', (req, res) => {
    res.sendFile(`${htmlPath}/gone.html`);
});

router.get('/redeem', (req, res) => {
    res.sendFile(`${htmlPath}/redeem.html`);
});

router.get('/withdraw', (req, res) => {
    res.redirect('/dashboard');
});

router.get('/settings', (req, res) => {
    res.redirect('/dashboard');
});

router.get('/admin/info', (req, res) => {
    res.sendFile(`${htmlPath}/admininfo.html`);
});

router.get('/admin/actions', (req, res) => {
    res.sendFile(`${htmlPath}/adminactions.html`);
});

router.get('/alogin', (req, res) => {
    res.sendFile(`${htmlPath}/adminlogin.html`);
});

router.get('/recovery', (req, res) => {
    res.sendFile(`${htmlPath}/recovery.html`);
});

router.get('/reset/code', (req, res) => {
    res.sendFile(`${htmlPath}/resetcode.html`);
});

router.get('/reseller/login', (req, res) => {
    res.sendFile(`${htmlPath}/resellerlogin.html`);
});

router.get('/reseller/home', (req, res) => {
    res.sendFile(`${htmlPath}/resellerpanel.html`);
});

router.get('/ads.txt', (req, res) => {
    res.sendFile(`${htmlPath}/ads.txt`);
});

router.get('/tos', (req, res) => {
    res.sendFile(`${htmlPath}/TOS.txt`);
});

router.get('/privacy', (req, res) => {
    res.sendFile(`${htmlPath}/privacy.txt`);
});

router.get('/cloudflare/browsercheck', (req, res) => {
    res.sendFile(`${htmlPath}/challenge.html`);
});

router.get('/dashboard', (req, res) => {
    res.sendFile(`${htmlPath}/dashboard.html`);
});