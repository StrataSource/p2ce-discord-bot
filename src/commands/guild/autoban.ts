// noinspection JSUnusedGlobalSymbols

import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';
import * as persist from '../../utils/persist';

const AutoBan: Command = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('autoban')
		.setDescription('Automatically bans new members based on given criteria.')
		.addSubcommand(subcommand => subcommand
			.setName('enable')
			.setDescription('Enables autoban functionality.'))
		.addSubcommand(subcommand => subcommand
			.setName('disable')
			.setDescription('Disables autoban functionality.'))
		.addSubcommand(subcommand => subcommand
			.setName('new_accounts')
			.setDescription('Get/set the number of hours a user account needs to exist. 0 means the rule is inactive.')
			.addIntegerOption(option => option
				.setName('set')
				.setDescription('The number of hours a user account needs to exist. 0 means the rule is inactive.'))),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const data = persist.data(interaction.guild.id);
		if (!data.moderation.autoban) {
			data.moderation.autoban = {
				enabled: false,
				new_accounts: 0,
			};
			persist.saveData(interaction.guild.id);
		}

		switch (interaction.options.getSubcommand()) {
		case 'enable': {
			data.moderation.autoban.enabled = true;
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: 'Autoban system has been enabled!', ephemeral: true });
		}

		case 'disable': {
			data.moderation.autoban.enabled = false;
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: 'Autoban system has been disabled.', ephemeral: true });
		}

		case 'new_accounts': {
			const newAccounts = interaction.options.getInteger('set');
			if (newAccounts !== null) {
				data.moderation.autoban.new_accounts = newAccounts;
				persist.saveData(interaction.guild.id);
			}
			return interaction.reply({ content: `Autoban option \`new_accounts\` is set to: \`${data.moderation.autoban.new_accounts}\``, ephemeral: true });
		}
		}
	}
};
export default AutoBan;
