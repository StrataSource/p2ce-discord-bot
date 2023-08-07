import { Collection, CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';
import { isSheetLoaded } from '../../utils/sheet';
import { checkUserKeyStatus, readUserApplication } from '../shared/keyapp';
import { formatDate } from '../../utils/utils';

import * as config from '../../config.json';

// I don't care if this gets flushed when the bot restarts
export const KEYAPP_USER_DB_CHECK = new Collection<string, number>();
export const KEYAPP_USER_DB_READ = new Collection<string, number>();

const KeyApp: Command = {
	permissionLevel: PermissionLevel.EVERYONE,
	isP2CEOnly: true,

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
			if (KEYAPP_USER_DB_CHECK.has(interaction.user.id) && (KEYAPP_USER_DB_CHECK.get(interaction.user.id) ?? 0) > Date.now()) {
				return interaction.reply({ content: `You have already checked the status of your application recently. Please check again <t:${formatDate(KEYAPP_USER_DB_CHECK.get(interaction.user.id) ?? 0)}:R>.`, ephemeral: true});
			} else {
				KEYAPP_USER_DB_CHECK.set(interaction.user.id, Date.now() + (1000 * 60 * 60 * config.keyapp.hours_to_wait));
			}

			try {
				return checkUserKeyStatus(interaction, interaction.user, true);
			} catch (ignored) {
				KEYAPP_USER_DB_CHECK.delete(interaction.user.id);
				return interaction.followUp({ content: 'There was an error checking your application. Please try again.', ephemeral: true });
			}
		}

		case 'read': {
			if (KEYAPP_USER_DB_READ.has(interaction.user.id) && (KEYAPP_USER_DB_READ.get(interaction.user.id) ?? 0) > Date.now()) {
				return interaction.reply({ content: `You have already read your application recently. Please check again <t:${formatDate(KEYAPP_USER_DB_READ.get(interaction.user.id) ?? 0)}:R>.`, ephemeral: true});
			} else {
				KEYAPP_USER_DB_READ.set(interaction.user.id, Date.now() + (1000 * 60 * 60 * config.keyapp.hours_to_wait));
			}

			try {
				return readUserApplication(interaction, interaction.user, true);
			} catch (ignored) {
				KEYAPP_USER_DB_READ.delete(interaction.user.id);
				return interaction.followUp({ content: 'There was an error reading your application. Please try again.', ephemeral: true });
			}
		}
		}
	}
};
export default KeyApp;
