// noinspection JSUnusedGlobalSymbols

import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { LogLevelColor } from '../../utils/log';
import { PermissionLevel } from '../../utils/permissions';

import * as persist from '../../utils/persist';

const ServerStats: Command = {
	permissionLevel: PermissionLevel.TEAM_MEMBER,

	data: new SlashCommandBuilder()
		.setName('serverstats')
		.setDescription('Get more detailed statistics about the current server than the /serverinfo command.')
		.addBooleanOption(option => option
			.setName('ephemeral')
			.setDescription('If the reply is ephemeral or not, defaults to false')),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const data = persist.data(interaction.guild.id);

		// Forum channels are null in djs 14.2, when they're properly added you can change this
		const channelCount = (await interaction.guild.channels.fetch()).filter(e => (e == null) || (e.isTextBased() || e.isVoiceBased())).size;

		// Reminder that @everyone is a role
		const roleCount = (await interaction.guild.roles.fetch()).size;

		const joins = data.statistics.joins;
		const leaves = data.statistics.leaves;

		const embed = new EmbedBuilder()
			.setColor(LogLevelColor.INFO)
			.setTitle(interaction.guild.name.toUpperCase())
			.setThumbnail(interaction.guild.iconURL({ size: 1024 }))
			.addFields(
				{ name: 'Member Count', value: `${interaction.guild.memberCount}`, inline: true },
				{ name: 'Boosters', value: `${interaction.guild.premiumSubscriptionCount}`, inline: true },
				{ name: 'Channels', value: `${channelCount}`, inline: true },
				{ name: 'Roles', value: `${roleCount}`, inline: true },
				{ name: 'Joins', value: `${joins}`, inline: true },
				{ name: 'Leaves', value: `${leaves}`, inline: true },
				{ name: 'J/L Ratio', value: `${joins / leaves}`, inline: true })
			.setTimestamp();
		return interaction.reply({ embeds: [embed], ephemeral: interaction.options.getBoolean('ephemeral', false) ?? false });
	}
};
export default ServerStats;
