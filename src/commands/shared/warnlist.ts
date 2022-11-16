import { ChatInputCommandInteraction, ContextMenuCommandInteraction, EmbedBuilder, Guild, PartialUser, User } from 'discord.js';
import { LogLevelColor } from '../../utils/log';
import { formatDate, formatUserRaw } from '../../utils/utils';

import * as persist from '../../utils/persist';

export async function getWarnList(interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction, guild: Guild, user: User | PartialUser, ephemeral: boolean) {
	const data = persist.data(guild.id);

	const embed = new EmbedBuilder()
		.setColor(LogLevelColor.INFO)
		.setAuthor({ name: formatUserRaw(user), iconURL: user.avatarURL({ size: 1024 }) ?? undefined })
		.setTitle('WARN LIST')
		.setDescription('This user has no warns.')
		.setTimestamp();

	if (!Object.hasOwn(data.moderation.warns, user.id)) {
		return interaction.reply({
			embeds: [embed],
			ephemeral: ephemeral,
		});
	}

	const warnStr: string[] = [];
	for (const warn of data.moderation.warns[user.id]) {
		const issuer = await interaction.client.users.fetch(warn.issuer);
		warnStr.push(`<t:${formatDate(warn.date)}:F>\n__Reason__: \`${warn.reason}\`\n__Issuer__: ${issuer}`);
	}
	embed.setDescription(warnStr.join('\n\n'));

	return interaction.reply({
		embeds: [embed],
		ephemeral: ephemeral,
	});
}
