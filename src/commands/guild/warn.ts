import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';
import { LogLevelColor } from '../../utils/log';

import * as persist from '../../utils/persist';
import { getWarnList } from '../shared/warnlist';

const Warn: Command = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('warn')
		.setDescription('Commands to manage warnings.')
		.addSubcommand(subcommand => subcommand
			.setName('list')
			.setDescription('List all the warnings that have been given to an user.')
			.addUserOption(option => option
				.setName('user')
				.setDescription('The user to get the warn history of')
				.setRequired(true))
			.addBooleanOption(option => option
				.setName('ephemeral')
				.setDescription('If the reply is ephemeral or not, defaults to false')))
		.addSubcommand(subcommand => subcommand
			.setName('add')
			.setDescription('Warns the user with the given ID.')
			.addUserOption(option => option
				.setName('user')
				.setDescription('The user to warn')
				.setRequired(true))
			.addStringOption(option => option
				.setName('reason')
				.setDescription('The reason of the warning')
				.setRequired(true))
			.addBooleanOption(option => option
				.setName('dm_offender')
				.setDescription('If the offender should be DM\'d, default to true')))
		.addSubcommand(subcommand => subcommand
			.setName('clear')
			.setDescription('Clear an user\'s warning record.')
			.addUserOption(option => option
				.setName('user')
				.setDescription('The user to clear the warning record of')
				.setRequired(true))),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const data = persist.data(interaction.guild.id);

		const user = interaction.options.getUser('user', true);

		switch (interaction.options.getSubcommand()) {
		case 'add': {
			if (!(user.id in data.moderation.warns)) {
				data.moderation.warns[user.id] = [];
				persist.saveData(interaction.guild.id);
			}

			const reason = interaction.options.getString('reason', true);
			data.moderation.warns[user.id].push({
				date: Date.now(),
				reason: reason,
				issuer: interaction.user.id,
			});
			persist.saveData(interaction.guild.id);

			if (interaction.options.getBoolean('dm_offender', false) ?? true) {
				const embed = new EmbedBuilder()
					.setColor(LogLevelColor.WARNING)
					.setTitle('WARN')
					.setFields({ name: 'You have been warned for the following reason:', value: `\`${reason}\`` })
					.setFooter({ text: `Issued in "${interaction.guild.name}"` })
					.setTimestamp();

				await user.send({ embeds: [embed] });
			}

			return interaction.reply({ content: `Warned ${user}, this is warn \\#${data.moderation.warns[user.id].length}.`, ephemeral: true });
		}

		case 'list': {
			return getWarnList(interaction, interaction.guild, user, interaction.options.getBoolean('ephemeral', false) ?? false);
		}

		case 'clear': {
			if (!Object.hasOwn(data.moderation.warns, user.id)) {
				return interaction.reply({ content: `${user} has no warns to clear.`, ephemeral: true });
			}

			const amount = data.moderation.warns[user.id].length;
			delete data.moderation.warns[user.id];
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: `Cleared ${amount} warns for ${user}.`, ephemeral: true });
		}
		}
	}
};
export default Warn;
