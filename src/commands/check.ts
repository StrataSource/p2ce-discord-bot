import { SlashCommandBuilder } from '@discordjs/builders';
import { Collection, CommandInteraction } from 'discord.js';
import { PermissionLevel } from '../utils/permissions';
import { isSheetLoaded, sheet } from '../utils/sheet';
import { Command } from '../types/command';

import * as config from '../config.json';

const COLORS = {
	red:    { red: 1, green: 0,   blue: 0 },
	orange: { red: 1, green: 0.6, blue: 0 },
	yellow: { red: 1, green: 1,   blue: 0 },
	cyan:   { red: 0, green: 1,   blue: 1 },
	green:  { red: 0, green: 1,   blue: 0 },
};

const USER_DB = new Collection<string, number>();

const Check: Command = {
	permissionLevel: PermissionLevel.MEMBER,

	data: new SlashCommandBuilder()
		.setName('check')
		.setDescription('Check the status of your key application.'),

	async execute(interaction: CommandInteraction) {
		if (!isSheetLoaded()) {
			return interaction.reply({ content: 'Sheet has not finished loading, please wait a few minutes and try again.', ephemeral: true });
		}
		await interaction.deferReply({ ephemeral: true });

		// Don't run command if already present in list
		// If not present, add user to list
		if (USER_DB.has(interaction.user.id) && (USER_DB.get(interaction.user.id) ?? 0) > (Date.now() / 1000)) {
			return interaction.followUp(`You have already checked the status of your application today. Please check again <t:${Math.round((USER_DB.get(interaction.user.id) ?? 0) / 1000)}:R>.`);
		} else {
			USER_DB.set(interaction.user.id, Date.now() + (1000 * 60 * 60 * config.options.key_check_hours_to_wait));
		}

		// Refresh cache
		await sheet.loadCells('B2:B' + sheet.rowCount.toString());

		// Get plaintext username + discriminator
		const name = interaction.user.username + '#' + interaction.user.discriminator;

		// Try to find it
		for (let i = 2; i < sheet.rowCount; i++) {
			const cell = sheet.getCellByA1('B' + i);
			if (name === cell.value) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const bgColor: any = {};
				try {
					Object.assign(bgColor, cell.backgroundColor);
				// eslint-disable-next-line no-empty
				} catch (err) {}
				if (!Object.hasOwn(bgColor, 'red')) bgColor.red = 0;
				if (!Object.hasOwn(bgColor, 'green')) bgColor.green = 0;
				if (!Object.hasOwn(bgColor, 'blue')) bgColor.blue = 0;

				for (const [colorName, color] of Object.entries(COLORS)) {
					if (Math.round(bgColor.red * 100) === Math.round(color.red * 100) &&
						Math.round(bgColor.green * 100) === Math.round(color.green * 100) &&
						Math.round(bgColor.blue * 100) === Math.round(color.blue * 100)) {
						// It's this color, but which one?
						switch (colorName) {
						case 'red':
						case 'orange':
							return interaction.followUp('Your key application has been denied.');
						case 'yellow':
						case 'cyan':
							return interaction.followUp('Your key application has been approved! The key will be sent to your DMs when they are distributed next.');
						case 'green':
							return interaction.followUp('Your key application has been approved! You either already have a key, or your key will be sent to you in a few days.');
						}
					}
				}
				return interaction.followUp('Your application has not been reviewed yet.');
			}
		}
		return interaction.followUp('Your application was not found. If you have already submitted one, let a team member know.');
	}
};
export default Check;
