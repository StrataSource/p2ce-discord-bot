import { CommandInteraction, EmbedBuilder, PartialUser, User } from 'discord.js';
import { LogLevelColor } from '../../utils/log';
import * as persist from '../../utils/persist';
import {format} from '../../utils/utils';

export async function getUserInfo(interaction: CommandInteraction, user: User | PartialUser, ephemeral: boolean) {
	const warns = interaction.guildId != null ? `${persist.data(interaction.guildId).moderation.warns[user.id].length}` : 'N/D';
	const embed = new EmbedBuilder()
		.setColor(LogLevelColor.INFO)
		.setAuthor({ name: format(user), iconURL: user.avatarURL({ size: 1024 }) ?? undefined })
		.setThumbnail(user.displayAvatarURL({ size: 1024 }))
		.addFields(
			{ name: 'User ID', value: `\`${user.id}\`` },
			{ name: 'Warn count', value: `\`${warns}\`` },
			{ name: 'Joined Discord', value: `<t:${(user.createdAt.getTime() / 1000).toFixed(0)}:D>` })
		.setTimestamp();
	return interaction.reply({ embeds: [embed], ephemeral: ephemeral });
}
