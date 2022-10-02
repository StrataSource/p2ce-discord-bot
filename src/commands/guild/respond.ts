import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';

import * as config from '../../config.json';

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
		if (!interaction.isChatInputCommand()) return;

		const id = interaction.options.getString('id', true);
		if (id in config.messages) {
			return interaction.reply((config.messages as {[id: string]: string})[id]);
		}
		return interaction.reply({ content: `Could not find message with ID "${id}"`, ephemeral: true });
	}
};
export default Respond;
