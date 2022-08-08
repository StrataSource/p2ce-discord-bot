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

		let description = (interaction.guild.description && interaction.guild.description.length > 0) ? interaction.guild.description : 'Server has no description.';
		const emojis = (await interaction.guild.emojis.fetch()).map(e => e).join(' ');
		if (emojis.length == 0) {
			description += '\n\nThis server has no emojis.';
		} else {
			description += '\n\nServer Emoji:\n' + emojis;
		}

		const creator = await interaction.guild.fetchOwner();

		const channelCount = (await interaction.guild.channels.fetch()).filter(e => e.isTextBased() || e.isVoiceBased()).size;

		// Decrement by 1 because @everyone is a role
		const roleCount = (await interaction.guild.roles.fetch()).size - 1;

		const embed = new EmbedBuilder()
			.setColor(LogLevelColor.INFO)
			.setTitle(interaction.guild.name.toUpperCase())
			.setDescription(description)
			.setThumbnail(interaction.guild.iconURL() + '?size=1024')
			.addFields(
				{ name: 'Created On', value: `<t:${Math.round(interaction.guild.createdTimestamp / 1000)}:f>` },
				{ name: 'Created By', value: `<@${creator.user.id}>` },
				{ name: 'Users', value: `${interaction.guild.memberCount}`, inline: true },
				{ name: 'Channels', value: `${channelCount}`, inline: true },
				{ name: 'Roles', value: `${roleCount}`, inline: true }
			).setTimestamp();
		return interaction.reply({ embeds: [embed] });
	}
};
export default ServerInfo;
