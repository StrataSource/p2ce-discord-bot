import { CommandInteraction, EmbedBuilder, User } from 'discord.js';
import { KeyStatus } from '../../types/keyapp';
import { sheet } from '../../utils/sheet';
import { LogLevelColor } from '../../utils/log';
import { formatUserRaw } from '../../utils/utils';

import * as persist from '../../utils/persist';

export async function checkUserKeyStatus(interaction: CommandInteraction, user: User, ranOnSelf: boolean) {
	if (!interaction.guild) {
		return;
	}
	const data = persist.data(interaction.guild.id);

	if (!data.keyapps || !Object.hasOwn(data.keyapps, user.id)) {
		return interaction.reply({ content: `This application was not found. If ${ranOnSelf ? 'you' : `${user}`} already submitted one, let a team member know.`, ephemeral: true });
	}

	const [pronoun1, pronoun2] = ranOnSelf ? ['your', 'you'] : [`<@${user.id}>'s`, `<@${user.id}>`];
	switch (data.keyapps[user.id].accept_state) {
	case KeyStatus.SUPER_DENIED:
		return interaction.reply({ content: 'This key application has been denied. Future applications will not be considered.', ephemeral: true });
	case KeyStatus.DENIED:
		return interaction.reply({ content: 'This key application has been denied. New applications will still be considered, but without substantial changes to the application content the result will likely be the same.', ephemeral: true });
	case KeyStatus.ACCEPTED_SUPER_PENDING:
	case KeyStatus.ACCEPTED_PENDING:
		return interaction.reply({ content: `This key application has been approved! The key will be sent to ${pronoun1} DMs when they are distributed next.`, ephemeral: true });
	case KeyStatus.ACCEPTED_CANNOT_FIND: // This one shouldn't exist actually, left in for backwards compat
	case KeyStatus.ACCEPTED_SENT:
		return interaction.reply({ content: `This key application has been approved! Either a key was already sent to ${pronoun2}, or ${pronoun1} key will be sent to ${pronoun2} in a few days.`, ephemeral: true });
	case KeyStatus.ACCEPTED_GAMER:
		return interaction.reply({ content: 'This key application has been placed onto a waitlist for when we require general users for testing.', ephemeral: true });
	default:
	case KeyStatus.UNREVIEWED:
		return interaction.reply({ content: 'This key application has not been reviewed yet.', ephemeral: true });
	}
}

export async function readUserApplication(interaction: CommandInteraction, user: User, ranOnSelf: boolean) {
	if (!interaction.guild) {
		return;
	}
	const data = persist.data(interaction.guild.id);

	if (!data.keyapps || !Object.hasOwn(data.keyapps, user.id)) {
		//return interaction.reply({ content: `This application was not found. If ${ranOnSelf ? 'you' : `${user}`} already submitted one, let a team member know.`, ephemeral: true });
		return readUserApplicationLegacy(interaction, user, ranOnSelf);
	}

	const embed = new EmbedBuilder()
		.setColor(LogLevelColor.INFO)
		.setTitle('LATEST KEY APPLICATION')
		.addFields(
			{ name: 'Rationale For Access', value: `\`\`\`\n${data.keyapps[user.id].rationale}\n\`\`\`` },
			{ name: 'Community Role', value: `\`\`\`\n${data.keyapps[user.id].role}\n\`\`\`` },
			{ name: 'Active Mod', value: `\`\`\`\n${data.keyapps[user.id].mod.length > 0 ? data.keyapps[user.id].mod : 'No response.'}\n\`\`\`` },
			{ name: 'Experience', value: `\`\`\`\n${data.keyapps[user.id].experience}\n\`\`\`` })
		.setTimestamp();
	return interaction.reply({ embeds: [embed], ephemeral: true });
}

async function readUserApplicationLegacy(interaction: CommandInteraction, user: User, ranOnSelf: boolean) {
	// Assumes isSheetLoaded() has been called...
	await interaction.deferReply({ ephemeral: true });

	const reloadRange = `B2:E${sheet.rowCount}`;
	const reloadRangeExperience = `H2:H${sheet.rowCount}`;

	// Refresh cache
	await sheet.loadCells(reloadRange);
	await sheet.loadCells(reloadRangeExperience);

	// Get plaintext username + discriminator
	const name = formatUserRaw(user);

	// Try to find where the app is
	let row = -1;
	for (let i = 2; i < sheet.rowCount; i++) {
		const cell = await getCell(`B${i}`, reloadRange);
		if (name === cell.value) {
			row = i;
		}
	}

	if (row < 0) {
		return interaction.followUp(`This application was not found. If ${ranOnSelf ? 'you' : `${user}`} already submitted one, let a team member know.`);
	}

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
}

async function getCell(a1: string, reloadRange: string) {
	try {
		return sheet.getCellByA1(a1);
	} catch (ignored) {
		// make double sure, saw an error about a cell not being loaded even though they should be...
		await sheet.loadCells(reloadRange);
		return sheet.getCellByA1(a1);
	}
}
