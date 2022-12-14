import { Sequelize } from "sequelize-typescript";
import { PriceAlert } from "./models/PriceAlert.model";
import { PriceHistory } from "./models/PriceHistory.model";
import { Subscriptions } from "./models/Subscriptions.model";
import { SubscriptionLog } from "./models/SubscriptionsLog.model";
import { TopCrypto } from "./models/TopCrypto.model";

export const connection = new Sequelize(process.env.MYSQL_DATABASE, process.env.MYSQL_USERNAME, process.env.MYSQL_PASSWORD, {
	dialect: "mysql",
	host: process.env.MYSQL_HOST,
	port: Number(process.env.MYSQL_PORT),
	logging: false,
	models: [TopCrypto, Subscriptions, SubscriptionLog, PriceAlert, PriceHistory]
});