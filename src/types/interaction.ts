import { CommandInteraction, ContextMenuCommandBuilder, InteractionResponse, Message, MessageContextMenuCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, UserContextMenuCommandInteraction } from 'discord.js';
import { PermissionLevel } from '../utils/permissions';
import { Callbacks } from './client';

export interface CommandBase {
	permissionLevel: PermissionLevel,
	canBeExecutedWithoutPriorGuildSetup?: boolean | undefined,
	data: unknown,
	execute(interaction: CommandInteraction, callbacks?: Callbacks): Promise<void | InteractionResponse<boolean> | Message<boolean>>,
}

export interface Command extends CommandBase {
	permissionLevel: PermissionLevel,
	data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandSubcommandsOnlyBuilder,
	execute(interaction: CommandInteraction, callbacks?: Callbacks): Promise<void | InteractionResponse<boolean> | Message<boolean>>
}

export interface ContextMenu extends CommandBase {
	permissionLevel: PermissionLevel,
	data: ContextMenuCommandBuilder,
	execute(interaction: MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction, callbacks?: Callbacks): Promise<void | InteractionResponse<boolean> | Message<boolean>>
}
