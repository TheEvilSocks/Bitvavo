import * as dotenv from 'dotenv';
dotenv.config()

import fs from 'fs';
import path from 'path';

import { ExpressServer, SlashCreator } from "slash-create";
import { InteractionPlugin } from "./helpers/InteractionPlugin";
import { logger } from "./helpers/logger";
import { connection } from './helpers/database';


const plugins: { [name: string]: InteractionPlugin } = {};

const creator: SlashCreator = new SlashCreator({
	applicationID: process.env.DISCORD_APP_ID,
	publicKey: process.env.DISCORD_PUBLIC_KEY,
	token: process.env.DISCORD_TOKEN,

	endpointPath: process.env.SLASHER_PATH,
	serverPort: Number(process.env.SLASHER_PORT),
})
	.on("debug", logger.debug)
	.on("warn", logger.warn)
	.on("error", logger.error)
	.on("synced", () => logger.info("Commands synced!"))
	.on("commandRegister", (command) => logger.info(`Registered command ${command.commandName}`))
	.on("commandError", (command, error) => logger.error(error, `Command ${command.commandName}`))
	.on("commandRun", (command, _, ctx) =>
		logger.info(`${ctx.user.username}#${ctx.user.discriminator} (${ctx.user.id}) ran command ${command.commandName}`)
	)
	.on("componentInteraction", async (ctx) => {
		const pluginNames = Object.keys(plugins);
		for (const _plg of pluginNames) {
			const plugin = plugins[_plg];
			if (await plugin.shouldTrigger(ctx.customID, ctx)) return plugin.run(ctx, creator.commands);
		}
	});

if (fs.existsSync(path.join(__dirname, "interaction"))) {
	let _interaction_files = fs.readdirSync(path.join(__dirname, "interaction"), { withFileTypes: true });
	for (let i = 0; i < _interaction_files.length; i++) {
		if (!_interaction_files[i].isDirectory())
			if (_interaction_files[i].name.endsWith('.js')) {
				const interactionPlugin: InteractionPlugin = require(path.join(__dirname, `./interaction/${_interaction_files[i].name}`)).default;
				plugins[interactionPlugin.name] = interactionPlugin;
			}
	}
}
connection.sync().then(() => {
	creator
		.withServer(new ExpressServer())
		.registerCommandsIn(path.join(__dirname, 'commands'))
		.syncCommands()
		.startServer();
});