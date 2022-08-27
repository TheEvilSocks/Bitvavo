import { logger } from "./logger";

export abstract class CacheHolder<T> {
	private cache: T;
	private lastUpdate: number;
	private timeout: number;

	/**
	 * 
	 * @param timeout Time in milliseconds until the cache is considered expired.
	 * @param initialCache Initial cache to use.
	 */
	constructor(timeout: number, initialCache?: T) {
		this.timeout = timeout;
		this.cache = initialCache;
		if (this.cache)
			this.lastUpdate = Date.now();
	}

	public async get(): Promise<T> {
		if (this.isExpired()) {
			this.cache = await this.update();
			this.lastUpdate = Date.now();
		}
		return this.cache;
	}

	public isExpired(): boolean {
		return !this.lastUpdate || Date.now() - this.lastUpdate > this.timeout;
	}

	public abstract update(): Promise<T>;
}