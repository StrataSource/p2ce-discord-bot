import { Message } from 'discord.js';

import * as config from '../config.json';

function needsCoopResponse(input: string): boolean {
	// thanks baguettery 💖
	const is_query        = input.match(/(will|can|could)|\?/g);
	const mentions_play	  = input.match(/play|complete|do/g);
	const mentions_coop	  = input.match(/coop|co-op|cooperative|multiplayer/g);
	const mentions_p2ce	  = input.match(/p2ce|p2:ce|community edition/g);
	const mentions_portal = input.match(/p2|portal|community|pc|switch/g);
	const mentions_anyone = input.match(/anyone|someone|any1|some1/g);
	const mentions_devs	  = input.match(/developers|devs/g);

	if (mentions_devs || mentions_p2ce) return false;
	if (mentions_play && mentions_portal && mentions_coop) return true;
	if ((mentions_anyone || is_query) && mentions_coop) return true;
	if (mentions_anyone && mentions_play && (mentions_coop || mentions_portal)) return true;
	return false;
}

export async function messageNeedsResponse(msg: Message<boolean>): Promise<string | undefined> {
	if (msg.author.bot || msg.cleanContent.length <= 0) return undefined;

	const input = msg.cleanContent.toLowerCase();
	if (needsCoopResponse(input)) {
		return config.messages['coop'];
	}

	return undefined;
}
