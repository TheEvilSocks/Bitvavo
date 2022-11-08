import 'chartjs-adapter-moment';
import { AutocompleteContext, CommandContext, CommandOptionType, Message, SlashCommand, SlashCreator } from "slash-create";
import { compareTwoStrings } from "string-similarity";
import { Assets, ChartIntervalBase, getGraphMessage } from "../helpers/bitvavo";

import { TopCrypto } from '../helpers/models/TopCrypto.model';
import { ErrorResponse } from '../helpers/response';
import { shortToLong } from '../helpers/time';

// Key is unsupported on api so request value instead.
const ZOOM_OUT: { [name: string]: ChartIntervalBase } = {
	"2h": "1d",
	"6h": "1d",
	"12h": "1d",
	"2d": "7d",
	"3d": "7d",
	"14d": "30d",
	"2mth": "1y",
	"3mth": "1y",
	"6mth": "1y"
}
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
					choices: shortToLong(["1h", "2h", "6h", "12h", "1d", "2d", "3d", "7d", "14d", "30d", "2mth", "3mth", "6mth", "1y", "all"])
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
			else if (ctx.options.crypto.length > 3)
				score = Math.max(compareTwoStrings(a.name.toLowerCase(), ctx.options.crypto.toLowerCase()), compareTwoStrings(a.symbol.toLowerCase(), ctx.options.crypto.toLowerCase()));

			return [a.name, a.symbol, score];
		});

		return ctx.sendResults(mapped.filter(a => a[2] > 0.5).sort((a, b) => b[2] - a[2] || a[0].length - b[0].length).slice(0, 20).map(a => ({ name: a[0], value: a[1] })));
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

		return ctx.send(await getGraphMessage(asset, ctx.options.range, ZOOM_OUT[ctx.options.range]));
	}
}