import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { PermissionLevel } from '../utils/permissions';

module.exports = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('mute')
		.setDescription('Mutes the selected user.')
		.addUserOption(option => option.setName('user').setDescription('The name of the user').setRequired(true))
		.addNumberOption(option => option.setName('duration').setDescription('The time to mute them, in minutes').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('(Optional) The reason for the mute')),

	async execute(interaction: CommandInteraction) {
		const user = interaction.options.getUser('user');
		if (!user) {
			await interaction.reply({ content: 'You must specify a user to mute!', ephemeral: true });
			return;
		}
		const duration = interaction.options.getNumber('duration');
		if (!duration) {
			await interaction.reply({ content: 'You must specify the duration of the mute!', ephemeral: true });
			return;
		}

		// Time them out!
		interaction.guild?.members.resolve(user.id)?.timeout(duration * 1000 * 60, interaction.options.getString('reason') ?? '');

		await interaction.reply({ content: `Muted ${user.username}#${user.discriminator}`, ephemeral: true });
		return;
	}
};
