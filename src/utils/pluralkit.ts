import { Message, PartialMessage } from 'discord.js';

import * as persist from './persist';

const cache = new Map<string, number>();
const TWO_WEEKS_MS = 1000 * 60 * 60 * 24 * 14;

export async function isSystemMessage(message: Message | PartialMessage) {
	try {
		// simple fetch to check if the message was proxied
		return (await fetch(`https://api.pluralkit.me/v2/messages/${message.id}`)).status != 404;
	} catch {
		return false;
	}
}

export async function shouldLog(message: Message | PartialMessage) {
	if (!message.author || !message.guild) {
		return false;
	}

	const data = persist.data(message.guild.id);

	const cacheTimestamp = cache.get(message.author.id);
	if (cacheTimestamp === undefined || cacheTimestamp > Date.now() + TWO_WEEKS_MS) {
		// first, check if is from an already known system
		if (data.compat.pluralkit.accounts.includes(message.author.id)) {
			return false;
		}
		// if not, ask the pk API if the message is from a system we might not be aware of
		if (await isSystemMessage(message)) {
			data.compat.pluralkit.accounts.push(message.author.id);
			persist.saveData(message.guild.id);
			return false;
		} else {
			// add author to the session cache, so we do fewer calls to the API
			cache.set(message.author.id, Date.now());
		}
	}
	return !data.config.log.user_exceptions.includes(message.author.id);
}

export function purgeCacheEntry(userId: string) {
	cache.delete(userId);
}
