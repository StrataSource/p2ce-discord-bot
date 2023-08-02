import { CommandInteraction, EmbedBuilder, GuildMember, PartialGuildMember, PartialUser, User } from 'discord.js';
import { LogLevelColor } from '../../utils/log';
import { AvatarSize, getUserOrMemberAvatarAttachment } from '../../utils/utils';

export async function getMemberAvatar(interaction: CommandInteraction, user: User | PartialUser | GuildMember | PartialGuildMember, avatarSize: AvatarSize, ephemeral: boolean) {
	const [attachment, path] = await getUserOrMemberAvatarAttachment(user, avatarSize);
	const embed = new EmbedBuilder()
		.setColor(LogLevelColor.INFO)
		.setAuthor({ name: user.displayName, iconURL: path })
		.setImage(path);
	return interaction.reply({ embeds: [embed], files: [attachment], ephemeral: ephemeral });
}
