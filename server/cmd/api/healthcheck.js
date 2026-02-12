const appConfig = require("./config");
const { sendResponse } = require("./helpers");

const healthcheckHandler = (req, res) => {
  sendResponse(res, 200, {
    status: "available",
    system_info: {
      environment: "development",
      version: appConfig.version,
    },
  });
};

module.exports = healthcheckHandler;
