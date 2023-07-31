import { CommandInteraction, EmbedBuilder, User } from 'discord.js';
import { sheet } from '../../utils/sheet';
import { LogLevelColor } from '../../utils/log';
import { formatUserRaw } from '../../utils/utils';

const COLORS = {
	blank:  { red: 0,   green: 0,   blue: 0 },
	red:    { red: 1,   green: 0,   blue: 0 },
	orange: { red: 1,   green: 0.6, blue: 0 },
	yellow: { red: 1,   green: 1,   blue: 0 },
	cyan:   { red: 0,   green: 1,   blue: 1 },
	green:  { red: 0,   green: 1,   blue: 0 },
	purple: { red: 0.6, green: 0,   blue: 1 },
};

async function getCell(a1: string, reloadRange: string) {
	try {
		return sheet.getCellByA1(a1);
	} catch (ignored) {
		// make double sure, saw an error about a cell not being loaded even though they should be...
		await sheet.loadCells(reloadRange);
		return sheet.getCellByA1(a1);
	}
}

async function displayErrorAndBail(interaction: CommandInteraction, errorCode: number) {
	return interaction.editReply(`Failed to check key status! Please try again. (Error code \`${errorCode}\`)`);
}

function getPrintedPronouns(user: User, ranOnSelf: boolean): [string, string, string] {
	// Liberals smh
	if (ranOnSelf) {
		return ['your', 'Your', 'you'];
	} else {
		return [`<@${user.id}>'s`, `<@${user.id}>'s`, `<@${user.id}>`];
	}
}

export async function checkUserKeyStatus(interaction: CommandInteraction, user: User, ranOnSelf: boolean) {
	// Assumes isSheetLoaded() has been called...
	await interaction.deferReply({ ephemeral: true });

	const reloadRange = `B2:B${sheet.rowCount}`;

	const [pronoun1, pronoun1caps, pronoun2] = getPrintedPronouns(user, ranOnSelf);

	// Refresh cache
	try {
		await sheet.loadCells(reloadRange);
	} catch (ignored) {
		return displayErrorAndBail(interaction, 1);
	}

	// Get plaintext username + discriminator
	const name = formatUserRaw(user);

	// Try to find where the app is
	let row = -1;
	for (let i = 2; i < sheet.rowCount; i++) {
		try {
			const cell = await getCell(`B${i}`, reloadRange);
			if (name === cell.value) {
				row = i;
			}
		} catch (ignored) {
			return displayErrorAndBail(interaction, 2);
		}
	}

	if (row < 0) {
		return interaction.followUp(`${pronoun1caps} application was not found. If ${pronoun2} already submitted one, let a team member know.\nThe failure to find ${pronoun1} application is likely a result of ${pronoun1} username or discriminator changing since the application was submitted.`);
	}

	try {
		const cell = await getCell(`B${row}`, reloadRange);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const bgColor: any = {};
		try {
			Object.assign(bgColor, cell.backgroundColor);
		// eslint-disable-next-line no-empty
		} catch (ignored) {}
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
					return interaction.followUp(`${pronoun1caps} key application has been denied.`);
				case 'yellow':
				case 'cyan':
					return interaction.followUp(`${pronoun1caps} key application has been approved! The key will be sent to ${pronoun1} DMs when they are distributed next.`);
				case 'green':
					return interaction.followUp(`${pronoun1caps} key application has been approved! Either a key was already sent to ${pronoun2}, or ${pronoun1} key will be sent to ${pronoun2} in a few days.`);
				case 'purple':
					return interaction.followUp(`${pronoun1caps} key application has been placed onto a waitlist for when we require general users for testing.`);
				default:
				case 'blank':
					// If a cell has no background color, it hasn't been reviewed
					return interaction.followUp(`${pronoun1caps} key application has not been reviewed yet.`);
				}
			}
		}
	} catch (ignored) {
		return displayErrorAndBail(interaction, 3);
	}
}

export async function readUserApplication(interaction: CommandInteraction, user: User, ranOnSelf: boolean) {
	// Assumes isSheetLoaded() has been called...
	await interaction.deferReply({ ephemeral: true });

	const reloadRange = `B2:E${sheet.rowCount}`;
	const reloadRangeExperience = `H2:H${sheet.rowCount}`;

	const [pronoun1, pronoun1caps, pronoun2] = getPrintedPronouns(user, ranOnSelf);

	// Refresh cache
	try {
		await sheet.loadCells(reloadRange);
		await sheet.loadCells(reloadRangeExperience);
	} catch (ignored) {
		return displayErrorAndBail(interaction, 1);
	}

	// Get plaintext username + discriminator
	const name = formatUserRaw(user);

	// Try to find where the app is
	let row = -1;
	for (let i = 2; i < sheet.rowCount; i++) {
		try {
			const cell = await getCell(`B${i}`, reloadRange);
			if (name === cell.value) {
				row = i;
			}
		} catch (ignored) {
			return displayErrorAndBail(interaction, 2);
		}
	}

	if (row < 0) {
		return interaction.followUp(`${pronoun1caps} application was not found. If ${pronoun2} already submitted one, let a team member know.\nThe failure to find ${pronoun1} application is likely a result of ${pronoun1} username or discriminator changing since the application was submitted.`);
	}

	try {
		const why = (await getCell(`C${row}`, reloadRange)).value?.toString() ?? 'No response.';
		const purpose = (await getCell(`D${row}`, reloadRange)).value?.toString() ?? 'No response.';
		const mod = (await getCell(`E${row}`, reloadRange)).value?.toString() ?? 'No response.';
		const experience = (await getCell(`H${row}`, reloadRangeExperience)).value?.toString() ?? 'No response.';

		const embed = new EmbedBuilder()
			.setColor(LogLevelColor.INFO)
			.setTitle('LATEST KEY APPLICATION')
			.addFields(
				{ name: 'Why do you think you should be granted access?', value: `\`\`\`\n${why}\n\`\`\`` },
				{ name: 'What are your primary purposes for requesting access?', value: `\`\`\`\n${purpose}\n\`\`\`` },
				{ name: 'If you are working on a mod, which one?', value: `\`\`\`\n${mod}\n\`\`\`` },
				{ name: 'State your experience, if you have any.', value: `\`\`\`\n${experience}\n\`\`\`` })
			.setTimestamp();
		return interaction.followUp({ embeds: [embed], ephemeral: true });
	} catch (ignored) {
		return displayErrorAndBail(interaction, 3);
	}
}
