import { CommandInteraction, EmbedBuilder, PartialUser, User } from 'discord.js';
import { LogLevelColor } from '../../utils/log';
import { formatDate, formatUserRaw } from '../../utils/utils';

export async function getUserInfo(interaction: CommandInteraction, user: User | PartialUser, ephemeral: boolean) {
	const embed = new EmbedBuilder()
		.setColor(LogLevelColor.INFO)
		.setAuthor({ name: formatUserRaw(user), iconURL: user.avatarURL({ size: 1024 }) ?? undefined })
		.setThumbnail(user.displayAvatarURL({ size: 1024 }))
		.addFields(
			{ name: 'User ID', value: `\`${user.id}\`` },
			{ name: 'Joined Discord', value: `<t:${formatDate(user.createdAt)}:D>` })
		.setTimestamp();
	return interaction.reply({ embeds: [embed], ephemeral: ephemeral });
}
