import { SlashCommandBuilder } from '@discordjs/builders';
import { ChannelType, CommandInteraction, EmbedBuilder, GuildBasedChannel } from 'discord.js';
import { Command } from '../../types/command';
import { LogLevelColor } from '../../utils/log';
import { PermissionLevel } from '../../utils/permissions';
import * as persist from '../../utils/persist';

const KeepThread: Command = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('keepthread')
		.setDescription('Utility to keep threads open.')
		.addSubcommand(subcommand => subcommand
			.setName('add')
			.setDescription('Adds a thread to keep open.')
			.addChannelOption(option => option
				.setName('thread')
				.setDescription('The thread to keep open')
				.addChannelTypes(ChannelType.PublicThread, ChannelType.PrivateThread)
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('list')
			.setDescription('List all threads currently kept open.'))
		.addSubcommand(subcommand => subcommand
			.setName('remove')
			.setDescription('Stop keeping a thread open.')
			.addChannelOption(option => option
				.setName('thread')
				.setDescription('The thread to stop watching')
				.addChannelTypes(ChannelType.PublicThread, ChannelType.PrivateThread)
				.setRequired(true))),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;

		switch (interaction.options.getSubcommand()) {
		case 'add': {
			const thread = interaction.options.getChannel('thread', true);
			if (!(thread as GuildBasedChannel)?.isThread()) {
				return interaction.reply({ content: 'Channel given is not a thread!', ephemeral: true });
			}

			if (!persist.data.watched_threads.includes(thread.id)) {
				persist.data.watched_threads.push(thread.id);
			}
			persist.saveData();

			return interaction.reply({ content: `Watching thread <#${thread.id}>!`, ephemeral: true });
		}

		case 'list': {
			let desc = '';
			for (const id of persist.data.watched_threads) {
				desc += `- <#${id}>\n`;
			}

			const embed = new EmbedBuilder()
				.setColor(LogLevelColor.INFO)
				.setTitle('KEPT THREADS')
				.setDescription(desc.length > 0 ? desc : 'There are no watched threads currently.');

			return interaction.reply({ embeds: [embed] });
		}

		case 'remove': {
			const thread = interaction.options.getChannel('thread', true);
			if (!(thread as GuildBasedChannel)?.isThread()) {
				return interaction.reply({ content: 'Channel given is not a thread!', ephemeral: true });
			}

			if (persist.data.watched_threads.includes(thread.id)) {
				persist.data.watched_threads = persist.data.watched_threads.filter(e => e !== thread.id);
			}
			persist.saveData();

			return interaction.reply({ content: `No longer watching thread <#${thread.id}>.`, ephemeral: true });
		}
		}
	}
};
export default KeepThread;
