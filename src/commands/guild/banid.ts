import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { Command } from '../../types/command';
import { PermissionLevel } from '../../utils/permissions';

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

		const id = interaction.options.getString('id', true);

		interaction.client.users.fetch(id)
			.then(clientUser => interaction.guild?.bans.create(clientUser));

		return interaction.reply({ content: `Banned user with ID ${id}`, ephemeral: true });
	}
};
export default BanID;
