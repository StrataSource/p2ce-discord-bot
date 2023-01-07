import { Message, PartialMessage } from 'discord.js';

import * as persist from './persist';

// TODO: When scheduler is implemented make the cache reset after x time
const cache: string[] = [];

export async function isSystemMessage(message: Message | PartialMessage) {
	try {
		// simple fetch to check if the message was proxied
		return (await (await fetch(`https://api.pluralkit.me/v2/messages/${message.id}`)).text()).includes('Message not found');
	} catch (e) {
		return false;
	}
}

export async function shouldLog(message: Message | PartialMessage) {
	if (!message.author || !message.guild) {
		return false;
	}

	const data = persist.data(message.guild.id);
	// check if the author is in the session cache
	if (!cache.includes(message.author.id)) {
		// first, check if is from an already known system
		if (data.compat.pluralkit.accounts.includes(message.author.id)) {
			return false;
		}
		// if not, ask the pk API if the message is from a system we might not be aware of
		if (await isSystemMessage(message)) {
			data.compat.pluralkit.accounts.push(message.author.id);
			return false;
		} else {
			// add author to the session cache, so we do fewer calls to the API
			cache.push(message.author.id);
		}
	}
	return !data.config.log.user_exceptions.includes(message.author.id);
}

export function purgeCacheEntry(userId: string) {
	const index = cache.findIndex(it => it == userId);
	if (index != -1)
		delete cache[index];
}
