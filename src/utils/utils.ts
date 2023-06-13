import { Channel, Guild, GuildChannel, GuildPremiumTier, PartialUser, User } from 'discord.js';
import { Stream } from 'stream';

export function getUploadLimitForGuild(guild: Guild) {
	switch (guild.premiumTier) {
	case GuildPremiumTier.Tier3:
		return 100;
	case GuildPremiumTier.Tier2:
		return 50;
	default:
		return 8;
	}
}

export function getUploadLimitForChannel(channel: Channel) {
	if ((channel instanceof GuildChannel) && channel.guild) {
		return getUploadLimitForGuild(channel.guild);
	}
	return 8;
}

// Example usage: `${formatUserRaw(1234567890)} is dum` -> "username#discriminator is dum"
export function formatUserRaw(user: User | PartialUser) {
	if (user.discriminator === '0') {
		return `${user.username}`;
	}
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
