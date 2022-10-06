import { AutocompleteInteraction, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { LogLevelColor } from '../../utils/log';
import { PermissionLevel } from '../../utils/permissions';

import * as persist from '../../utils/persist';

const Responses: Command = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('responses')
		.setDescription('Edit responses.')
		.addSubcommand(subcommand => subcommand
			.setName('add')
			.setDescription('Add a new response.')
			.addStringOption(option => option
				.setName('id')
				.setDescription('The ID of the response')
				.setMinLength(1)
				.setMaxLength(50)
				.setRequired(true))
			.addStringOption(option => option
				.setName('contents')
				.setDescription('The response')
				.setMinLength(1)
				.setMaxLength(2000)
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('list')
			.setDescription('List responses.'))
		.addSubcommand(subcommand => subcommand
			.setName('remove')
			.setDescription('Remove a response.')
			.addStringOption(option => option
				.setName('id')
				.setDescription('The ID of the response to remove')
				.setMinLength(1)
				.setMaxLength(50)
				.setAutocomplete(true)
				.setRequired(true))),

	getAutocompleteOptions(interaction: AutocompleteInteraction) {
		if (!interaction.inGuild() || !interaction.guild?.id) return [];

		const data = persist.data(interaction.guild.id);
		const out: { name: string, value: string }[] = [];

		switch (interaction.options.getSubcommand()) {
		case 'remove': {
			for (const id of Object.keys(data.responses)) {
				out.push({ name: id, value: id });
			}
			return out;
		}
		}
		return [];
	},

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.inGuild || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const data = persist.data(interaction.guild.id);

		switch (interaction.options.getSubcommand()) {
		case 'add': {
			const responseID = interaction.options.getString('id', true);
			if (Object.hasOwn(data.responses, responseID)) {
				return interaction.reply({ content: `There is already a response with ID "${responseID}"!`, ephemeral: true });
			}

			data.responses[responseID] = interaction.options.getString('contents', true);
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: 'Added response.', ephemeral: true });
		}

		case 'list': {
			const out: string[] = [];
			for (const responseID of Object.keys(data.responses)) {
				out.push(`- \`${responseID}\``);
			}
			const desc = out.join('\n\n');
			const embed = new EmbedBuilder()
				.setColor(LogLevelColor.INFO)
				.setTitle('RESPONSES LIST')
				.setDescription(desc.length > 0 ? desc : 'There are no responses currently.');

			return interaction.reply({ embeds: [embed] });
		}

		case 'remove': {
			const responseID = interaction.options.getString('id', true);
			if (!Object.hasOwn(data.responses, responseID)) {
				return interaction.reply({ content: `There is no response with ID "${responseID}"!`, ephemeral: true });
			}

			delete data.responses[responseID];
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: 'Removed response.', ephemeral: true });
		}
		}
	}
};
export default Responses;
