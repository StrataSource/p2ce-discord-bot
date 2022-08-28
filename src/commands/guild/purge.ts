import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, TextChannel } from 'discord.js';
import { Command } from '../../types/command';
import { PermissionLevel } from '../../utils/permissions';

import * as config from '../../config.json';

const Purge: Command = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('purge')
		.setDescription('Deletes the given amount of messages.')
		.addIntegerOption(option => option
			.setName('amount')
			.setDescription('The amount of messages to delete')
			.setMinValue(1)
			.setMaxValue(config.options.message_purge_max)
			.setRequired(true)),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;

		if (!interaction.channel || (interaction.channel && !interaction.channel.isTextBased())) {
			return interaction.reply({ content: 'Purge command must be run in a text-based channel!', ephemeral: true });
		}

		const amount = interaction.options.getInteger('amount', true);
		const messages = await interaction.channel.messages.fetch({ limit: amount });
		(interaction.channel as TextChannel).bulkDelete(messages);

		return interaction.reply({ content: `Purged ${amount} messages!`, ephemeral: true });
	}
};
export default Purge;
