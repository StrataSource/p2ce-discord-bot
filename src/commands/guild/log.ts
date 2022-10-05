import { ActionRowBuilder, CommandInteraction, SelectMenuBuilder, SelectMenuOptionBuilder, SlashCommandBuilder } from 'discord.js';
import { Callbacks } from '../../types/client';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';

import * as persist from '../../utils/persist';

const Log: Command = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('log')
		.setDescription('Configure logging in this guild.')
		.addSubcommand(subcommand => subcommand
			.setName('options')
			.setDescription('Configure what is logged.')),

	async execute(interaction: CommandInteraction, callbacks: Callbacks) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.inGuild || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		await interaction.deferReply({ ephemeral: true });

		const data = persist.data(interaction.guild.id);

		switch (interaction.options.getSubcommand()) {
		case 'options': {
			const selectMenu = new ActionRowBuilder<SelectMenuBuilder>()
				.addComponents(
					new SelectMenuBuilder()
						.setCustomId('log_options')
						.setPlaceholder('Logging options')
						.addOptions(
							new SelectMenuOptionBuilder()
								.setLabel('User Updates')
								.setDescription('Log when a member\'s username or avatar changes')
								.setDefault(data.config.log.options.user_updates)
								.setValue('user_updates'),
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
						.setMaxValues(5));

			callbacks.addSelectMenuCallback('log_options', async interaction => {
				if (!interaction.inGuild || !interaction.guild) {
					return interaction.reply({ content: 'This only works in a guild!', ephemeral: true });
				}

				for (const logConfig of Object.keys(data.config.log.options)) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(data.config.log.options as any)[logConfig] = interaction.values.includes(logConfig);
				}
				persist.saveData(interaction.guild.id);

				return interaction.reply({ content: 'Configuration has been updated.', ephemeral: true });
			});

			return interaction.editReply({ content: 'Log options:', components: [selectMenu] });
		}
		}
	}
};
export default Log;
