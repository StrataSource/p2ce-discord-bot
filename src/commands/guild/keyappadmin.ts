// noinspection JSUnusedGlobalSymbols

import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';
import { isSheetLoaded } from '../../utils/sheet';
import { checkUserKeyStatus, readUserApplication } from '../shared/keyapp';

import { KEYAPP_USER_DB_CHECK, KEYAPP_USER_DB_READ } from './keyapp';

const KeyAppAdmin: Command = {
	permissionLevel: PermissionLevel.TEAM_MEMBER,
	isP2CEOnly: true,

	data: new SlashCommandBuilder()
		.setName('keyappadmin')
		.setDescription('Various key application utilities for P2CE team members.')
		.addSubcommand(subcommand => subcommand
			.setName('check')
			.setDescription('Check the status of your key application.')
			.addUserOption(option => option
				.setName('user')
				.setDescription('The user to check the application of')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('read')
			.setDescription('Reads your latest key application.')
			.addUserOption(option => option
				.setName('user')
				.setDescription('The user to read the application of')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('reset')
			.setDescription('Reset the cooldown timers for a given user.')
			.addUserOption(option => option
				.setName('user')
				.setDescription('The user to remove the cooldown from')
				.setRequired(true))),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;

		if (!isSheetLoaded()) {
			return interaction.reply({ content: 'Sheet has not finished loading, please try again later.', ephemeral: true });
		}

		// Don't run command if already present in list
		// If not present, add user to list
		switch (interaction.options.getSubcommand()) {
		case 'check': {
			try {
				return checkUserKeyStatus(interaction, interaction.options.getUser('user', true), false);
			} catch (e) {
				if (interaction.deferred) {
					return interaction.editReply('Encountered an error loading spreadsheet, please try again later.');
				}
				return interaction.reply({ 'content': 'Encountered an error loading spreadsheet, please try again later.', ephemeral: true });
			}
		}

		case 'read': {
			try {
				return readUserApplication(interaction, interaction.options.getUser('user', true), false);
			} catch (e) {
				if (interaction.deferred) {
					return interaction.editReply(`Encountered an error loading spreadsheet, please try again later. (Error: \`${e}\`)`);
				}
				return interaction.reply({ 'content': `Encountered an error loading spreadsheet, please try again later. (Error: \`${e}\`)`, ephemeral: true });
			}
		}

		case 'reset': {
			const user = interaction.options.getUser('user', true);

			KEYAPP_USER_DB_CHECK.delete(user.id);
			KEYAPP_USER_DB_READ.delete(user.id);

			return interaction.reply({ 'content': `Cleared keyapp timeout for user ${user}.`, ephemeral: true });
		}
		}
	}
};
export default KeyAppAdmin;
