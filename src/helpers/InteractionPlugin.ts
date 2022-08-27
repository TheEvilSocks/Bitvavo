import { Collection, ComponentContext, SlashCommand } from "slash-create";

export interface IInteractionPlugin {
	readonly name: string;

	shouldTrigger(custom_id: string, ctx: ComponentContext): Promise<boolean>;
	run(ctx: ComponentContext, slashCommands: Collection<string, SlashCommand>): Promise<any>;
}

export abstract class InteractionPlugin implements IInteractionPlugin {
	readonly name: string;

	constructor(name: string) {
		this.name = name;
	}

	async shouldTrigger(custom_id: string, ctx: ComponentContext): Promise<boolean> {
		throw new Error("Method not implemented.");
	}

	async run(ctx: ComponentContext, slashCommands: Collection<string, SlashCommand>): Promise<any> {
		throw new Error("Method not implemented.");
	}

}