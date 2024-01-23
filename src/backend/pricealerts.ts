import 'chartjs-adapter-moment';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { Client, ComponentTypes } from "oceanic.js";
import { Op } from "sequelize";
import { Assets, bitvavo } from "../helpers/bitvavo";
import { getCurrencySign } from "../helpers/currency";
import { connection } from "../helpers/database";
import { logger } from "../helpers/logger";
import { decimals } from '../helpers/math';
import { PriceAlert } from '../helpers/models/PriceAlert.model';
import { PriceHistory } from '../helpers/models/PriceHistory.model';


const client = new Client({ auth: `Bot ${process.env.DISCORD_TOKEN}` });


let subscribedCryptos: string[] = [];
(async () => {
	await connection.sync();

	// Read all price alerts from the database, and subscribe to their websocket channels.

	// Every 30 seconds, check the database for new price alerts.
	setInterval(() => {
		subscribe();
	}, 30000);
	subscribe();


})();

async function subscribe() {
	const priceAlerts = await PriceAlert.findAll({
		where: {
			symbol: {
				[Op.not]: subscribedCryptos
			}
		}
	});

	for (const priceAlert of priceAlerts) {
		logger.debug(`Subscribing to ${priceAlert.symbol}`);
		subscribedCryptos.push(priceAlert.symbol);
		bitvavo.websocket.subscriptionTicker(`${priceAlert.symbol}-EUR`, handleSubscription);
	}
}


async function handleSubscription(ticker: Bitvavo.SubscriptionTicker) {
	logger.debug(`Received ticker update for ${ticker.market}`);
	if (!ticker.lastPrice) return;

	const symbol = ticker.market.split('-')[0];
	const alerts = await PriceAlert.findAll({
		where: {
			symbol
		}
	});

	// Get previous ticker price
	const previous = await PriceHistory.findOne({
		where: {
			symbol: symbol
		},
		order: [
			['timestamp', 'DESC']
		]
	});


	if (previous && Math.floor(previous.timestamp.getTime() / 1000) >= Math.floor(Date.now() / 1000)) return;

	// Insert new ticker price
	PriceHistory.create({
		symbol: symbol,
		price: ticker.lastPrice,
		timestamp: new Date()
	});


	if (!previous) return;

	const assets = await Assets.get();
	const crypto = assets.find(asset => asset.symbol === symbol);

	const difference = parseFloat(ticker.lastPrice) - previous.price;
	const differencePercentage = (difference / previous.price) * 100;

	for (const alert of alerts) {
		const wentAbove = alert.type === 'above' && parseFloat(ticker.lastPrice) >= alert.threshold && previous.price < alert.threshold;
		const wentBelow = alert.type === 'below' && parseFloat(ticker.lastPrice) <= alert.threshold && previous.price > alert.threshold;

		const shouldAlert = alert.type === 'above' ? wentAbove : (alert.type === 'below' ? wentBelow : wentAbove || wentBelow);

		if (!shouldAlert) continue;

		const curSign = getCurrencySign('EUR');

		client.rest.users.createDM(alert.user).then(async (channel) => {
			await channel.createMessage({
				embeds: [{
					title: `${crypto.name} price alert`,
					description: `The price of **${crypto.name}** is **${alert.type}** your threshold of **${curSign} ${alert.threshold}**.`,
					color: alert.type === 'above' ? 0x00ff00 : 0xff0000,
					fields: [
						{
							name: 'Current price',
							value: `${curSign} ${decimals(parseFloat(ticker.lastPrice), 2, crypto.decimals)}`,
							inline: true
						},
						{
							name: 'Previous price',
							value: `${curSign} ${decimals(previous.price, 2, crypto.decimals)}`,
							inline: true
						},
						{
							name: 'Difference',
							value: `${difference >= 0 ? '\u25b2' : '\u25bc'} ${curSign} ${decimals(difference, 2, crypto.decimals)} (${decimals(differencePercentage, 2, 2)}%)`,
							inline: true
						}
					]
				}],
				components: [
					{
						type: 1,
						components: [
							{
								type: ComponentTypes.BUTTON,
								label: 'Delete alert',
								style: 4,
								customID: `alert_delete_${alert.symbol}-${alert.type}-${alert.threshold}`
							}
						]
					}
				]

			});
		});
	}


}