import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { Command } from '../../types/command';
import { PermissionLevel } from '../../utils/permissions';

const Say: Command = {
	permissionLevel: PermissionLevel.TEAM_MEMBER,

	data: new SlashCommandBuilder()
		.setName('say')
		.setDescription('Repeat the given text in this channel.')
		.addStringOption(option => option
			.setName('message')
			.setDescription('The message to repeat')
			.setRequired(true)),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;

		const message = interaction.options.getString('message', true);
		interaction.channel?.send(message);

		return interaction.reply({ content: `Echoed "${message}" to ${interaction.channel?.toString()}`, ephemeral: true });
	}
};
export default Say;
