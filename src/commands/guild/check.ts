import { SlashCommandBuilder } from '@discordjs/builders';
import { Collection, CommandInteraction } from 'discord.js';
import { Command } from '../../types/command';
import { PermissionLevel } from '../../utils/permissions';
import { isSheetLoaded, sheet } from '../../utils/sheet';
import { GoogleSpreadsheetCell } from 'google-spreadsheet';

import * as config from '../../config.json';

const COLORS = {
	blank:  { red: 0, green: 0,   blue: 0 },
	red:    { red: 1, green: 0,   blue: 0 },
	orange: { red: 1, green: 0.6, blue: 0 },
	yellow: { red: 1, green: 1,   blue: 0 },
	cyan:   { red: 0, green: 1,   blue: 1 },
	green:  { red: 0, green: 1,   blue: 0 },
};

// I don't care if this gets flushed when the bot restarts
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
		if (USER_DB.has(interaction.user.id) && (USER_DB.get(interaction.user.id) ?? 0) > Date.now()) {
			return interaction.followUp(`You have already checked the status of your application today. Please check again <t:${Math.round((USER_DB.get(interaction.user.id) ?? 0) / 1000)}:R>.`);
		} else {
			USER_DB.set(interaction.user.id, Date.now() + (1000 * 60 * 60 * config.options.misc.key_check_hours_to_wait));
		}

		// Refresh cache
		await sheet.loadCells('B2:B' + sheet.rowCount.toString());

		// Get plaintext username + discriminator
		const name = interaction.user.username + '#' + interaction.user.discriminator;

		// Try to find one row where it's approved
		let appFound = false;
		let appDenied = false;
		for (let i = 2; i < sheet.rowCount; i++) {
			let cell: GoogleSpreadsheetCell;
			try {
				cell = sheet.getCellByA1('B' + i);
			} catch (err) {
				// make double sure, saw an error about a cell not being loaded even though they should be...
				await sheet.loadCells('B2:B' + sheet.rowCount.toString());
				cell = sheet.getCellByA1('B' + i);
			}
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
							appDenied = true;
							break;
						case 'yellow':
						case 'cyan':
							return interaction.followUp('Your key application has been approved! The key will be sent to your DMs when they are distributed next.');
						case 'green':
							return interaction.followUp('Your key application has been approved! You either already have a key, or your key will be sent to you in a few days.');
						default:
						case 'blank':
							// If a cell has no background color, it hasn't been reviewed
							appDenied = false;
							break;
						}
					}
				}
				appFound = true;
			}
		}
		if (appDenied) {
			return interaction.followUp('Your key application has been denied.');
		}
		if (appFound) {
			return interaction.followUp('Your application has not been reviewed yet.');
		}
		return interaction.followUp('Your application was not found. If you have already submitted one, let a team member know.\nThe failure to find your application is likely a result of your username or discriminator changing since you submitted the application.');
	}
};
export default Check;
