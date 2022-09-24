import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/command';
import { PermissionLevel } from '../../utils/permissions';

// TODO: REMOVE AFTER 10/15/2022
const Check: Command = {
	permissionLevel: PermissionLevel.MEMBER,

	data: new SlashCommandBuilder()
		.setName('check')
		.setDescription('Check the status of your key application.'),

	async execute(interaction: CommandInteraction) {
		return interaction.reply({ content: 'This command has moved! Please run </keyapp check:0> to check your application status.', ephemeral: true });
	}
};
export default Check;
