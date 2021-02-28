const request = require("request");
const redis = require('../modules/redis');

module.exports = async (req, res, next) => {
  const whitelisted = await redis.checkTransactionWhitelist(req.user.username);
  if(whitelisted) return next();
  request.get(
    `https://www.ipqualityscore.com/api/json/postback/6yt5myWlqYNzHKgkMldnwNPl4T4Jwx90?type=devicetracker&userID=${req.user._id}`,
    { json: true },
    (error, response, body) => {
      if (error) {
        console.log("Issue contacting IPQS!");
        return res.status(500).json({
          status: "error",
          error: {
            code: 500,
            message: "Please clear your browser cache, disabling AdBlockers & try again!",
          },
          data: null,
        });
      }

      if (body.success == false) {
        console.log(body);
        return res.status(500).json({
          status: "error",
          error: {
            code: 500,
            message: "Please clear your browser cache, disabling AdBlockers & try again!",
          },
          data: null,
        });
      }

      req.quality = body;

      next();
    }
  );
};
