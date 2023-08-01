import { ChannelType, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
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
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const data = persist.data(interaction.guild.id);

		switch (interaction.options.getSubcommand()) {
		case 'add': {
			const thread = await interaction.guild.channels.fetch(interaction.options.getChannel('thread', true).id);
			if (!thread || !thread.isThread()) {
				return interaction.reply({ content: 'Channel given is not a thread!', ephemeral: true });
			}

			if (!data.watched_threads.includes(thread.id)) {
				data.watched_threads.push(thread.id);
				thread.join();
			}
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: `Watching thread <#${thread.id}>!`, ephemeral: true });
		}

		case 'list': {
			const out: string[] = [];
			for (const id of data.watched_threads) {
				out.push(`- <#${id}>`);
			}
			const desc = out.join('\n');
			const embed = new EmbedBuilder()
				.setColor(LogLevelColor.INFO)
				.setTitle('KEPT THREADS')
				.setDescription(desc.length > 0 ? desc : 'There are no watched threads currently.');

			return interaction.reply({ embeds: [embed] });
		}

		case 'remove': {
			const thread = await interaction.guild.channels.fetch(interaction.options.getChannel('thread', true).id);
			if (!thread || !thread.isThread()) {
				return interaction.reply({ content: 'Channel given is not a thread!', ephemeral: true });
			}

			if (data.watched_threads.includes(thread.id)) {
				data.watched_threads = data.watched_threads.filter(e => e !== thread.id);
				thread.leave();
			}
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: `No longer watching thread <#${thread.id}>.`, ephemeral: true });
		}
		}
	}
};
export default KeepThread;
