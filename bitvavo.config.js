const path = require("path");

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
      cron_restart: "30 3 * * *",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: `Subscriptions`,
      script: "subscriptions.js",
      cwd: `Bitvavo/dist/backend`,
      cron_restart: "43 3 * * *",
      env: {
        NODE_ENV: "production"
      }
    },
  ],
};

console.log(module.exports);
