// noinspection JSUnusedGlobalSymbols

import { ChannelType, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { LogLevelColor } from '../../utils/log';
import { PermissionLevel } from '../../utils/permissions';

import * as persist from '../../utils/persist';

const WatchList: Command = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('watchlist')
		.setDescription('Adds untrusted users to a list for higher level moderation.')
		.addSubcommand(subcommand => subcommand
			.setName('add')
			.setDescription('Add a user to the watchlist.')
			.addUserOption(option => option
				.setName('user')
				.setDescription('The user to add to the watchlist')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('list')
			.setDescription('List all current users in the watchlist.')
			.addBooleanOption(option => option
				.setName('ephemeral')
				.setDescription('If the reply is ephemeral or not, defaults to false')))
		.addSubcommand(subcommand => subcommand
			.setName('remove')
			.setDescription('Remove a user from the watchlist.')
			.addUserOption(option => option
				.setName('user')
				.setDescription('The user to remove from the watchlist')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('set')
			.setDescription('Set the channel watched users will log to.')
			.addChannelOption(option => option
				.setName('channel')
				.setDescription('The channel watched users will log to')
				.addChannelTypes(ChannelType.GuildText)
				.setRequired(true))),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const data = persist.data(interaction.guild.id);
		if (!data.moderation.watchlist) {
			data.moderation.watchlist = {
				channel: null,
				users: [],
			};
			persist.saveData(interaction.guild.id);
		}

		let reminderChannelSetupString = '';
		if (!data.moderation.watchlist.channel) {
			// todo: use slash command mention
			reminderChannelSetupString = ' Remember to set up the watchlist log channel with `/watchlist set`!';
		}

		switch (interaction.options.getSubcommand()) {
		case 'add': {
			const user = interaction.options.getUser('user', true);
			if (data.moderation.watchlist.users.includes(user.id)) {
				return interaction.reply({ content: `${user} is already on the watchlist.${reminderChannelSetupString}`, ephemeral: true });
			}

			data.moderation.watchlist.users.push(user.id);
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: `Added user ${user} to watchlist.${reminderChannelSetupString}`, ephemeral: true });
		}

		case 'list': {
			const out: string[] = [];
			for (const userID of data.moderation.watchlist.users) {
				out.push(`- <@${userID}>`);
			}
			const desc = out.join('\n');
			const embed = new EmbedBuilder()
				.setColor(LogLevelColor.INFO)
				.setTitle('WATCHLIST')
				.setDescription(desc.length > 0 ? desc : 'There are no users in the watchlist.');

			return interaction.reply({ embeds: [embed], ephemeral: interaction.options.getBoolean('ephemeral', false) ?? false });
		}

		case 'remove': {
			const user = interaction.options.getUser('user', true);

			if (!data.moderation.watchlist.users.includes(user.id)) {
				return interaction.reply({ content: `${user} is not in the watchlist.${reminderChannelSetupString}`, ephemeral: true });
			}
			data.moderation.watchlist.users = data.moderation.watchlist.users.filter(userID => userID !== user.id);
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: `Removed user ${user} from watchlist.${reminderChannelSetupString}`, ephemeral: true });
		}

		case 'set': {
			const channel = interaction.options.getChannel('channel', true);

			data.moderation.watchlist.channel = channel.id;
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: `Set watchlist channel to ${channel}.`, ephemeral: true });
		}
		}
	}
};
export default WatchList;
