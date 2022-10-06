import { ButtonInteraction, Client, ClientOptions, Collection, InteractionResponse, Message, ModalSubmitInteraction, SelectMenuInteraction } from 'discord.js';
import { CommandBase } from './interaction';

type ButtonCallback = (interaction: ButtonInteraction) => Promise<void | Message<boolean> | InteractionResponse<boolean>>;
type SelectMenuCallback = (interaction: SelectMenuInteraction) => Promise<void | Message<boolean> | InteractionResponse<boolean>>;
type ModalCallback = (interaction: ModalSubmitInteraction) => void;

export class Callbacks {
	#buttonCallbacks: Map<string, ButtonCallback>;
	#menuCallbacks: Map<string, SelectMenuCallback>;
	#modalCallbacks: Map<string, ModalCallback>;

	constructor() {
		this.#buttonCallbacks = new Map<string, ButtonCallback>();
		this.#menuCallbacks = new Map<string, SelectMenuCallback>();
		this.#modalCallbacks = new Map<string, ModalCallback>();
	}

	addButtonCallback(buttonID: string, callback: ButtonCallback) {
		if (!this.#buttonCallbacks.has(buttonID)) {
			this.#buttonCallbacks.set(buttonID, callback);
		}
	}

	addSelectMenuCallback(menuID: string, callback: SelectMenuCallback) {
		if (!this.#menuCallbacks.has(menuID)) {
			this.#menuCallbacks.set(menuID, callback);
		}
	}

	addModalCallback(modalID: string, callback: ModalCallback) {
		if (!this.#modalCallbacks.has(modalID)) {
			this.#modalCallbacks.set(modalID, callback);
		}
	}

	runButtonCallback(buttonID: string, interaction: ButtonInteraction) {
		return this.#buttonCallbacks.get(buttonID)?.(interaction);
	}

	runSelectMenuCallback(menuID: string, interaction: SelectMenuInteraction) {
		return this.#menuCallbacks.get(menuID)?.(interaction);
	}

	runModalCallback(modalID: string, interaction: ModalSubmitInteraction) {
		return this.#modalCallbacks.get(modalID)?.(interaction);
	}

	removeButtonCallback(buttonID: string) {
		this.#buttonCallbacks.delete(buttonID);
	}

	removeSelectMenuCallback(menuID: string) {
		this.#menuCallbacks.delete(menuID);
	}

	removeModalCallback(modalID: string) {
		this.#modalCallbacks.delete(modalID);
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
