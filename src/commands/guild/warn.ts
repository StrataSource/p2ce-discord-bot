import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';

import * as persist from '../../utils/persist';

const Warn: Command = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('warn')
		.setDescription('Warns the user with the given ID.')
		.addStringOption(option => option
			.setName('id')
			.setDescription('The user ID to warn')
			.setRequired(true)),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const id = interaction.options.getString('id', true);
		const warns = persist.data( interaction.guildId ).moderation.warns;

		warns[id] = id in warns ? warns[id] + 1 : 1;

		return interaction.reply({ content: `Warned user with ID ${id}, this is their ${warns[id]} warn.`, ephemeral: false });
	}
};
export default Warn;
