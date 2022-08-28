import 'chartjs-adapter-moment';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { Client as Eris } from "eris";
import { Op } from "sequelize";
import { Assets, bitvavo } from "../helpers/bitvavo";
import { getCurrencySign } from "../helpers/currency";
import { connection } from "../helpers/database";
import { logger } from "../helpers/logger";
import { PriceAlert } from '../helpers/models/PriceAlert.model';
import { PriceHistory } from '../helpers/models/PriceHistory.model';


const client = new Eris(`Bot ${process.env.DISCORD_TOKEN}`, { restMode: true, intents: [] });


let subscribedCryptos: string[] = [];
(async () => {
	await connection.sync();

	// Read all price alerts from the database, and subscribe to their websocket channels.

	// Every 5 minutes, check the database for new price alerts.
	setInterval(async () => {
		subscribe();
	}, 300000);
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
		const shouldAlert = alert.type === 'above' ? parseFloat(ticker.lastPrice) >= alert.threshold : parseFloat(ticker.lastPrice) <= alert.threshold;

		// Don't alert if we haven't crossed the threshold yet
		if (alert.type === 'above' && previous.price >= alert.threshold) continue;
		if (alert.type === 'below' && previous.price <= alert.threshold) continue;

		if (shouldAlert) {
			client.getDMChannel(alert.user).then(async (channel) => {
				await channel.createMessage({
					embed: {
						title: `${crypto.name} price alert`,
						description: `The price of ${crypto.name} has gone **${alert.type}** your threshold of **${getCurrencySign('EUR')}${alert.threshold}**.`,
						color: alert.type === 'above' ? 0x00ff00 : 0xff0000,
						fields: [
							{
								name: 'Current price',
								value: `${getCurrencySign('EUR')}${ticker.lastPrice}`,
								inline: true
							},
							{
								name: 'Previous price',
								value: `${getCurrencySign('EUR')}${previous.price}`,
								inline: true
							},
							{
								name: 'Difference',
								value: `${alert.type === 'above' ? '\u25b2' : '\u25bc'} ${difference.toFixed(crypto.decimals)} (${(differencePercentage).toFixed(2)}%)`,
								inline: true
							}
						]
					}
				});
			});
		}
	}


}