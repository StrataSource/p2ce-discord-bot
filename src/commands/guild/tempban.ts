import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';
import * as scheduler from '../../utils/scheduler';
import {formatDate, formatUserRaw} from "../../utils/utils";
import {unbanHandler} from "../shared/tempban";

const TempBan: Command = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('tempban')
		.setDescription('Bans the given user for X time.')
		.addUserOption(option => option
			.setName('user')
			.setDescription('The user to ban')
			.setRequired(true))
		.addIntegerOption(option => option
			.setName('m')
			.setDescription('Amount of minutes before unban')
			.setRequired(false))
		.addIntegerOption(option => option
			.setName('h')
			.setDescription('Amount of hours before unban')
			.setRequired(false))
		.addIntegerOption(option => option
			.setName('d')
			.setDescription('Amount of days before unban')
			.setRequired(false))
		.addIntegerOption(option => option
			.setName('w')
			.setDescription('Amount of weeks before unban')
			.setRequired(false))
		.addIntegerOption(option => option
			.setName('M')
			.setDescription('Amount of months before unban')
			.setRequired(false))
		.addIntegerOption(option => option
			.setName('y')
			.setDescription('Amount of years before unban')
			.setRequired(false)),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand())
			return;

		if (!interaction.inGuild() || !interaction.guild)
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });

		const user = interaction.options.getUser('user', true);
		const minutes = interaction.options.getInteger( 'm', false ) || 0;
		const hours = interaction.options.getInteger( 'h', false ) || 0;
		const days = interaction.options.getInteger( 'd', false ) || 0;
		const weeks = interaction.options.getInteger( 'w', false ) || 0;
		const months = interaction.options.getInteger( 'M', false ) || 0;
		const years = interaction.options.getInteger( 'y', false ) || 0;

		if ( minutes + hours + days + weeks + months + years == 0 )
			return interaction.reply({ content: 'This command requires at least one non-zero parameter.', ephemeral: true });

		const task = scheduler.schedule( interaction.guild.id, { delay: 0 }, unbanHandler );

		await interaction.guild.bans.create(user);

		return interaction.reply({ content: `Banned ${formatUserRaw(user)} until ${formatDate(task.date)}`, ephemeral: true });
	}
};
export default TempBan;
