// noinspection JSUnusedGlobalSymbols

import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';
import { checkUserKeyStatus, readUserApplication } from '../shared/keyapp';

//// TODO warning system
// - have they sent at least one message? if not, tread with caution

const KeyAppAdmin: Command = {
	permissionLevel: PermissionLevel.TEAM_MEMBER,
	isP2CEOnly: true,

	data: new SlashCommandBuilder()
		.setName('keyappadmin')
		.setDescription('Various key application utilities for P2CE team members.')
		.addSubcommand(subcommand => subcommand
			.setName('check')
			.setDescription('Check the status of someone\'s key application.')
			.addUserOption(option => option
				.setName('user')
				.setDescription('The user to check the application of')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('read')
			.setDescription('Reads someone\'s latest key application.')
			.addUserOption(option => option
				.setName('user')
				.setDescription('The user to read the application of')
				.setRequired(true))),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;

		switch (interaction.options.getSubcommand()) {
		case 'check': {
			return checkUserKeyStatus(interaction, interaction.options.getUser('user', true), false);
		}

		case 'read': {
			return readUserApplication(interaction, interaction.options.getUser('user', true), false);
		}
		}
	}
};
export default KeyAppAdmin;
