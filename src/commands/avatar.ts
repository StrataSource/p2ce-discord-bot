import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/command';
import { LogLevelColor } from '../utils/log';
import { PermissionLevel } from '../utils/permissions';

const Avatar: Command = {
	permissionLevel: PermissionLevel.MEMBER,

	data: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription('Prints the full avatar of the selected user.')
		.addUserOption(option => option
			.setName('user')
			.setDescription('The name of the user')),

	async execute(interaction: CommandInteraction) {
		const user = interaction.options.getUser('user') ?? interaction.user;
		const embed = new EmbedBuilder()
			.setColor(LogLevelColor.INFO)
			.setTitle(`Avatar of ${user.username}#${user.discriminator}`)
			.setImage(user.displayAvatarURL());
		return interaction.reply({ embeds: [embed] });
	}
};
export default Avatar;
