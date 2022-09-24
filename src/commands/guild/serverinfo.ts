import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/command';
import { LogLevelColor } from '../../utils/log';
import { PermissionLevel } from '../../utils/permissions';

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

		let emojis = (await interaction.guild.emojis.fetch()).map(e => e).join(' ');
		if (emojis.length == 0) {
			emojis = 'This server has no emojis.';
		}

		const creator = await interaction.guild.fetchOwner();

		// Forum channels are null in djs 14.2, when they're properly added you can change this
		const channelCount = (await interaction.guild.channels.fetch()).filter(e => (e == null) || (e.isTextBased() || e.isVoiceBased())).size;

		// Reminder that @everyone is a role
		const roleCount = (await interaction.guild.roles.fetch()).size;

		const embed = new EmbedBuilder()
			.setColor(LogLevelColor.INFO)
			.setTitle(interaction.guild.name.toUpperCase())
			.setDescription(description)
			.setThumbnail(interaction.guild.iconURL({ size: 1024 }))
			.addFields(
				{ name: 'Server Emoji', value: emojis },
				{ name: 'Created On', value: `<t:${Math.round(interaction.guild.createdTimestamp / 1000)}:f>`, inline: true },
				{ name: 'Created By', value: `<@${creator.user.id}>`, inline: true },
				{ name: 'Partner Server', value: `${interaction.guild.partnered ? 'Yes' : 'No'}`, inline: true },
				{ name: 'Users', value: `${interaction.guild.memberCount}`, inline: true },
				{ name: 'Channels', value: `${channelCount}`, inline: true },
				{ name: 'Roles', value: `${roleCount}`, inline: true })
			.setTimestamp();
		return interaction.reply({ embeds: [embed] });
	}
};
export default ServerInfo;
