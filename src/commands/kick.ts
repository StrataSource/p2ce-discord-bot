import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { PermissionLevel } from '../utils/permissions';

module.exports = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Kicks the selected user.')
		.addUserOption(option => option.setName('user').setDescription('The name of the user').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('(Optional) The reason for the kick')),

	async execute(interaction: CommandInteraction) {
		const user = interaction.options.getUser('user');
		if (!user) {
			await interaction.reply({ content: 'You must specify a user to kick!', ephemeral: true });
			return;
		}

		// Kick them out!
		interaction.guild?.members.resolve(user.id)?.kick(interaction.options.getString('reason') ?? '');

		await interaction.reply({ content: `Kicked ${user.username}#${user.discriminator}`, ephemeral: true });
		return;
	}
};
