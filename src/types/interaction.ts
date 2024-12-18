import { AutocompleteInteraction, CommandInteraction, ContextMenuCommandBuilder, InteractionResponse, Message, MessageContextMenuCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, UserContextMenuCommandInteraction } from 'discord.js';
import { PermissionLevel } from '../utils/permissions';
import { Callbacks } from './client';

export interface CommandBase {
	permissionLevel: PermissionLevel,
	canBeExecutedWithoutPriorGuildSetup?: boolean | undefined,
	devP2CECommand?: boolean | undefined,
	data: unknown,
	execute(interaction: CommandInteraction, callbacks?: Callbacks): Promise<void | InteractionResponse<boolean> | Message<boolean>>,
	getAutocompleteOptions?(interaction: AutocompleteInteraction): { name: string, value: string }[],
}

export interface Command extends CommandBase {
	data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandSubcommandsOnlyBuilder,
}

export interface ContextMenu extends CommandBase {
	data: ContextMenuCommandBuilder,
	execute(interaction: MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction, callbacks?: Callbacks): Promise<void | InteractionResponse<boolean> | Message<boolean>>,
}
