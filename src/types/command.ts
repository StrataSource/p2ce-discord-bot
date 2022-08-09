import { CacheType, CommandInteraction, InteractionResponse, Message, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';
import { PermissionLevel } from '../utils/permissions';

export interface Command {
	permissionLevel: PermissionLevel,
	data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandSubcommandsOnlyBuilder,
	execute(interaction: CommandInteraction<CacheType>): Promise<void | InteractionResponse<boolean> | Message<boolean>>
}
