import { CommandInteraction, ContextMenuCommandBuilder, InteractionResponse, Message, MessageContextMenuCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, UserContextMenuCommandInteraction } from 'discord.js';
import { PermissionLevel } from '../utils/permissions';
import { Callbacks } from './client';

export interface CommandBase {
	permissionLevel: PermissionLevel,
	canBeExecutedWithoutPriorGuildSetup?: boolean | undefined,
	isP2CEOnly?: boolean | undefined,
	data: unknown,
	execute(interaction: CommandInteraction, callbacks?: Callbacks): Promise<void | InteractionResponse<boolean> | Message<boolean>>,
}

export interface Command extends CommandBase {
	data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandSubcommandsOnlyBuilder,
}

export interface ContextMenu extends CommandBase {
	data: ContextMenuCommandBuilder,
	execute(interaction: MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction, callbacks?: Callbacks): Promise<void | InteractionResponse<boolean> | Message<boolean>>,
}
