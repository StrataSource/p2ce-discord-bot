import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { Command } from '../../types/command';
import { PermissionLevel } from '../../utils/permissions';
import { CheckUserKeyStatus } from '../../utils/sheet-check';

const CheckUser: Command = {
	permissionLevel: PermissionLevel.TEAM_MEMBER,

	data: new SlashCommandBuilder()
		.setName('checkuser')
		.setDescription('Check the status of a specific users key application.')
		.addUserOption(option => option
			.setName('user')
			.setDescription('The name of the user')
			.setRequired(true)),

	async execute(interaction: CommandInteraction) {
		CheckUserKeyStatus(interaction);
	}
};
export default CheckUser;
