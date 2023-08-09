import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';
import { formatUserRaw } from '../../utils/utils';

const BanID: Command = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('banid')
		.setDescription('Bans the user with the given ID.')
		.addStringOption(option => option
			.setName('id')
			.setDescription('The user ID to ban')
			.setRequired(true)),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const id = interaction.options.getString('id', true);

		const user = await interaction.client.users.fetch(id);
		await interaction.guild.members.ban(user);

		return interaction.reply({ content: `Banned user ${user} (${formatUserRaw(user)}) with ID ${id}`, ephemeral: true });
	}
};
export default BanID;
