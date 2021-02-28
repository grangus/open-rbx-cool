const path = require('path');

const oneSignalJsFiles = path.resolve(__dirname, '../OneSignal-Web-SDK-HTTPS-Integration-Files');

module.exports = async (req, res, next) => {
    if(req.path == '/OneSignalSDKWorker.js') return res.sendFile(`${oneSignalJsFiles}/OneSignalSDKWorker.js`);

    if(req.path == '/OneSignalSDKUpdaterWorker.js') return res.sendFile(`${oneSignalJsFiles}/OneSignalSDKUpdaterWorker.js`);
    
    next();
};