// noinspection JSUnusedGlobalSymbols

import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';
import { formatDate } from '../../utils/utils';

const Mute: Command = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('mute')
		.setDescription('Mutes the selected user.')
		.addUserOption(option => option
			.setName('user')
			.setDescription('The name of the user')
			.setRequired(true))
		.addStringOption(option => option
			.setName('duration_type')
			.setDescription('The unit of time the duration is in')
			.setChoices(
				{ name: 'Minutes', value: 'minutes' },
				{ name: 'Hours', value: 'hours' },
				{ name: 'Days', value: 'days' },
				{ name: 'Weeks', value: 'weeks' },
			)
			.setRequired(true))
		.addNumberOption(option => option
			.setName('duration')
			.setDescription('The time to mute them, in minutes')
			.setRequired(true))
		.addStringOption(option => option
			.setName('reason')
			.setDescription('The reason for the mute')),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const user = interaction.options.getUser('user', true);
		const durationUntranslated = interaction.options.getNumber('duration', true);

		let duration = durationUntranslated;
		const durationType = interaction.options.getString('duration_type', true);
		if (durationType == 'minutes') {
			duration *= 1000 * 60;
		} else if (durationType == 'hours') {
			duration *= 1000 * 60 * 60;
		} else if (durationType == 'days') {
			duration *= 1000 * 60 * 60 * 24;
		} else if (durationType == 'weeks') {
			duration *= 1000 * 60 * 60 * 24 * 7;
		} else {
			return interaction.reply({ content: 'Invalid duration unit!', ephemeral: true });
		}

		// Time them out!
		await interaction.guild?.members.resolve(user.id)?.timeout(duration, interaction.options.getString('reason') ?? '');

		return interaction.reply({ content: `Muted ${user} for ${durationUntranslated} ${durationType}. They will be unmuted at <t:${formatDate(Date.now() + duration)}:D>`, ephemeral: true });
	}
};
export default Mute;
