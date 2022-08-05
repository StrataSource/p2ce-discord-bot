import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { PermissionLevel } from '../utils/permissions';
import { Command } from '../types/command';

import * as config from '../config.json';

const Respond: Command = {
	permissionLevel: PermissionLevel.TEAM_MEMBER,

	data: new SlashCommandBuilder()
		.setName('respond')
		.setDescription('Responds with a message.')
		.addStringOption(option => {
			option.setName('id')
				.setDescription('The ID of the message to respond with')
				.setRequired(true);

			// Update commands when this part of the config changes
			Object.keys(config.messages).forEach(id => option.addChoices({ name: id, value: id }));
			return option;
		}),

	async execute(interaction: CommandInteraction) {
		const id = interaction.options.get('id', true).value?.toString();
		if (id && (id in config.messages)) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return interaction.reply((config.messages as any)[id]);
		}
		return interaction.reply({ content: `Could not find message with ID "${id}"`, ephemeral: true });
	}
};
export default Respond;
