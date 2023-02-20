import { PartialUser, User } from 'discord.js';
import { Stream } from 'stream';

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

export async function streamToBuffer(stream: Stream) {
	return new Promise<Buffer>((resolve, reject) => {
		const buf = Array<Uint8Array>();
		stream.on('data', chunk => buf.push(chunk));
		stream.on('end', () => resolve(Buffer.concat(buf)));
		stream.on('error', err => reject(`Error converting stream: ${err}`));
	});
}
