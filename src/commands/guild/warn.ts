import {CommandInteraction, EmbedBuilder, SlashCommandBuilder} from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';

import * as persist from '../../utils/persist';
import {LogLevelColor} from '../../utils/log';

const Warn: Command = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('warn')
		.setDescription('Commands to manage warnings')
		.addSubcommand(subcommand => subcommand
			.setName('list')
			.setDescription('List all the warnings that has been given to an user.')
			.addUserOption(option => option
				.setName('user')
				.setDescription('The user to get the warn history of')
				.setRequired(true))
			.addBooleanOption(option => option
				.setName('ephemeral')
				.setDescription('If the reply is ephemeral or not, defaults to false.'))
		)
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
		)
		.addSubcommand(subcommand => subcommand
			.setName('clear')
			.setDescription('Clear an user\'s warning record.')
			.addUserOption(option => option
				.setName('user')
				.setDescription('The user to clear')
				.setRequired(true))
		),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const user = await interaction.options.getUser('user', true);
		const id = user.id;
		const warns = persist.data( interaction.guildId ).moderation.warns;

		switch ( interaction.options.getSubcommand() ) {
		case 'list': {
			const embed = new EmbedBuilder()
				.setColor(LogLevelColor.INFO)
				.setAuthor({ name: `${user.username}#${user.discriminator}`, iconURL: user.avatarURL({ size: 1024 }) ?? undefined })
				.setTitle( `User ID: \`${user.id}\`` )
				.setFooter({ text: `Joined at <t:${(user.createdAt.getTime() / 1000).toFixed(0)}:D>` })
				.setTimestamp();

			for ( const warn of warns[id] ) {
				const issuer = await ( await interaction.guild.members.fetch(warn.author) ).user.fetch();
				embed.addFields( {
					name: warn.date,
					value: `**Reason**\n\`${warn.reason}\`\n\n**Issuer**\n\`${issuer.username}#${user.discriminator}\``
				});
			}

			return interaction.reply({
				embeds: [embed],
				ephemeral: interaction.options.getBoolean('ephemeral', false) == true
			});
		}
		case 'add': {
			if ( !( id in warns ) )
				warns[id] = [];
			warns[id].push({
				date: new Date().toUTCString(),
				reason: interaction.options.getString('reason', true),
				author: interaction.user.id
			});

			return interaction.reply({
				content: `Warned user with ID ${id}, this is their ${warns[id].length} warn.`,
				ephemeral: false
			});
		}
		case 'clear': {
			const amount = warns[id];
			delete warns[id];

			return interaction.reply({
				content: `Cleared ${amount} warns for user with ID ${id}.`,
				ephemeral: false
			});
		}
		}
	}
};
export default Warn;
