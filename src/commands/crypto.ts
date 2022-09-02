import { createCanvas } from "canvas";
import 'chartjs-adapter-moment';
import { AutocompleteContext, CommandContext, CommandOptionType, Message, SlashCommand, SlashCreator } from "slash-create";
import { compareTwoStrings } from "string-similarity";
import { Assets, bitvavo, chart } from "../helpers/bitvavo";
import { getCurrencySign } from "../helpers/currency";

import { Chart } from "chart.js";
import { TopCrypto } from '../helpers/models/TopCrypto.model';
import { ErrorResponse } from '../helpers/response';
import { shortToLong } from "../helpers/time";

export default class SlashCrypto extends SlashCommand {
	constructor(creator: SlashCreator) {
		super(creator, {
			name: "crypto",
			description: "Check the price of a crypto currency",
			options: [
				{
					name: "crypto",
					description: "The crypto currency to check",
					required: true,
					type: CommandOptionType.STRING,
					autocomplete: true
				},
				{
					name: "range",
					description: "The time range of the chart",
					required: false,
					type: CommandOptionType.STRING,
					choices: ["1h", "1d", "7d", "30d", "1y", "all"].map(a => {
						let name = a;
						if (a.endsWith("m")) {
							let num = parseInt(a.substring(0, a.length - 1));
							name = `${num} minute${num > 1 ? "s" : ""}`;
						}
						else if (a.endsWith("h")) {
							let num = parseInt(a.substring(0, a.length - 1));
							name = `${num} hour${num > 1 ? "s" : ""}`;
						}
						else if (a.endsWith("d")) {
							let num = parseInt(a.substring(0, a.length - 1));
							name = `${num} day${num > 1 ? "s" : ""}`;
						}
						else if (a.endsWith("y")) {
							let num = parseInt(a.substring(0, a.length - 1));
							name = `${num} year${num > 1 ? "s" : ""}`;
						}

						return { name, value: a };
					})
				}
			],
			throttling: {
				usages: 2,
				duration: 4
			}
		});
	}

	async autocomplete(ctx: AutocompleteContext): Promise<any> {

		if (!ctx.options.crypto || !ctx.options.crypto.length) {
			const top = await TopCrypto.findAll({
				order: [
					['uses', 'DESC']
				],
				limit: 10
			});
			return ctx.sendResults(top.map(a => ({ name: a.name, value: a.symbol })));
		}

		const assets = await Assets.get();

		const mapped: [string, string, number][] = assets.map(a => {
			let score: number;
			if (a.name.toLowerCase().includes(ctx.options.crypto.toLowerCase()))
				score = 1;
			else if (a.symbol.toLowerCase().includes(ctx.options.crypto.toLowerCase()))
				score = 1;
			else
				score = Math.max(compareTwoStrings(a.name.toLowerCase(), ctx.options.crypto.toLowerCase()), compareTwoStrings(a.symbol.toLowerCase(), ctx.options.crypto.toLowerCase()));

			return [a.name, a.symbol, score];
		});

		return ctx.sendResults(mapped.filter(a => a[2] > 0.5).sort((a, b) => b[2] - a[2] || a[0].length - b[0].length).map(a => ({ name: a[0], value: a[1] })));
	}

	async run(ctx: CommandContext): Promise<boolean | Message> {
		await ctx.defer();
		const assets = await Assets.get();

		const asset = assets.find(a => a.name.toLowerCase() === ctx.options.crypto.toLowerCase() || a.symbol.toLowerCase() === ctx.options.crypto.toLowerCase());
		if (!asset)
			return ctx.send(ErrorResponse("Invalid Crypto", "The crypto currency you specified is not valid. Discord will automatically autocomplete the crypto currency while you type it."));

		//TODO: Keep track per user
		TopCrypto.findOrCreate({
			where: {
				symbol: asset.symbol
			},
			defaults: {
				symbol: asset.symbol,
				name: asset.name,
			}
		}).then(([topCrypto]) => {
			topCrypto.increment("uses");
		});

		const ticker = await bitvavo.tickerPrice({ market: `${asset.symbol}-EUR` });

		const canvas = createCanvas(750, 350);
		const chartData = await chart(asset.symbol, ctx.options.range || "1h");
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

		// Combine canvas content and canvas scale
		const attachment = canvas.toBuffer();

		const difference = chartData[chartData.length - 1][1] - chartData[0][1];
		const differencePercentage = (difference / chartData[0][1]) * 100;

		return ctx.send({
			file: {
				file: attachment,
				name: `${asset.symbol}-EUR.png`
			},
			embeds: [
				{
					title: `${asset.name} (${shortToLong(ctx.options.range || "1h")[0].name})`,
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
		});
	}
}