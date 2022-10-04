import { ButtonInteraction, CommandInteraction, ContextMenuCommandBuilder, InteractionResponse, Message, MessageContextMenuCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, UserContextMenuCommandInteraction } from 'discord.js';
import { PermissionLevel } from '../utils/permissions';

export interface CommandBase {
	permissionLevel: PermissionLevel,
	data: unknown,
	execute(interaction: CommandInteraction): Promise<void | InteractionResponse<boolean> | Message<boolean>>,
	onButtonPressed?(interaction: ButtonInteraction): Promise<void | InteractionResponse<boolean> | Message<boolean>>,
}

export interface Command extends CommandBase {
	permissionLevel: PermissionLevel,
	data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandSubcommandsOnlyBuilder,
	execute(interaction: CommandInteraction): Promise<void | InteractionResponse<boolean> | Message<boolean>>
}

export interface ContextMenu extends CommandBase {
	permissionLevel: PermissionLevel,
	data: ContextMenuCommandBuilder,
	execute(interaction: MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction): Promise<void | InteractionResponse<boolean> | Message<boolean>>
}
