// noinspection JSUnusedGlobalSymbols

import { AutocompleteInteraction, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';
import { LogLevelColor } from '../../utils/log';

import * as persist from '../../utils/persist';

const IssueRepos: Command = {
	permissionLevel: PermissionLevel.TEAM_MEMBER,

	data: new SlashCommandBuilder()
		.setName('issuerepos')
		.setDescription('Configure GitHub repositories used in the issue command.')
		.addSubcommand(subcommand => subcommand
			.setName('add')
			.setDescription('Register a GitHub repository for use in GitHub-related commands.')
			.addStringOption(option => option
				.setName('id')
				.setDescription('The ID to be associated with the repository')
				.setMinLength(1)
				.setMaxLength(50)
				.setRequired(true))
			.addStringOption(option => option
				.setName('repository_owner')
				.setDescription('The user or organization that holds the repository')
				.setRequired(true))
			.addStringOption(option => option
				.setName('repository_name')
				.setDescription('The name of the repository')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('list')
			.setDescription('List all registered GitHub repositories.')
			.addBooleanOption(option => option
				.setName('ephemeral')
				.setDescription('If the reply is ephemeral or not, defaults to false')))
		.addSubcommand(subcommand => subcommand
			.setName('remove')
			.setDescription('Remove a registered GitHub repository.')
			.addStringOption(option => option
				.setName('id')
				.setDescription('The repository\'s ID')
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
			for (const id of Object.keys(data.github_repos)) {
				out.push({ name: id, value: id });
			}
			return out;
		}
		}
		return [];
	},

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const data = persist.data(interaction.guild.id);

		switch (interaction.options.getSubcommand()) {
		case 'add': {
			const repoID = interaction.options.getString('id', true);
			if (Object.hasOwn(data.github_repos, repoID)) {
				return interaction.reply({ content: `There is already a GitHub repository associated with ID "${repoID}"!`, ephemeral: true });
			}

			data.github_repos[repoID] = {
				owner: interaction.options.getString('repository_owner', true),
				name: interaction.options.getString('repository_name', true),
			};
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: 'Added GitHub repository.', ephemeral: true });
		}

		case 'list': {
			const out: string[] = [];
			for (const [repoID, repo] of Object.entries(data.github_repos)) {
				out.push(`- \`${repoID}\`: https://github.com/${repo.owner}/${repo.name}`);
			}
			const desc = out.join('\n');
			const embed = new EmbedBuilder()
				.setColor(LogLevelColor.INFO)
				.setTitle('ISSUE REPOS LIST')
				.setDescription(desc.length > 0 ? desc : 'There are no GitHub repositories currently.');

			return interaction.reply({ embeds: [embed], ephemeral: interaction.options.getBoolean('ephemeral', false) ?? false });
		}

		case 'remove': {
			const repoID = interaction.options.getString('id', true);
			if (!Object.hasOwn(data.github_repos, repoID)) {
				return interaction.reply({ content: `There is no GitHub repository associated with ID "${repoID}"!`, ephemeral: true });
			}

			delete data.github_repos[repoID];
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: 'Removed GitHub repository.', ephemeral: true });
		}
		}
	},
};
export default IssueRepos;
