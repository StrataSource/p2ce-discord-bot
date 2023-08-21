// noinspection JSUnusedGlobalSymbols,ES6ConvertRequireIntoImport

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { LogLevelColor } from '../../utils/log';
import { PermissionLevel } from '../../utils/permissions';

import * as config from '../../config.json';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJSON: { version: number, dependencies: { 'discord.js': string } } = require('../../../package.json');

const Info: Command = {
	permissionLevel: PermissionLevel.EVERYONE,
	canBeExecutedWithoutPriorGuildSetup: true,

	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Responds with information about the bot.'),

	async execute(interaction: CommandInteraction) {
		const username = interaction.client.user.displayName;

		const embed = new EmbedBuilder()
			.setAuthor({
				name: username,
				url: 'https://github.com/StrataSource/p2ce-discord-bot',
				iconURL: interaction.client.user?.displayAvatarURL(),
			})
			.setDescription('This server\'s robotic helper and moral compass.')
			.setColor(LogLevelColor.INFO)
			.addFields(
				{ name: 'Version', value: `${packageJSON.version}`, inline: true },
				{ name: 'Discord.JS', value: packageJSON.dependencies['discord.js'].substring(1), inline: true },
				{ name: 'Node.JS', value: process.versions.node, inline: true },
				{ name: 'Memory Usage', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
				{ name: 'Uptime', value: `${(interaction.client.uptime / 1000 / 60 / 60).toFixed(3)} hours`, inline: true },
				{ name: 'Servers', value: `${(await interaction.client.guilds.fetch()).size}`, inline: true })
			.setTimestamp();

		const inviteButton = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(
				new ButtonBuilder()
					.setLabel('Add to Server')
					.setStyle(ButtonStyle.Link)
					.setURL(`https://discord.com/api/oauth2/authorize?client_id=${config.client_id}&permissions=8&scope=bot%20applications.commands`));

		return interaction.reply({ embeds: [embed], components: [inviteButton] });
	}
};
export default Info;
