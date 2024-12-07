// noinspection JSUnusedGlobalSymbols

import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';

const DM: Command = {
	permissionLevel: PermissionLevel.TEAM_MEMBER,
	devP2CECommand: true,

	data: new SlashCommandBuilder()
		.setName('dm')
		.setDescription('DMs the given user.')
		.addUserOption(option => option
			.setName('user')
			.setDescription('The user (formatted like <@USER_ID>)')
			.setRequired(true))
		.addStringOption(option => option
			.setName('contents')
			.setDescription('The contents of the message to DM')
			.setRequired(true)),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;

		const user = interaction.options.getUser('user', true);
		const contents = interaction.options.getString('contents', true);

		try {
			await user.send(contents);
		} catch(e) {
			return interaction.reply({ content: `Attempted to send a message to ${user}, but encountered an error! They may not have received the message.`, ephemeral: true });
		}
		return interaction.reply({ content: `Sent ${user} the following message:` + '\n\n' + contents, ephemeral: true });
	}
};
export default DM;
