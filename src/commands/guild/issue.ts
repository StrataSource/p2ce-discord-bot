import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/command';
import { PermissionLevel } from '../../utils/permissions';

import * as config from '../../config.json';

const Issue: Command = {
	permissionLevel: PermissionLevel.MEMBER,

	data: new SlashCommandBuilder()
		.setName('issue')
		.setDescription('Retrieve a link to an issue on GitHub.')
		.addStringOption(option => {
			option.setName('repo')
				.setDescription('The repository the issue is in')
				.setRequired(true);

			// Update commands when this part of the config changes
			Object.keys(config.git_repos).forEach(id => option.addChoices({ name: id, value: id }));
			return option;
		})
		.addIntegerOption(option => option
			.setName('id')
			.setDescription('The issue number')
			.setRequired(true)),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;

		const repo = interaction.options.getString('repo', true);
		if (repo in config.git_repos) {
			let repoURL = (config.git_repos as {[repo: string]: string})[repo];
			if (repoURL.endsWith('/')) {
				repoURL = repoURL.substring(0, repoURL.length - 1);
			}
			return interaction.reply(`${repoURL}/issues/${interaction.options.getInteger('id', true)}`);
		}
		return interaction.reply({ content: `Could not find repository "${repo}"`, ephemeral: true });
	}
};
export default Issue;
