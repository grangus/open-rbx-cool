const cron = require("node-cron");
const Group = require("../models/Group");
const rbx = require("../modules/rbx");
const redis = require("../modules/redis");
const dotenv = require("dotenv").config();

module.exports.startStockWatch = () => {
  cron.schedule("0-59/30 * * * * *", async () => {
    let groups = await Group.find();
    let stock = 0;

    if (groups.length > 0) {
      groups = await Group.find({});
      let proxies = process.env.REQUEST_PROXY.split(",");

      const pending = await groups.map(async (group, i) => {
        let proxyPosition = proxies[i] ? i : 0;

        try {
          try {
            await rbx.verifyOwnership(
              group.groupId,
              group.ownerId,
              proxies[proxyPosition]
            );
            await rbx.getCookieInfo(group.cookie, proxies[proxyPosition]);
          } catch (error) {
            console.log(
              `ERROR GETTING COOKIE INFO OR VERIFYING OWNERSHIP: ${error}`
            );
            console.log(JSON.stringify(error));
            if(error.status) {
              if(error.status == 500) return;
            }

            if (!error.retry) {
              await Group.findOneAndDelete({ groupId: group.groupId });
              return;
            }
          }

          let groupBalance = await rbx.getGroupBalance(
            group.groupId,
            group.cookie,
            proxies[proxyPosition]
          );

          if (groupBalance > 0) {
            stock += groupBalance;
            group.balance = groupBalance;
            try {
              await group.save();
            } catch (error) {
              console.log("saving group");
              console.log(error);
            }
          } else {
            console.log("deleting group...");
            await Group.findOneAndDelete({ groupId: group.groupId });
          }
        } catch (error) {
          console.log(error);
          console.log(`ERROR CHECKING GROUP BALANCE: ${JSON.stringify(error)}`);
        }
      });

      await Promise.all(pending);

      groups = await Group.find({});

      await redis.setGroups(groups);
      await redis.updateStock(stock);
    }
  });
};
