import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { PermissionLevel } from '../utils/permissions';
import { clampNumber } from '../utils/math';

module.exports = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Bans the selected user.')
		.addUserOption(option => option.setName('user').setDescription('The name of the user').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('(Optional) The reason for the ban'))
		.addNumberOption(option => option.setName('clear_history').setDescription('(Optional) The number of days worth of messages to delete (0-7)')),

	async execute(interaction: CommandInteraction) {
		const user = interaction.options.getUser('user');
		if (!user) {
			await interaction.reply({ content: 'You must specify a user to ban!', ephemeral: true });
			return;
		}
		let clearHistory = interaction.options.getNumber('clear_history');
		if (!clearHistory) {
			clearHistory = 0;
		}
		clearHistory = clampNumber(clearHistory, 0, 7);

		// Ban them!
		interaction.guild?.members.resolve(user.id)?.ban({ days: clearHistory, reason: interaction.options.getString('reason') ?? '' });

		await interaction.reply({ content: `Banned ${user.username}#${user.discriminator}`, ephemeral: true });
		return;
	}
};
