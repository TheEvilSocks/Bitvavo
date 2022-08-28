declare namespace Bitvavo {
	export type MarketStatus = "trading" | "halted" | "auction";
	export type AssetStatus = "OK" | "MAINTENANCE" | "DELISTED";
	export type TradeSide = "buy" | "sell";
	export type CandlesticksInterval = "1m" | "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "6h" | "8h" | "12h" | "1d";

	export interface Time { time: number }

	export interface BitvavoOptions {
		apikey?: string;
		apisecret?: string;
		accesswindow?: number;
		resturl?: string;
		wsurl?: string;
		debugging?: boolean;
	}

	export interface MarketOptions { market?: string }
	export interface Market {
		market: string;
		status: MarketStatus;
		base: string;
		quote: string;
		pricePrecision: string;
		minOrderInQuoteAsset: string;
		minOrderInBaseAsset: string;
		orderTypes: string[];
	}


	export interface AssetOptions { symbol?: string }
	export interface Asset {
		symbol: string;
		name: string;
		decimals: number;
		depositFee: string;
		depositConfirmations: number;
		depositStatus: AssetStatus;
		withdrawalFee: string;
		withdrawalMinAmount: string;
		withdrawalStatus: AssetStatus;
		networks: string[];
		message: string;
	}

	export interface BookOptions { depth?: number }
	export interface Orderbook {
		market: string;
		nonce: number;
		bids: [price: string, size: string][];
		asks: [price: string, size: string][];
	}

	export interface TradesOptions {
		limit?: number;
		start?: number;
		end?: number;
		tradeIdFrom?: string;
		tradeIdTo?: string;
	}
	export interface Trade {
		timestamp: number;
		id: string;
		amount: string;
		price: string;
		side: TradeSide;
	}

	export interface CandleOptions {
		limit?: number;
		start?: number;
		end?: number;
	}
	export type Candle = [
		timestamp: number,
		open: string,
		high: string,
		low: string,
		close: string,
		volume: string
	]

	export interface TickerOptions { market?: string }
	export interface Ticker {
		market: string;
		price: string;
	}
	export interface TickerBook {
		market: string;
		bid: string;
		bidSize: string;
		ask: string;
		askSize: string;
	}
	export interface Ticker24h {
		market: string;
		open: string;
		high: string;
		low: string;
		last: string;
		volume: string;
		volumeQuote: string;
		bid: string;
		bidSize: string;
		ask: string;
		askSize: string;
		timestamp: number;
	}

	export interface SubscriptionBase {
		event: string;
	}

	export interface SubscriptionTicker extends SubscriptionBase {
		market: string;
		bestBid: string;
		bestBidSize: string;
		bestAsk: string;
		bestAskSize: string;
		lastPrice: string;
	}

}

declare module "bitvavo" {
	import { EventEmitter } from "events";

	function Bitvavo(): BitvavoClient;
	export = Bitvavo;

	interface BitvavoClient {
		getEmitter(): EventEmitter;
		getRemainingLimit(): number;
		time(callback?: void): Promise<Bitvavo.Time>
		markets(options?: Bitvavo.MarketOptions, callback?: void): Promise<Bitvavo.Market[]>;
		assets(options?: Bitvavo.AssetOptions, callback?: void): Promise<Bitvavo.Asset[]>;
		book(symbol: string, options?: Bitvavo.BookOptions, callback?: void): Promise<Bitvavo.Orderbook>;
		publicTrades(symbol: string, options?: Bitvavo.TradesOptions, callback?: void): Promise<Bitvavo.Trade[]>;
		candles(market: string, interval: Bitvavo.CandlesticksInterval, options?: Bitvavo.CandleOptions): Promise<Bitvavo.Candle[]>;
		tickerPrice(options?: Bitvavo.TickerOptions): Promise<Bitvavo.Ticker>;
		tickerBook(options?: Bitvavo.TickerOptions): Promise<Bitvavo.Ticker>;
		ticker24h(options?: Bitvavo.TickerOptions): Promise<Bitvavo.Ticker24h[]>;
		//placeOrder
		//getOrder
		//updateOrder
		//cancelOrder
		//getOrders
		//cancelOrders
		//ordersOpen
		//trades
		//account
		//balance
		//depositAssets
		//withdrawAss
		//depositHistory
		//withdrawalHistory
		options(options: Bitvavo.BitvavoOptions): BitvavoClient;
		websocket: {
			checkSocket: () => Promise<void>;
			close: () => Promise<void>;
			time: () => Promise<Bitvavo.Time>;
			markets: (options?: Bitvavo.MarketOptions) => Promise<Bitvavo.Market[]>;
			assets: (options?: Bitvavo.AssetOptions) => Promise<Bitvavo.Asset[]>;
			book: (market: string, options?: Bitvavo.BookOptions) => Promise<Bitvavo.Orderbook>;
			publicTrades: (market: string, options?: Bitvavo.TradesOptions) => Promise<Bitvavo.Trade[]>;
			candles: (market: string, interval: Bitvavo.CandlesticksInterval, options?: Bitvavo.CandleOptions) => Promise<Bitvavo.Candle[]>;
			ticker24h: (options?: Bitvavo.TickerOptions) => Promise<Bitvavo.Ticker24h[]>;
			tickerPrice: (options?: Bitvavo.TickerOptions) => Promise<Bitvavo.Ticker>;
			tickerBook: (options?: Bitvavo.TickerOptions) => Promise<Bitvavo.TickerBook>;
			//placeOrder
			//getOrder
			//updateOrder
			//cancelOrder
			//getOrders
			//cancelOrders
			//ordersOpen
			//trades
			//account
			//balance
			//depositAssets
			//withdrawAssets
			//depositHistory
			//withdrawalHistory
			subscriptionTicker: (market: string, callback: (ticker: Bitvavo.SubscriptionTicker) => void) => Promise<void>;
			subscriptionTicker24h: (market: string, callback: void) => Promise<void>;
			//subscriptionAccount
			subscriptionCandles: (market: string, interval: Bitvavo.CandlesticksInterval, callback: void) => Promise<void>;
			subscriptionTrades: (market: string, callback: void) => Promise<void>;
			subscriptionBookUpdates: (market: string, callback: void) => Promise<void>;
			subscriptionBook: (market: string, callback?: void) => Promise<void>;
		}

	}
}
