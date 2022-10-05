import { ButtonInteraction, Client, ClientOptions, Collection, InteractionResponse, Message, SelectMenuInteraction } from 'discord.js';
import { CommandBase } from './interaction';

type ButtonCallback = (interaction: ButtonInteraction) => Promise<void | Message<boolean> | InteractionResponse<boolean>>;
type SelectMenuCallback = (interaction: SelectMenuInteraction) => Promise<void | Message<boolean> | InteractionResponse<boolean>>;

export class Callbacks {
	#buttonCallbacks: Map<string, ButtonCallback>;
	#menuCallbacks: Map<string, SelectMenuCallback>;

	constructor() {
		this.#buttonCallbacks = new Map<string, ButtonCallback>();
		this.#menuCallbacks = new Map<string, SelectMenuCallback>();
	}

	addButtonCallback(buttonID: string, callback: ButtonCallback) {
		this.#buttonCallbacks.set(buttonID, callback);
	}

	addSelectMenuCallback(menuID: string, callback: SelectMenuCallback) {
		this.#menuCallbacks.set(menuID, callback);
	}

	runButtonCallback(buttonID: string, interaction: ButtonInteraction) {
		return this.#buttonCallbacks.get(buttonID)?.(interaction);
	}

	runSelectMenuCallback(menuID: string, interaction: SelectMenuInteraction) {
		return this.#menuCallbacks.get(menuID)?.(interaction);
	}

	removeButtonCallback(buttonID: string) {
		this.#buttonCallbacks.delete(buttonID);
	}

	removeSelectMenuCallback(menuID: string) {
		this.#menuCallbacks.delete(menuID);
	}
}

export class MoralityCoreClient extends Client {
	commands: Collection<string, CommandBase>;
	callbacks: Callbacks;

	constructor(options: ClientOptions) {
		super(options);
		this.commands = new Collection<string, CommandBase>();
		this.callbacks = new Callbacks();
	}
}
