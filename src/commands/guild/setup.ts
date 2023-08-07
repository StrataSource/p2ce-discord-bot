import { ChannelType, CommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';
import { updateCommandsForGuild } from '../../utils/update_commands';

import * as persist from '../../utils/persist';

const Setup: Command = {
	// Permissions are manually checked, this role hasn't been configured!
	permissionLevel: PermissionLevel.EVERYONE,
	canBeExecutedWithoutPriorGuildSetup: true,

	data: new SlashCommandBuilder()
		.setName('setup')
		.setDescription('Set necessary configuration options for this guild.')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addRoleOption(option => option
			.setName('moderator_role')
			.setDescription('The role that moderators have.')
			.setRequired(true))
		.addChannelOption(option => option
			.setName('log_channel')
			.setDescription('The channel where all logs are sent')
			.addChannelTypes(ChannelType.GuildText)
			.setRequired(true))
		.addChannelOption(option => option
			.setName('public_log_channel')
			.setDescription('The channel where public logs are sent (Just boosts for now)')
			.addChannelTypes(ChannelType.GuildText))
		.addRoleOption(option => option
			.setName('team_member_role')
			.setDescription('The role that team members have. They can run a few more commands than regular guild members.')),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		// Caller needs to have Administrator permission, since this sets up the bot for the guild we don't know who is a moderator otherwise
		if (!(await interaction.guild.members.fetch()).get(interaction.user.id)?.permissions.has(PermissionFlagsBits.Administrator)) {
			return interaction.reply({ content: 'You must have the `Administrator` permission to run this command.', ephemeral: true });
		}

		const data = persist.data(interaction.guild.id);

		const firstRun = !data.config.first_time_setup;

		data.config.roles.moderator = interaction.options.getRole('moderator_role', true).id;
		data.config.log.channel = interaction.options.getChannel('log_channel', true).id;
		data.config.log.public_channel = interaction.options.getChannel('public_log_channel')?.id;
		data.config.roles.team_member = interaction.options.getRole('team_member_role')?.id;
		data.config.first_time_setup = true;
		persist.saveData(interaction.guild.id);

		await interaction.deferReply({ ephemeral: true });
		await updateCommandsForGuild(interaction.guild.id);

		if (firstRun) {
			return interaction.editReply('Your guild is set up! All commands are now available.');
		}
		return interaction.editReply('Configuration has been updated!');
	}
};
export default Setup;
