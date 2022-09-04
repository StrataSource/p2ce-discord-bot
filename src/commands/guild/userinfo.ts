import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/command';
import { LogLevelColor } from '../../utils/log';
import { PermissionLevel } from '../../utils/permissions';

const UserInfo: Command = {
	permissionLevel: PermissionLevel.MEMBER,

	data: new SlashCommandBuilder()
		.setName('userinfo')
		.setDescription('Displays some information about the given user.')
		.addUserOption(option => option
			.setName('user')
			.setDescription('The name of the user')),

	async execute(interaction: CommandInteraction) {
		const user = interaction.options.getUser('user') ?? interaction.user;
		const embed = new EmbedBuilder()
			.setColor(LogLevelColor.INFO)
			.setAuthor({ name: `${user.username}#${user.discriminator}`, iconURL: user.avatarURL({ size: 1024 }) ?? undefined })
			.setThumbnail(user.displayAvatarURL({ size: 1024 }))
			.addFields(
				{ name: 'User ID', value: `\`${user.id}\`` },
				{ name: 'Joined Discord', value: `<t:${(user.createdAt.getTime() / 1000).toFixed(0)}:D>` })
			.setTimestamp();

		return interaction.reply({ embeds: [embed] });
	},
};
export default UserInfo;
