import 'chartjs-adapter-moment';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { createCanvas } from "canvas";
import { Chart } from "chart.js";
import { Client as Eris } from "eris";
import { Op } from "sequelize";
import { Assets, bitvavo, chart, ChartInterval } from "../helpers/bitvavo";
import { getCurrencySign } from "../helpers/currency";
import { connection } from "../helpers/database";
import { logger } from "../helpers/logger";
import { Subscriptions } from "../helpers/models/Subscriptions.model";
import { SubscriptionLog } from '../helpers/models/SubscriptionsLog.model';
import { shortToLong } from '../helpers/time';


const client = new Eris(`Bot ${process.env.DISCORD_TOKEN}`, { restMode: true, intents: [] });

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

	// Build charts for each subscription
	let charts: { [symbol: string]: { [interval: number]: { [timeRange: string]: { image: Buffer, asset: Bitvavo.Asset, ticker: Bitvavo.Ticker, difference: number, differencePercentage: number, range:string } } } } = {};
	for (const subscription of subscriptions) {
		if (charts[subscription.symbol]?.[subscription.interval]?.[subscription.chart]) continue;

		logger.debug(`Building chart for ${subscription.channel} ${subscription.symbol} ${subscription.interval} ${subscription.chart}`);

		charts[subscription.symbol] = {};
		charts[subscription.symbol][subscription.interval] = {};


		const assets = await Assets.get();
		const asset = assets.find(a => a.symbol.toLowerCase() === subscription.symbol.toLowerCase());
		const ticker = await bitvavo.tickerPrice({ market: `${asset.symbol}-EUR` });

		const canvas = createCanvas(750, 350);
		const chartData = await chart(asset.symbol, subscription.chart as ChartInterval);
		const myChart = new Chart(canvas.getContext('2d'), {
			type: 'line',
			options: {
				elements: {
					point: {
						radius: 0
					}
				},
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						enabled: false
					}
				},
				scales: {
					x: {
						type: 'time',
						time: {
							displayFormats: {
								millisecond: 'HH:mm:ss.SSS',
								second: 'HH:mm:ss',
								minute: 'HH:mm',
								hour: 'HH'
							}
						},
						ticks: {
							autoSkip: true,
							maxTicksLimit: 10,
							color: "#00a8b3"
						}
					},
					y: {
						ticks: {
							color: "#ff9c33"
						}
					}
				}
			},
			data: {
				labels: chartData.map(entry => (new Date(entry[0]))),
				datasets: [{
					label: asset.name,
					data: chartData.map(entry => entry[1]),
					fill: false,
					animation: false,
					borderColor: '#3396FF',
					backgroundColor: '#3396FF',
				}]
			}
		});
		myChart.draw();

		const difference = chartData[chartData.length - 1][1] - chartData[0][1];
		const differencePercentage = (difference / chartData[0][1]) * 100;

		charts[subscription.symbol][subscription.interval][subscription.chart] = { image: canvas.toBuffer(), asset, ticker, difference, differencePercentage, range: subscription.chart };
	}

	// Post charts to Discord channels
	for (const subscription of subscriptions) {
		if (!charts[subscription.symbol]?.[subscription.interval]?.[subscription.chart]) continue;
		const { image, asset, ticker, difference, differencePercentage, range } = charts[subscription.symbol][subscription.interval][subscription.chart];

		client.createMessage(subscription.channel, {
			embeds: [
				{
					title: `${asset.name} (${shortToLong(range || "1h")[0].name})`,
					color: difference >= 0 ? 0x00ff00 : 0xff0000,
					description: `${asset.symbol} - ${asset.name}`,
					thumbnail: {
						url: `https://cryptologos.cc/logos/${asset.name.toLowerCase()}-${asset.symbol.toLowerCase()}-logo.png`
					},
					image: {
						url: `attachment://${asset.symbol}-EUR.png`
					},
					fields: [
						{
							name: "Price",
							value: `${getCurrencySign("EUR")}${ticker.price}`,
						},
						{
							name: 'Difference',
							value: `${difference >= 0 ? '\u25b2' : '\u25bc'} ${difference.toFixed(difference.toString().length >= 2 ? difference.toString().length : 2)} (${(differencePercentage).toFixed(2)}%)`,
							inline: true
						}
					]
				}
			]
		}, {
			file: image,
			name: `${asset.symbol}-EUR.png`
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
				client.deleteMessage(previousLog.channel, previousLog.message);
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