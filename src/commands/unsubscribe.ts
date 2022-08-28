import 'chartjs-adapter-moment';
import { AutocompleteContext, CommandContext, CommandOptionType, Message, SlashCommand, SlashCreator } from "slash-create";
import { compareTwoStrings } from "string-similarity";
import { Assets } from "../helpers/bitvavo";

import { Subscriptions } from "../helpers/models/Subscriptions.model";
import { ErrorResponse, OKResponse } from '../helpers/response';

export default class SlashUnsubscribe extends SlashCommand {
	constructor(creator: SlashCreator) {
		super(creator, {
			name: "unsubscribe",
			description: "Unsubscribe from periodic updates about a crypto currency",
			options: [
				{
					name: "crypto",
					description: "The crypto currency to unsubscribe from",
					required: true,
					type: CommandOptionType.STRING,
					autocomplete: true
				}
			],
			throttling: {
				usages: 2,
				duration: 4
			}
		});
	}

	async autocomplete(ctx: AutocompleteContext): Promise<any> {
		const subscribed = await Subscriptions.findAll({
			where: {
				channel: ctx.channelID
			}
		});

		if (subscribed.length === 0)
			return ctx.sendResults([]);

		const assets = await Assets.get();

		if (!ctx.options.crypto || !ctx.options.crypto.length)
			return ctx.sendResults(subscribed.map(a => ({ name: assets.find(ass => ass.symbol == a.symbol).name, value: a.symbol })));

		const mapped: [string, string, number][] = subscribed.map(a => {
			const asset = assets.find(ass => ass.symbol == a.symbol);
			let score: number;
			if (asset.name.toLowerCase().includes(ctx.options.crypto.toLowerCase()))
				score = 1;
			else if (a.symbol.toLowerCase().includes(ctx.options.crypto.toLowerCase()))
				score = 1;
			else
				score = Math.max(compareTwoStrings(asset.name.toLowerCase(), ctx.options.crypto.toLowerCase()), compareTwoStrings(a.symbol.toLowerCase(), ctx.options.crypto.toLowerCase()));

			return [asset.name, a.symbol, score];
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

		if (!isSubscribed)
			return ctx.send(ErrorResponse("Not Subscribed", "You are not subscribed to this crypto currency."));

		isSubscribed.destroy();

		return ctx.send(OKResponse("Unsubscribed", `You will no longer receive periodic updates about **${asset.name}**`));
	}
}