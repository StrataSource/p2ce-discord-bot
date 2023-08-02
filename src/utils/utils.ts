import { AttachmentBuilder, Channel, Guild, GuildChannel, GuildMember, GuildPremiumTier, PartialGuildMember, PartialUser, User } from 'discord.js';
import { Stream } from 'stream';
import fetch from 'node-fetch';

export type AvatarSize = 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;

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

export async function getUserOrMemberAvatarAttachment(user: User | PartialUser | GuildMember | PartialGuildMember, size: AvatarSize = 1024, name = 'avatar'): Promise<[AttachmentBuilder, string]> {
	const avatar = await fetch(user.displayAvatarURL({ size: size }));
	const buffer = await avatar.buffer();
	return [
		new AttachmentBuilder(buffer)
			.setName(`${name}.webp`),
		`attachment://${name}.webp`,
	];
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
		.replaceAll('|', '\\|')   // spoiler
		.replaceAll('-', '\\-');  // list
}

export async function streamToBuffer(stream: Stream) {
	return new Promise<Buffer>((resolve, reject) => {
		const buf = Array<Uint8Array>();
		stream.on('data', chunk => buf.push(chunk));
		stream.on('end', () => resolve(Buffer.concat(buf)));
		stream.on('error', err => reject(`Error converting stream: ${err}`));
	});
}
