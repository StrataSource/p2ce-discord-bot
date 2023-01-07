import {Message, PartialMessage} from 'discord.js';
import {PersistentData} from '../types/persist';


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

export async function shouldLog(message: Message | PartialMessage, data: PersistentData): Promise<boolean> {
	if (message.author) {
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
			} else
				// add author to the session cache, so we do fewer calls to the API
				cache.push(message.author.id);
		}
		return !data.config.log.user_exceptions.includes(message.author.id);
	}
	return false;
}

export function purgeCacheEntry(userId: string) {
	if (cache.includes(userId))
		delete cache[cache.findIndex(it => it == userId)];
}

