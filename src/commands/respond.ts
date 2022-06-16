import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { PermissionLevel } from '../utils/permissions';

import * as config from '../config.json';

module.exports = {
	permissionLevel: PermissionLevel.TEAM_MEMBER,

	data: new SlashCommandBuilder()
		.setName('respond')
		.setDescription('Responds with a message.')
		.addStringOption(option => option.setName('id').setDescription('The ID of the message to respond with.').setRequired(true)),

	async execute(interaction: CommandInteraction) {
		const id = interaction.options.getString('id');
		for (const message of config.messages) {
			for (const name of message.names) {
				if (id === name) {
					return interaction.reply(message.content);
				}
			}
		}
		return interaction.reply({ content: `Could not find message with ID "${id}"`, ephemeral: true });
	}
};
