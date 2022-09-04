import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/command';
import { LogLevelColor } from '../../utils/log';
import { PermissionLevel } from '../../utils/permissions';

const UserInfo: Command = {
	permissionLevel: PermissionLevel.MEMBER,

	data: new SlashCommandBuilder()
		.setName('userinfo')
		.setDescription('Displays the user information of the message author.'),

	async execute(interaction: CommandInteraction) {
		const user = interaction.options.getUser('user') ?? interaction.user;
		const name = `${user.username}#${user.discriminator}`;
		const avatar = user.avatarURL({ size: 1024 });

		const embed = new EmbedBuilder()
			.setColor(LogLevelColor.INFO)
			.setTitle(user.username)
			.setAuthor({ name: name, iconURL: avatar ?? undefined })
			.setDescription(`Your ID: ${user.id}`)
			.setThumbnail(avatar)
			.addFields({
				name: 'Joined Discord',
				value: `<t:${(user.createdAt.getTime() / 1000).toFixed(0)}:D>`,
			})
			.setTimestamp();

		return interaction.reply({ embeds: [embed] });
	},
};
export default UserInfo;
