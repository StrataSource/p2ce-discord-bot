import { AutocompleteInteraction, CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';

import * as persist from '../../utils/persist';

const Respond: Command = {
	permissionLevel: PermissionLevel.TEAM_MEMBER,

	data: new SlashCommandBuilder()
		.setName('respond')
		.setDescription('Responds with a message.')
		.addStringOption(option => option
			.setName('id')
			.setDescription('The ID of the response')
			.setMinLength(1)
			.setMaxLength(50)
			.setAutocomplete(true)
			.setRequired(true)),

	getAutocompleteOptions(interaction: AutocompleteInteraction) {
		if (!interaction.inGuild() || !interaction.guild?.id) return [];

		const data = persist.data(interaction.guild.id);
		const out: { name: string, value: string }[] = [];

		for (const id of Object.keys(data.responses)) {
			out.push({ name: id, value: id });
		}
		return out;
	},

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const id = interaction.options.getString('id', true);
		if (id in persist.data(interaction.guild.id).responses) {
			return interaction.reply(persist.data(interaction.guild.id).responses[id]);
		}
		return interaction.reply({ content: `Could not find response with ID "${id}"`, ephemeral: true });
	}
};
export default Respond;
