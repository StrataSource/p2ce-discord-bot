import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { Command } from '../../types/command';
import { PermissionLevel } from '../../utils/permissions';
import { CheckUserKeyStatus } from '../../utils/sheet-check';

const Check: Command = {
	permissionLevel: PermissionLevel.MEMBER,

	data: new SlashCommandBuilder()
		.setName('check')
		.setDescription('Check the status of your key application.'),

	async execute(interaction: CommandInteraction) {
		CheckUserKeyStatus(interaction);
	}
};
export default Check;
