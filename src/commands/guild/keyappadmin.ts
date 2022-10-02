import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';
import { isSheetLoaded } from '../../utils/sheet';
import { checkUserKeyStatus, readUserApplication } from '../../utils/sheet-check';

const KeyAppAdmin: Command = {
	permissionLevel: PermissionLevel.TEAM_MEMBER,

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
			return checkUserKeyStatus(interaction, interaction.options.getUser('user', true), false);
		}

		case 'read': {
			return readUserApplication(interaction, interaction.options.getUser('user', true), false);
		}
		}
	}
};
export default KeyAppAdmin;
