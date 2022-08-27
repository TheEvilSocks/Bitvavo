import axios from 'axios';
import Bitvavo from 'bitvavo';
import { AssetCache } from './cache/assetcache';
import { MarketCache } from './cache/marketcache';

export const bitvavo = Bitvavo().options({
	apikey: process.env.BITVAVO_KEY,
	apisecret: process.env.BITVAVO_SECRET
});

export const Markets = new MarketCache();
export const Assets = new AssetCache();

export type ChartInterval = "1h" | "1d" | "7d" | "30d" | "1y" | "all";
export type ChartEntry = [timestamp: number, price: number];
export async function chart(asset: string, range: ChartInterval): Promise<ChartEntry[]> {
	const res = await axios.get(`https://data.bitvavo.com/v1/chart?range=${range}&asset=${asset}`);
	return res.data;
}