const request = require('request');

module.exports.getDeviceInfo = (userId) => {
  return new Promise((res, rej) => {
    request.get(`https://www.ipqualityscore.com/api/json/postback/API_KEY?type=devicetracker&userID=${userId}`, {
      json: true
    }, (error, response, body) => {
      if(error) return rej("IPQS request error!");

      if(body.success !== true) return rej("IPQS request unsuccessful!");

      res(body);
    })
  });
};
