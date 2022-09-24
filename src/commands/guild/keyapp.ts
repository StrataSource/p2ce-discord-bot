import { Collection, CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/command';
import { PermissionLevel } from '../../utils/permissions';
import { isSheetLoaded } from '../../utils/sheet';
import { checkUserKeyStatus, readUserApplication } from '../../utils/sheet-check';

import * as config from '../../config.json';

// I don't care if this gets flushed when the bot restarts
const USER_DB_CHECK = new Collection<string, number>();
const USER_DB_READ = new Collection<string, number>();

const KeyApp: Command = {
	permissionLevel: PermissionLevel.MEMBER,

	data: new SlashCommandBuilder()
		.setName('keyapp')
		.setDescription('Various key application utilities.')
		.addSubcommand(subcommand => subcommand
			.setName('check')
			.setDescription('Check the status of your key application.'))
		.addSubcommand(subcommand => subcommand
			.setName('read')
			.setDescription('Reads your latest key application.')),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;

		if (!isSheetLoaded()) {
			return interaction.reply({ content: 'Sheet has not finished loading, please try again later.', ephemeral: true });
		}

		// Don't run command if already present in list
		// If not present, add user to list
		switch (interaction.options.getSubcommand()) {
		case 'check': {
			if (USER_DB_CHECK.has(interaction.user.id) && (USER_DB_CHECK.get(interaction.user.id) ?? 0) > Date.now()) {
				return interaction.reply({ content: `You have already checked the status of your application recently. Please check again <t:${((USER_DB_CHECK.get(interaction.user.id) ?? 0) / 1000).toFixed(0)}:R>.`, ephemeral: true});
			} else {
				USER_DB_CHECK.set(interaction.user.id, Date.now() + (1000 * 60 * 60 * config.options.misc.key_check_hours_to_wait));
			}

			return checkUserKeyStatus(interaction, interaction.user);
		}

		case 'read': {
			if (USER_DB_READ.has(interaction.user.id) && (USER_DB_READ.get(interaction.user.id) ?? 0) > Date.now()) {
				return interaction.reply({ content: `You have already read your application recently. Please check again <t:${((USER_DB_READ.get(interaction.user.id) ?? 0) / 1000).toFixed(0)}:R>.`, ephemeral: true});
			} else {
				USER_DB_READ.set(interaction.user.id, Date.now() + (1000 * 60 * 60 * config.options.misc.key_check_hours_to_wait));
			}

			return readUserApplication(interaction, interaction.user);
		}
		}
	}
};
export default KeyApp;
