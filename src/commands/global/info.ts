import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/command';
import { LogLevelColor } from '../../utils/log';
import { PermissionLevel } from '../../utils/permissions';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJSON: { version: number, dependencies: unknown } = require('../../../package.json');

const Info: Command = {
	permissionLevel: PermissionLevel.MEMBER,

	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Responds with information about the bot.'),

	async execute(interaction: CommandInteraction) {
		const username = interaction.guild?.members.cache.get(interaction.client.user?.id ?? '')?.nickname ?? interaction.client.user?.username ?? '';

		const embed = new EmbedBuilder()
			.setAuthor({
				name: username,
				url: interaction.client.user?.avatarURL()?.toString(),
				iconURL: interaction.client.user?.displayAvatarURL()?.toString()
			}).setDescription('This server\'s robotic helper and moral compass.')
			.setColor(LogLevelColor.INFO)
			.addFields(
				{ name: 'Bot Version', value: `${packageJSON.version}` },
				{ name: 'Discord.JS Version', value: (packageJSON.dependencies as { 'discord.js': string })['discord.js'].substring(1) },
				{ name: 'Node.JS Version', value: process.versions.node }
			).setTimestamp();

		return interaction.reply({ embeds: [embed] });
	}
};
export default Info;
