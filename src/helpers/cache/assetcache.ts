import { bitvavo } from "../bitvavo";
import { CacheHolder } from "../cacheholder";

export class AssetCache extends CacheHolder<Bitvavo.Asset> {
	constructor() {
		super(60 * 60 * 1000);
	}

	async update(): Promise<Bitvavo.Asset[]> {
		return await bitvavo.assets();
	}
};