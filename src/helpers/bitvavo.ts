import axios from 'axios';
import Bitvavo from 'bitvavo';
import { createCanvas } from 'canvas';
import { Chart } from 'chart.js';
import { MessageOptions } from 'slash-create';
import { AssetCache } from './cache/assetcache';
import { MarketCache } from './cache/marketcache';
import { getCurrencySign } from './currency';
import { decimals } from './math';
import { parseTimestring, shortToLong } from './time';

export const bitvavo = Bitvavo().options({
	apikey: process.env.BITVAVO_KEY,
	apisecret: process.env.BITVAVO_SECRET
});

export const Markets = new MarketCache();
export const Assets = new AssetCache();

export type ChartIntervalBase = "1h" | "1d" | "7d" | "30d" | "1y" | "all";
export type ChartInterval = ChartIntervalBase | "14d" | "2mth" | "3mth" | "6mth";

export type ChartEntry = [timestamp: number, price: number];
export async function chart(asset: string, range: ChartInterval): Promise<ChartEntry[]> {
	const res = await axios.get(`https://data.bitvavo.com/v1/chart?range=${range}&asset=${asset}`);
	return res.data;
}

export async function getGraphMessage(asset: Bitvavo.Asset, range: ChartInterval = "1h", zoomFrom?: ChartIntervalBase): Promise<MessageOptions> {
	const ticker = await bitvavo.tickerPrice({ market: `${asset.symbol}-EUR` });

	const canvas = createCanvas(750, 350);
	let chartData = await chart(asset.symbol, zoomFrom || range);

	// If zoomFrom is set, filter the chartData to that range
	if (zoomFrom) {
		const now = Date.now();
		const chartRange = parseTimestring(range) * 1000;
		chartData = chartData.filter(a => a[0] >= now - chartRange);
	}

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

	const attachment = canvas.toBuffer();

	const difference = chartData[chartData.length - 1][1] - chartData[0][1];
	const differencePercentage = (difference / chartData[0][1]) * 100;

	const curSign = getCurrencySign("EUR");
	return {
		file: {
			file: attachment,
			name: `${asset.symbol}-EUR.png`
		},
		embeds: [
			{
				title: `${asset.name} (${shortToLong(range)[0].name})`,
				color: difference >= 0 ? 0x00ff00 : 0xff0000,
				description: `${asset.symbol} - ${asset.name}`,
				thumbnail: {
					url: `https://cryptologos.cc/logos/${encodeURIComponent(asset.name.toLowerCase())}-${encodeURIComponent(asset.symbol.toLowerCase())}-logo.png`
				},
				image: {
					url: `attachment://${asset.symbol}-EUR.png`
				},
				fields: [
					{
						name: "Current",
						value: `${curSign} ${decimals(parseFloat(ticker.price), 2, asset.decimals)}`,
						inline: true
					},
					{
						name: "High",
						value: `${curSign} ${decimals(Math.max(...chartData.map(entry => entry[1])), 2, asset.decimals)}`,
						inline: true
					},
					{
						name: "Low",
						value: `${curSign} ${decimals(Math.min(...chartData.map(entry => entry[1])), 2, asset.decimals)}`,
						inline: true
					},
					{
						name: 'Difference',
						value: `${difference >= 0 ? '\u25b2' : '\u25bc'} ${curSign} ${decimals(difference, 2, asset.decimals)} (${decimals(differencePercentage, 2, 2)}%)`
					}
				]
			}
		]
	};
}