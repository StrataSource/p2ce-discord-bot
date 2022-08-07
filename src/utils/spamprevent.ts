import { Message } from 'discord.js';

import * as config from '../config.json';

export async function messageIsSpam(msg: Message<boolean>) {
	return msg.mentions.users.size > config.options.spam_max_mentions;
}
