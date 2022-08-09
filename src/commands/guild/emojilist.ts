import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/command';
import { LogLevelColor } from '../../utils/log';
import { PermissionLevel } from '../../utils/permissions';

const EmojiList: Command = {
	permissionLevel: PermissionLevel.MEMBER,

	data: new SlashCommandBuilder()
		.setName('emojilist')
		.setDescription('Get all available emojis in the current server.'),

	async execute(interaction: CommandInteraction) {
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply('This command can only be ran in a server.');
		}

		const emojis = interaction.guild.emojis.cache.map(e => `${e} - \`:${e.name}:\``).join('\n');

		const embed = new EmbedBuilder()
			.setColor(LogLevelColor.INFO)
			.setTitle('EMOJI LIST')
			.setDescription(emojis.length > 0 ? emojis : 'This server has no emojis.');
		return interaction.reply({ embeds: [embed] });
	}
};
export default EmojiList;
