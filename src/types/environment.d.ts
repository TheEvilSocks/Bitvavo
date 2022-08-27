declare namespace NodeJS {
	interface ProcessEnv {
		DISCORD_APP_ID: string;
		DISCORD_PUBLIC_KEY: string;
		DISCORD_TOKEN: string;
		DISCORD_GUILD_ID: string;

		SLASHER_PATH: string;
		SLASHER_PORT: string;

		MYSQL_HOST: string;
		MYSQL_PORT: string;
		MYSQL_DATABASE: string;
		MYSQL_USERNAME: string;
		MYSQL_PASSWORD: string;

		BITVAVO_KEY: string;
		BITVAVO_SECRET: string;
	}
}
