import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import readline from 'readline';
import events from 'events';
import { Command } from '../../types/interaction';
import { LogLevelColor, logPath } from '../../utils/log';
import { PermissionLevel } from '../../utils/permissions';

const ReadLog: Command = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('readlog')
		.setDescription('Reads the latest lines from this guild\'s log.')
		.addIntegerOption(option => option
			.setName('lines')
			.setDescription('Number of lines to read')
			.setMinValue(0)
			.setMaxValue(100)),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;

		const numLines = interaction.options.getInteger('lines') ?? 100;
		let lines: string[] = [];

		if (!fs.existsSync(logPath)) {
			fs.writeFileSync(logPath, '');
		}

		const reader = readline.createInterface({
			input: fs.createReadStream(logPath),
			crlfDelay: Infinity
		});
		reader.on('line', line => {
			lines.push(line);
			if (lines.length > numLines) {
				lines = lines.slice(1);
			}
		});
		await events.once(reader, 'close');

		let content = '';
		for (const str of lines) {
			content += str + '\n';
		}

		const embed = new EmbedBuilder()
			.setColor(LogLevelColor.IMPORTANT)
			.setTitle('LATEST LOG ENTRIES')
			.setDescription(`\`\`\`\n${content}\n\`\`\``)
			.setTimestamp();
		return interaction.reply({ embeds: [embed] });
	}
};
export default ReadLog;
