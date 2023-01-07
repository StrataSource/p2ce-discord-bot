import {Collection, Message, PartialMessage} from 'discord.js';
import * as persist from './persist';
import {stringToTime} from './utils';


// TODO: When scheduler is implemented make the cache reset after x time
const cache: Collection<string, number> = new Collection();

export async function isSystemMessage(message: Message | PartialMessage) {
	try {
		// simple fetch to check if the message was proxied
		return (await (await fetch(`https://api.pluralkit.me/v2/messages/${message.id}`)).text()).includes('Message not found');
	} catch (e) {
		return false;
	}
}

export async function shouldLog(message: Message | PartialMessage): Promise<boolean> {
	if (message.author && message.guild) {
		const data = persist.data(message.guild.id);

		// remove expired cache entries
		if ( cache.has(message.author.id) && (cache.get(message.author.id) ?? 0) > Date.now()) {
			cache.delete(message.author.id);
		}

		// check if the author is in the session cache
		if (!cache.has(message.author.id)) {
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
				cache.set(message.author.id, Date.now() + stringToTime(data.compat.pluralkit.cache_timeout));
			}
		}
		return !data.config.log.user_exceptions.includes(message.author.id);
	}
	return false;
}

export function purgeCacheEntry(userId: string) {
	cache.delete(userId);
}
