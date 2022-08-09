import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { Command } from '../../types/command';
import { PermissionLevel } from '../../utils/permissions';

const UnTimeout: Command = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('untimeout')
		.setDescription('Untimeout the selected user.')
		.addUserOption(option => option
			.setName('user')
			.setDescription('The name of the user')
			.setRequired(true)),

	async execute(interaction: CommandInteraction) {
		const user = interaction.options.getUser('user');
		if (!user) {
			return interaction.reply({ content: 'You must specify a user to untimeout!', ephemeral: true });
		}

		// Untime them out!
		interaction.guild?.members.resolve(user.id)?.timeout(null);

		return interaction.reply({ content: `Unmuted ${user.username}#${user.discriminator}`, ephemeral: true });
	}
};
export default UnTimeout;