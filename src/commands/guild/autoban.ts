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
		.addIntegerOption(option => option
			.setName('new_accounts')
			.setDescription('The number of hours a user account needs to exist. 0 means the rule is inactive.')
			.setRequired(true)),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const new_accounts = interaction.options.getInteger('new_accounts', true);

		const data = persist.data(interaction.guild.id);
		data.moderation.autoban = { new_members: new_accounts };
		persist.saveData(interaction.guild.id);

		return interaction.reply({ content: 'Autoban options have been set!', ephemeral: true });
	}
};
export default AutoBan;
