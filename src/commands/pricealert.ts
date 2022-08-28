import 'chartjs-adapter-moment';
import { AutocompleteContext, CommandContext, CommandOptionType, Message, SlashCommand, SlashCreator } from "slash-create";
import { compareTwoStrings } from "string-similarity";
import { Assets } from "../helpers/bitvavo";
import { PriceAlert } from '../helpers/models/PriceAlert.model';

import { TopCrypto } from '../helpers/models/TopCrypto.model';
import { ErrorResponse, OKResponse } from '../helpers/response';

export default class SlashPricealert extends SlashCommand {
	constructor(creator: SlashCreator) {
		super(creator, {
			name: "pricealert",
			description: "Receive price alerts when a cryptocurrency price crosses your specified threshold.",
			options: [
				{
					name: "crypto",
					description: "The crypto currency to receive alerts for.",
					required: true,
					type: CommandOptionType.STRING,
					autocomplete: true
				},
				{
					name: "type",
					description: "The type of alert to receive.",
					required: true,
					type: CommandOptionType.STRING,
					choices: [{ name: "above", value: "above" }, { name: "below", value: "below" }]
				},
				{
					name: "threshold",
					description: "The threshold price to receive alerts for.",
					required: true,
					min_value: 0,
					type: CommandOptionType.NUMBER
				}

			],
			throttling: {
				usages: 2,
				duration: 5
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

		const hasAlert = await PriceAlert.findOne({
			where: {
				user: ctx.user.id,
				symbol: asset.symbol,
				type: ctx.options.type
			}
		});


		if (hasAlert)
			return ctx.send(ErrorResponse("Already Subscribed", "You are already subscribed to receive price alerts for this cryptocurrency."));

		try {
			await PriceAlert.create({
				user: ctx.user.id,
				symbol: asset.symbol,
				type: ctx.options.type,
				threshold: ctx.options.threshold
			});

			return ctx.send(OKResponse("Price Alerts", "You will receive a DM when the price of this cryptocurrency crosses your threshold."));
		} catch (err) {
			return ctx.send(ErrorResponse("Error", "An error occurred while subscribing to price alerts. Please try again."));
		}
	}
}