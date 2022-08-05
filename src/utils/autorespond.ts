import { Message } from 'discord.js';

import * as config from '../config.json';

export async function messageNeedsResponse(msg: Message<boolean>): Promise<string | undefined> {
	if (msg.author.bot || msg.cleanContent.length <= 0) return undefined;

	for (const message of config.messages) {
		if (message.keywords !== undefined && message.keywords_needed !== undefined && message.keywords_needed > 0) {
			let keywordsFound = 0;
			for (const keywordCombo of message.keywords) {
				keywordLoop:
				for (const keyword of keywordCombo) {
					if (msg.content.includes(keyword)) {
						keywordsFound++;
						break keywordLoop;
					}
				}
			}
			if (keywordsFound >= message.keywords_needed) {
				return message.content;
			}
		}
	}
	return undefined;
}
