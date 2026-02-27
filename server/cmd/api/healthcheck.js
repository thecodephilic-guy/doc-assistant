const appConfig = require("./config");
const { sendSuccessResponse } = require("./helpers");

const healthcheckHandler = (req, res) => {
  sendSuccessResponse(res, 200, {
    status: "available",
    system_info: {
      environment: "development",
      version: appConfig.version,
    },
  });
};

module.exports = healthcheckHandler;
