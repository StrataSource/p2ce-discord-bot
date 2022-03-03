import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { PermissionLevel } from '../utils/permissions';

module.exports = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('untimeout')
		.setDescription('Untimeout the selected user.')
		.addUserOption(option => option.setName('user').setDescription('The name of the user').setRequired(true)),

	async execute(interaction: CommandInteraction) {
		const user = interaction.options.getUser('user');
		if (!user) {
			await interaction.reply({ content: 'You must specify a user to untimeout!', ephemeral: true });
			return;
		}

		// Untime them out!
		interaction.guild?.members.resolve(user.id)?.timeout(null);

		await interaction.reply({ content: `Unmuted ${user.username}#${user.discriminator}`, ephemeral: true });
		return;
	}
};
