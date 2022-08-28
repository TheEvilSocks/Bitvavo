import 'chartjs-adapter-moment';
import { AutocompleteContext, CommandContext, CommandOptionType, Message, SlashCommand, SlashCreator } from "slash-create";
import { compareTwoStrings } from "string-similarity";
import { Assets } from "../helpers/bitvavo";

import { Subscriptions } from "../helpers/models/Subscriptions.model";
import { TopCrypto } from '../helpers/models/TopCrypto.model';
import { ErrorResponse, OKResponse } from '../helpers/response';
import { parseTimestring, shortToLong } from "../helpers/time";

export default class SlashSubscribe extends SlashCommand {
	constructor(creator: SlashCreator) {
		super(creator, {
			name: "subscribe",
			description: "Subscribe to periodic updates about a cryptocurrency",
			options: [
				{
					name: "crypto",
					description: "The crypto currency to subscribe to",
					required: true,
					type: CommandOptionType.STRING,
					autocomplete: true
				},
				{
					name: "interval",
					description: "How often to send updates",
					required: true,
					type: CommandOptionType.STRING,
					choices: shortToLong(["15m", "30m", "1h", "2h", "4h", "6h", "12h", "1d"/*, "instant"*/])
					//TODO: implement instant
				},
				{
					name: "range",
					description: "The time range of the chart",
					required: true,
					type: CommandOptionType.STRING,
					choices: shortToLong(["1h", "1d", "7d", "30d", "1y", "all"])
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

		const isSubscribed = await Subscriptions.findOne({
			where: {
				channel: ctx.channelID,
				symbol: asset.symbol
			}
		});

		if (isSubscribed)
			return ctx.send(ErrorResponse("Already Subscribed", "You are already subscribed to this crypto currency."));

		Subscriptions.create({
			channel: ctx.channelID,
			symbol: asset.symbol,
			interval: parseTimestring(ctx.options.interval),
			chart: ctx.options.range
		});

		return ctx.send(OKResponse("Subscribed", `You are now subscribed to receive periodic updates about **${asset.name}**`));
	}
}