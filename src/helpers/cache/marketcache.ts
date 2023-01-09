import { bitvavo } from "../bitvavo";
import { CacheHolder } from "../cacheholder";

export class MarketCache extends CacheHolder<Bitvavo.Market> {
	constructor() {
		super(30 * 60 * 1000);
	}

	async update(): Promise<Bitvavo.Market[]> {
		return await bitvavo.markets();
	}
};