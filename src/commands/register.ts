import 'chartjs-adapter-moment';
import { AutocompleteContext, CommandContext, CommandOptionType, Message, SlashCommand, SlashCreator } from "slash-create";
import { compareTwoStrings } from "string-similarity";
import { Assets } from "../helpers/bitvavo";
import { PriceAlert } from '../helpers/models/PriceAlert.model';

import { TopCrypto } from '../helpers/models/TopCrypto.model';
import { ErrorResponse, OKResponse } from '../helpers/response';

export default class SlashRegister extends SlashCommand {
	constructor(creator: SlashCreator) {
		super(creator, {
			name: "register",
			description: "Register an account with Bitvavo",
			throttling: {
				usages: 2,
				duration: 5
			}
		});
	}

	async run(ctx: CommandContext): Promise<boolean | Message> {
		return ctx.send(OKResponse("Register an account", "You can register an account at [https://account.bitvavo.com/create](https://account.bitvavo.com/create?a=B827D3D7D7)"));
	}
}