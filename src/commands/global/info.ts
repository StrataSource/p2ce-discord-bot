import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { LogLevelColor } from '../../utils/log';
import { PermissionLevel } from '../../utils/permissions';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJSON: { version: number, dependencies: unknown } = require('../../../package.json');

const Info: Command = {
	permissionLevel: PermissionLevel.EVERYONE,
	canBeExecutedWithoutPriorGuildSetup: true,

	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Responds with information about the bot.'),

	async execute(interaction: CommandInteraction) {
		const username = interaction.client.user?.username ?? 'Morality Core';

		const embed = new EmbedBuilder()
			.setAuthor({
				name: username,
				url: 'https://github.com/ChaosInitiative/p2ce-discord-bot',
				iconURL: interaction.client.user?.displayAvatarURL(),
			})
			.setDescription('This server\'s robotic helper and moral compass.')
			.setColor(LogLevelColor.INFO)
			.addFields(
				{ name: 'Version', value: `${packageJSON.version}`, inline: true },
				{ name: 'Discord.JS', value: (packageJSON.dependencies as { 'discord.js': string })['discord.js'].substring(1), inline: true },
				{ name: 'Node.JS', value: process.versions.node, inline: true },
				{ name: 'Memory Usage', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
				{ name: 'Uptime', value: `${(interaction.client.uptime / 1000 / 60 / 60).toFixed(3)} hours`, inline: true },
				{ name: 'Servers', value: `${(await interaction.client.guilds.fetch()).size}`, inline: true })
			.setTimestamp();

		return interaction.reply({ embeds: [embed] });
	}
};
export default Info;
