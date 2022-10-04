import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { GitHubIssue } from '../../types/github';
import { Command } from '../../types/interaction';
import { getIssueInRepo, searchIssuesInRepo } from '../../utils/github';
import { PermissionLevel } from '../../utils/permissions';
import { LogLevelColor, writeToLog } from '../../utils/log';

import * as config from '../../config.json';

const search_skipback    = new ButtonBuilder().setCustomId('search_skipback')   .setLabel('⏮️').setStyle(ButtonStyle.Secondary);
const search_pageback    = new ButtonBuilder().setCustomId('search_pageback')   .setLabel('◀️').setStyle(ButtonStyle.Secondary);
const search_pageforward = new ButtonBuilder().setCustomId('search_pageforward').setLabel('▶️').setStyle(ButtonStyle.Secondary);
const search_skipforward = new ButtonBuilder().setCustomId('search_skipforward').setLabel('⏭️').setStyle(ButtonStyle.Secondary);

function getMaxPages(length: number) {
	const maxItems = config.options.github.search_page_length;
	return Math.trunc((length - 0.5) / maxItems) + 1;
}

async function getSearchEmbed(issues: Array<GitHubIssue>, repo: string, query: string, page: number, maxPage: number) {
	const maxItems = config.options.github.search_page_length;

	const startingPoint = (page - 1) * maxItems;
	let stoppingPoint = page * maxItems;
	if ((issues.length - startingPoint) < maxItems) {
		stoppingPoint = issues.length;
	}

	let out = '';
	for (let i = startingPoint; i < stoppingPoint; i++) {
		out += `[${issues[i].number}](${issues[i].html_url}): ${issues[i].state === 'closed' ? '*' : ''}${issues[i].title}${issues[i].state === 'closed' ? '*' : ''}\n`;
	}

	// Note: update onButtonPressed if this is ever changed
	return new EmbedBuilder()
		.setColor(LogLevelColor.INFO)
		.setTitle('ISSUE SEARCH')
		.addFields(
			{ name: 'Repository', value: repo, inline: true },
			{ name: 'Query', value: query, inline: true },
			{ name: 'Results', value: out.length > 0 ? out : `No issues found for query \`${query}\`.`, inline: false })
		.setFooter({ text: `Page ${page} / ${maxPage}` })
		.setTimestamp();
}

const Issue: Command = {
	permissionLevel: PermissionLevel.MEMBER,

	data: new SlashCommandBuilder()
		.setName('issue')
		.setDescription('Retrieve a link to an issue on GitHub.')
		.addSubcommand(subcommand => subcommand
			.setName('get')
			.setDescription('Replies with a link to the given issue')
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
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('search')
			.setDescription('Search for an issue on the given repository')
			.addStringOption(option => {
				option.setName('repo')
					.setDescription('The repository the issue is in')
					.setRequired(true);

				// Update commands when this part of the config changes
				Object.keys(config.git_repos).forEach(id => option.addChoices({ name: id, value: id }));
				return option;
			})
			.addStringOption(option => option
				.setName('query')
				.setDescription('The search query')
				.setRequired(true))
			.addBooleanOption(option => option
				.setName('open')
				.setDescription('If the issue must be open or not (default is to search all issues)'))),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;

		switch (interaction.options.getSubcommand()) {
		case 'get': {
			const repo = interaction.options.getString('repo', true);
			if (!(repo in config.git_repos)) {
				return interaction.reply({ content: `Could not find repository "${repo}"`, ephemeral: true });
			}
			await interaction.deferReply();

			const issueID = interaction.options.getInteger('id', true);
			const issue = await getIssueInRepo(repo, issueID);
			if (!issue) {
				return interaction.editReply(`Could not find issue #${issueID}`);
			}

			let description: string;
			if (issue.body) {
				description = issue.body.length > 5000 ? issue.body.substring(0, 5000) + '...' : issue.body;
			} else {
				description = 'No description';
			}

			const embed = new EmbedBuilder()
				.setColor(LogLevelColor.INFO)
				.setAuthor({ name: issue.user?.login ?? 'Unknown', url: issue.user?.html_url, iconURL: issue.user?.avatar_url })
				.setTitle(`Issue #${issue.number}: ${issue.title}`)
				.setDescription(description)
				.setURL(issue.html_url)
				.setTimestamp(Date.parse(issue.created_at));

			return interaction.editReply({ embeds: [embed] });
		}

		case 'search': {
			const repo = interaction.options.getString('repo', true);
			if (!(repo in config.git_repos)) {
				return interaction.reply(`Could not find repository "${repo}"`);
			}
			await interaction.deferReply();

			const query = interaction.options.getString('query', true);

			const issues = await searchIssuesInRepo(repo, query, interaction.options.getBoolean('open'));

			const maxPage = getMaxPages(issues.length);

			const embed = await getSearchEmbed(issues, repo, query, 1, maxPage);

			// Left buttons are disabled because we start on page 1
			const buttons = new ActionRowBuilder<ButtonBuilder>()
				.addComponents(
					search_skipback.setDisabled(true),
					search_pageback.setDisabled(true),
					search_pageforward.setDisabled(maxPage === 1),
					search_skipforward.setDisabled(maxPage === 1));

			return interaction.editReply({ embeds: [embed], components: [buttons] });
		}
		}
	},

	async onButtonPressed(interaction: ButtonInteraction) {
		// HACKY DISGUSTING HACK BEGIN
		if (interaction.message.embeds.length === 0) {
			// Can't access the embed, someone deleted it
			return interaction.reply({ content: 'Cannot access message embed.', ephemeral: true });
		}
		const repo = interaction.message.embeds[0].fields[0].value;
		const query = interaction.message.embeds[0].fields[1].value;
		const pageInfo = (interaction.message.embeds[0].footer?.text ?? 'Page 1 / 1').split(' ');
		let page = parseInt(pageInfo[1]);
		const maxPage = parseInt(pageInfo[3]);
		// HACKY DISGUSTING HACK END

		switch (interaction.customId) {
		case 'search_skipback':
			page = 1;
			break;
		case 'search_pageback':
			page--;
			if (page < 1) page = 1;
			break;
		case 'search_pageforward':
			page++;
			if (page > maxPage) page = maxPage;
			break;
		case 'search_skipforward':
			page = maxPage;
			break;
		}

		await interaction.deferUpdate();

		const newEmbed = await getSearchEmbed(await searchIssuesInRepo(repo, query), repo, query, page, maxPage);

		const buttons = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(
				search_skipback.setDisabled(page === 1),
				search_pageback.setDisabled(page === 1),
				search_pageforward.setDisabled(maxPage === page),
				search_skipforward.setDisabled(maxPage === page));

		try {
			await interaction.editReply({ embeds: [newEmbed], components: [buttons] });
		} catch (err) {
			writeToLog(undefined, (err as Error).toString());
		}
	}
};
export default Issue;
