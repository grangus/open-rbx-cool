const request = require("request");

module.exports = async (req, res, next) => {
  let ip = req.headers["cf-connecting-ip"] || req.ip;

  req.ipAddress = ip;

  request.get(
    `https://ipqualityscore.com/api/json/ip/6yt5myWlqYNzHKgkMldnwNPl4T4Jwx90/${req.ipAddress}?strictness=0&user_agent=${req.headers["user-agent"]}`,
    { json: true },
    (error, response, body) => {
      if (error) {
        console.log("Issue contacting IPQS!");
        return res.status(500).json({
          status: "error",
          error: {
            code: 500,
            message: "Internal error! Check back later!",
          },
          data: null,
        });
      }

      if (body.success == false) {
        console.log(body.message);
        return res.status(500).json({
          status: "error",
          error: {
            code: 500,
            message: "Internal error! Check back later!",
          },
          data: null,
        });
      }

      req.quality = body;

      next();
    }
  );
};
