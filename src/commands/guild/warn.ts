import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';
import { format } from '../../utils/utils';
import { LogLevelColor } from '../../utils/log';

import * as persist from '../../utils/persist';

const Warn: Command = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('warn')
		.setDescription('Commands to manage warnings.')
		.addSubcommand(subcommand => subcommand
			.setName('list')
			.setDescription('List all the warnings that has been given to an user.')
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

		const user = await interaction.options.getUser('user', true);
		const id = user.id;
		const warns = persist.data(interaction.guildId).moderation.warns;

		switch (interaction.options.getSubcommand()) {
		case 'list': {
			const embed = new EmbedBuilder()
				.setColor(LogLevelColor.INFO)
				.setAuthor({ name: format(user), iconURL: user.avatarURL({ size: 1024 }) ?? undefined })
				.setTitle( `User ID: \`${user.id}\`` )
				.setFooter({ text: `Joined at <t:${(user.createdAt.getTime() / 1000).toFixed(0)}:D>` })
				.setTimestamp();

			for (const warn of warns[id]) {
				const issuer = await (await interaction.guild.members.fetch(warn.author)).user.fetch();
				embed.addFields({
					name: warn.date,
					value: `**Reason**\n\`${warn.reason}\`\n\n**Issuer**\n\`${format(issuer)}\``,
				});
			}

			return interaction.reply({
				embeds: [embed],
				ephemeral: interaction.options.getBoolean('ephemeral', false),
			});
		}
		case 'add': {
			if (!(id in warns)) {
				warns[id] = [];
			}

			const date = new Date();
			const reason = interaction.options.getString('reason', true);
			warns[id].push({
				date: date.toUTCString(),
				reason: reason,
				author: interaction.user.id,
			});

			if (interaction.options.getBoolean('dm_offender', false)) {
				const embed = new EmbedBuilder()
					.setColor(LogLevelColor.WARNING)
					.setTitle(`Hi ${user.id}!`)
					.setFields({ name: 'You have been warned for the following reason:', value: `\`${reason}\`` })
					.setFooter({ text: `Issued at <t:${( date.getTime() / 1000).toFixed(0)}:D> by ${format(interaction.user)} in ${interaction.guild.name}` })
					.setTimestamp();

				await user.send({ embeds: [embed] });
			}

			return interaction.reply({
				content: `Warned user with ID ${id}, this is their ${warns[id].length} warn.`,
				ephemeral: true,
			});
		}
		case 'clear': {
			const amount = warns[id];
			delete warns[id];

			return interaction.reply({
				content: `Cleared ${amount} warns for user with ID ${id}.`,
				ephemeral: true,
			});
		}
		}
	}
};
export default Warn;
