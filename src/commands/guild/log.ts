import { ActionRowBuilder, ChannelType, CommandInteraction, EmbedBuilder, SelectMenuBuilder, SelectMenuOptionBuilder, SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import readline from 'readline';
import events from 'events';
import { Callbacks } from '../../types/client';
import { Command } from '../../types/interaction';
import { LogLevelColor, getLogFilepath } from '../../utils/log';
import { PermissionLevel } from '../../utils/permissions';

import * as persist from '../../utils/persist';

const Log: Command = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('log')
		.setDescription('Logging in this guild.')
		.addSubcommand(subcommand => subcommand
			.setName('read')
			.setDescription('Read the latest entries in the log file for this guild.')
			.addIntegerOption(option => option
				.setName('lines')
				.setDescription('Number of lines to read')
				.setMinValue(1)
				.setMaxValue(50)))
		.addSubcommand(subcommand => subcommand
			.setName('options')
			.setDescription('Configure what is logged.'))
		.addSubcommand(subcommand => subcommand
			.setName('channel')
			.setDescription('Set the channel log messages go to.')
			.addChannelOption(option => option
				.setName('channel')
				.setDescription('The new channel log messages will go to')
				.addChannelTypes(ChannelType.GuildText)
				.setRequired(true))),

	async execute(interaction: CommandInteraction, callbacks: Callbacks) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.inGuild || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const data = persist.data(interaction.guild.id);

		switch (interaction.options.getSubcommand()) {
		case 'read': {
			const numLines = interaction.options.getInteger('lines') ?? 50;
			let lines: string[] = [];

			const logPath = getLogFilepath(interaction.guild.id);
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

			const embed = new EmbedBuilder()
				.setColor(LogLevelColor.IMPORTANT)
				.setTitle('LATEST LOG ENTRIES')
				.setDescription(`\`\`\`\n${lines.join('\n')}\n\`\`\``)
				.setTimestamp();
			return interaction.reply({ embeds: [embed] });
		}

		case 'options': {
			const selectMenu = new ActionRowBuilder<SelectMenuBuilder>()
				.addComponents(
					new SelectMenuBuilder()
						.setCustomId('log_options')
						.setPlaceholder('Logging options')
						.addOptions(
							new SelectMenuOptionBuilder()
								.setLabel('User Name Updates')
								.setDescription('Log when a member\'s username changes')
								.setDefault(data.config.log.options.user_updates)
								.setValue('user_updates'),
							new SelectMenuOptionBuilder()
								.setLabel('User Avatar Updates')
								.setDescription('Log when a member\'s avatar changes')
								.setDefault(data.config.log.options.user_avatar_updates)
								.setValue('user_avatar_updates'),
							new SelectMenuOptionBuilder()
								.setLabel('User Bans')
								.setDescription('Log when a member is banned')
								.setDefault(data.config.log.options.user_bans)
								.setValue('user_bans'),
							new SelectMenuOptionBuilder()
								.setLabel('User Joins & Leaves')
								.setDescription('Log when a user joins or leaves the guild')
								.setDefault(data.config.log.options.user_joins_and_leaves)
								.setValue('user_joins_and_leaves'),
							new SelectMenuOptionBuilder()
								.setLabel('Message Edits')
								.setDescription('Log when a message is edited')
								.setDefault(data.config.log.options.message_edits)
								.setValue('message_edits'),
							new SelectMenuOptionBuilder()
								.setLabel('Message Deletes')
								.setDescription('Log when a message is deleted')
								.setDefault(data.config.log.options.message_deletes)
								.setValue('message_deletes'))
						.setMinValues(0)
						.setMaxValues(6));

			callbacks.addSelectMenuCallback('log_options', async interaction => {
				if (!interaction.inGuild || !interaction.guild) {
					return interaction.reply({ content: 'This only works in a guild!', ephemeral: true });
				}

				for (const logConfig of Object.keys(data.config.log.options)) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(data.config.log.options as any)[logConfig] = interaction.values.includes(logConfig);
				}
				persist.saveData(interaction.guild.id);

				return interaction.reply({ content: 'Configuration has been updated!', ephemeral: true });
			});

			return interaction.reply({ content: 'Log options:', components: [selectMenu], ephemeral: true });
		}

		case 'channel': {
			data.config.log.channel = interaction.options.getChannel('channel', true).id;
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: 'Configuration has been updated!', ephemeral: true });
		}
		}
	}
};
export default Log;
