import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, EmbedBuilder, EmbedAuthorOptions, APIEmbedField } from 'discord.js';
const packagejson = require('../../package.json');
import { Command } from '../types/command';
import { PermissionLevel } from '../utils/permissions';


const BotInfo: Command = {
	permissionLevel: PermissionLevel.MEMBER,

	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Responds with information about the bot.'),

	async execute(interaction: CommandInteraction) {

		const username = interaction.guild?.members.cache.get(interaction.client.user?.id ?? '')?.nickname ?? interaction.client.user?.username ?? '';

		const ao: EmbedAuthorOptions = {
			name: username,
			url: interaction.client.user?.avatarURL()?.toString(),
			iconURL: interaction.client.user?.displayAvatarURL()?.toString()
		};

		const fields:Array<APIEmbedField> = [
			{
				name: 'Bot Version:',
				value: packagejson.version
			},
			{
				name: 'Bot DiscordJS Version:',
				value: packagejson.dependencies['discord.js']
			},
			{
				name: 'Bot NodeJS Version:',
				value: process.version
			}
		];

		const color = interaction.guild?.members.cache.get(interaction.client.user?.id ?? '')?.roles.color?.hexColor ?? '#ffffff';

		const embed = new EmbedBuilder()
			.setAuthor(ao)
			.setTimestamp(new Date())
			.setDescription(`<@${interaction.client.user?.id}> is the official P2:CE Discord bot.`)
			.setColor(color)
			.addFields(fields);

		return interaction.reply({ embeds: [embed] });
	}
};

export default BotInfo;