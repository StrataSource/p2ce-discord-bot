import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';
import { formatUserRaw } from '../../utils/utils';

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
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const user = interaction.options.getUser('user', true);

		// Untime them out!
		interaction.guild.members.resolve(user.id)?.timeout(null);

		return interaction.reply({ content: `Unmuted ${formatUserRaw(user)}`, ephemeral: true });
	}
};
export default UnTimeout;
