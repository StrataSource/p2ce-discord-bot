import { SlashCommandBuilder } from '@discordjs/builders';
import { Collection, CommandInteraction } from 'discord.js';
import { Command } from '../../types/command';
import { PermissionLevel } from '../../utils/permissions';
import { checkUserKeyStatus } from '../../utils/sheet-check';

import * as config from '../../config.json';

// I don't care if this gets flushed when the bot restarts
const USER_DB = new Collection<string, number>();

const Check: Command = {
	permissionLevel: PermissionLevel.MEMBER,

	data: new SlashCommandBuilder()
		.setName('check')
		.setDescription('Check the status of your key application.'),

	async execute(interaction: CommandInteraction) {
		// Don't run command if already present in list
		// If not present, add user to list
		if (USER_DB.has(interaction.user.id) && (USER_DB.get(interaction.user.id) ?? 0) > Date.now()) {
			return interaction.reply({ content: `You have already checked the status of your application today. Please check again <t:${((USER_DB.get(interaction.user.id) ?? 0) / 1000).toFixed(0)}:R>.`, ephemeral: true});
		} else {
			USER_DB.set(interaction.user.id, Date.now() + (1000 * 60 * 60 * config.options.misc.key_check_hours_to_wait));
		}

		return checkUserKeyStatus(interaction, interaction.user);
	}
};
export default Check;
