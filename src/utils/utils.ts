import { PartialUser, User } from 'discord.js';

// Example usage: `${formatUserRaw(1234567890)} is dum` -> "username#discriminator is dum"
export function formatUserRaw(user: User | PartialUser) {
	return `${user.username}#${user.discriminator}`;
}

// Example usage: `<t:${formatDate(Date.now())}:D>`
export function formatDate(date: Date | number) {
	if (date instanceof Date) {
		date = date.getTime();
	}
	return Math.round(date / 1000).toFixed(0);
}

export function escapeSpecialCharacters(raw: string) {
	return raw
		.replaceAll('\\', '\\\\') // backslash (important to replace first!)
		.replaceAll('*', '\\*')   // italics, bold
		.replaceAll('_', '\\_')   // underline, italics
		.replaceAll('`', '\\`')   // code
		.replaceAll('~', '\\~')   // strikethrough
		.replaceAll('>', '\\>')   // block quote
		.replaceAll('|', '\\|');  // spoiler
}

/**
 * Returns the amount of ms the given string represents.
 * @param time a "days-hours-minutes" formatted string.
 */
export function stringToTime( time: string ) {
	const parts = time.split('-').map( Number.parseInt );
	return 1000 * 60 * parts[0] + // minutes
			1000 * 60 * 60 * parts[1] + // hours
			1000 * 60 * 60 * 24 * parts[2]; // days
}
