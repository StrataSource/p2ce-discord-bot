import { PartialUser, User } from 'discord.js';

// Example usage: "username#discriminator"
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
