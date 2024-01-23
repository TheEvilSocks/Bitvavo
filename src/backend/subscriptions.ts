import 'chartjs-adapter-moment';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { Client, EmbedOptions } from "oceanic.js";
import { Op } from "sequelize";
import { MessageFile, MessageOptions } from 'slash-create';
import { Assets, ChartInterval, getGraphMessage } from "../helpers/bitvavo";
import { connection } from "../helpers/database";
import { logger } from "../helpers/logger";
import { Subscriptions } from "../helpers/models/Subscriptions.model";
import { SubscriptionLog } from '../helpers/models/SubscriptionsLog.model';


const client = new Client({ auth: `Bot ${process.env.DISCORD_TOKEN}` });

async function sendSubcriptions() {
	const time = new Date(Date.now() - 60000);
	// Read subscriptions from database where lastPosted is null or older than its interval
	const subscriptions = await Subscriptions.findAll({
		where: {
			[Op.or]: [
				{ lastPosted: null },
				connection.literal(`lastPosted <= DATE_SUB(NOW(), INTERVAL 'interval' SECOND)`)
			]
		}
	});
	logger.debug(`Found ${subscriptions.length} subscriptions`);

	// For each subscription, generate the chart.
	let charts: { [symbol: string]: { [interval: number]: { [timeRange: string]: MessageOptions } } } = {};
	for (const subscription of subscriptions) {
		// If we've already generated a chart for this subscription type, skip it. This way we avoid generating the same chart multiple times.
		if (charts[subscription.symbol]?.[subscription.interval]?.[subscription.chart]) continue;

		logger.debug(`Building chart for ${subscription.channel} ${subscription.symbol} ${subscription.interval} ${subscription.chart}`);

		charts[subscription.symbol] = {};
		charts[subscription.symbol][subscription.interval] = {};


		const assets = await Assets.get();
		const asset = assets.find(a => a.symbol.toLowerCase() === subscription.symbol.toLowerCase());


		charts[subscription.symbol][subscription.interval][subscription.chart] = await getGraphMessage(asset, subscription.chart as ChartInterval);
	}

	// After generating all the charts, send them to their respective channels.
	for (const subscription of subscriptions) {
		if (!charts[subscription.symbol]?.[subscription.interval]?.[subscription.chart]) continue;
		const msg = charts[subscription.symbol][subscription.interval][subscription.chart];

		client.rest.channels.createMessage(subscription.channel, {
			embeds: msg.embeds as unknown as EmbedOptions[], files: [
				{
					name: (msg.file as MessageFile).name,
					contents: (msg.file as MessageFile).file
				}
			]
		}).then(async msg => {
			SubscriptionLog.create({
				message: msg.id,
				channel: subscription.channel,
				symbol: subscription.symbol,
			});

			const previousLogs = await SubscriptionLog.findAll({
				where: {
					channel: subscription.channel,
					symbol: subscription.symbol,
					message: {
						[Op.not]: msg.id
					}
				}
			});

			for (const previousLog of previousLogs) {
				client.rest.channels.deleteMessage(previousLog.channel, previousLog.message);
				previousLog.destroy();
			}

		});

		// Update lastPosted timestamp
		subscription.update({
			lastPosted: time
		});

	}

	// Clear memory
	charts = {};
}

(async () => {
	await connection.sync();

	// Run task every 15 minutes, starting at the next 15 minute interval
	const interval = 15 * 60 * 1000;
	const next15 = interval - (new Date().getTime() % interval);
	logger.info(`Starting subscription task, waiting ${next15}ms`);
	await sleep(next15);

	sendSubcriptions();
	setInterval(async () => {
		sendSubcriptions();
	}, interval);


})();

function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}