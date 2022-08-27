const path = require("path");

const basename = path.basename(__dirname);
module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    {
      name: `Bitvavo`,
      script: "index.js",
      cwd: `Bitvavo/dist`,
      cron_restart: "30 3 * * *"
    }
  ],
};

console.log(module.exports);
