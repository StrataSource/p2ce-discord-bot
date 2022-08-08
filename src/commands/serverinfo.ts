import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/command';
import { LogLevelColor } from '../utils/log';
import { PermissionLevel } from '../utils/permissions';

const ServerInfo: Command = {
	permissionLevel: PermissionLevel.MEMBER,

	data: new SlashCommandBuilder()
		.setName('serverinfo')
		.setDescription('Get information about the current server.'),

	async execute(interaction: CommandInteraction) {
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply('This command can only be ran in a server.');
		}

		const description = (interaction.guild.description && interaction.guild.description.length > 0) ? interaction.guild.description : 'Server has no description.';

		const creator = await interaction.guild.fetchOwner();

		const emojis = interaction.guild.emojis.cache.map(e => e).join(' ');

		const embed = new EmbedBuilder()
			.setColor(LogLevelColor.INFO)
			.setTitle(interaction.guild.name.toUpperCase())
			.setDescription(description)
			.setThumbnail(interaction.guild.iconURL())
			.addFields(
				{ name: 'Created On', value: `<t:${Math.round(interaction.guild.createdTimestamp / 1000)}:f>` },
				{ name: 'Created By', value: `<@${creator.user.id}>` },
				{ name: 'Users', value: interaction.guild.memberCount.toString(), inline: true },
				{ name: 'Channels', value: interaction.guild.channels.channelCountWithoutThreads.toString(), inline: true },
				{ name: 'Roles', value: (interaction.guild.roles.cache.size - 1).toString(), inline: true },
				{ name: 'Server Emoji', value: emojis.length > 0 ? emojis : 'This server has no emojis.' }
			);
		return interaction.reply({ embeds: [embed] });
	}
};
export default ServerInfo;
