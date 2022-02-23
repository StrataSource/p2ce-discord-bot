import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageEmbed } from 'discord.js';
import { PermissionLevel } from '../utils';

module.exports = {
	permissionLevel: PermissionLevel.MEMBER,

	data: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription('Prints the full avatar of the selected user.')
		.addUserOption(option => option.setName('user').setDescription('The name of the user')),

	async execute(interaction: CommandInteraction) {
		const user = interaction.options.getUser('target') ?? interaction.user;
		const embed = new MessageEmbed()
			.setColor('#FF7B02')
			.setTitle(`Avatar of ${user.username}`)
			.setImage(user.displayAvatarURL({ dynamic: true }));
		return interaction.reply({ embeds: [embed] });
	}
};
