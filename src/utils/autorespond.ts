import { Message } from 'discord.js';

import * as config from '../config.json';

function needsCoopResponse(input: string) {
	// thanks baguettery 💖
	const is_query        = input.match(/(will|can|could)\b|\?/g);
	const mentions_play	  = input.match(/(play|complete|do)\b/g);

	const mentions_coop	  = input.match(/(coop|co-op|co op|cooperative|multiplayer)\b/g);
	const mentions_p2ce	  = input.match(/(p2ce|p2:ce|community edition|portal 2:? ce|(this|the) mod)\b/g);
	const mentions_portal = input.match(/(p2|portal|community|pc|switch)\b/g);
	const mentions_achvmt = input.match(/(get|complete|earn|unlock)\b.*achievements?\b/g);

	const mentions_anyone = input.match(/(anyone|someone|any1|some1|somebody|anybody|partners?)\b/g);
	const mentions_self	  = input.match(/with[\s\t]+me[\s\t]*([?.\n]|$)/g);
	const mentions_devs	  = input.match(/(developers|devs)\b/g);

	if (mentions_devs || mentions_p2ce) return false;
	if (mentions_play && mentions_portal && mentions_coop) return true;
	if (mentions_play && (mentions_portal || mentions_coop) && mentions_self) return true;
	if ((mentions_anyone || is_query) && mentions_coop) return true;
	if (mentions_anyone && mentions_play && (mentions_coop || mentions_portal)) return true;
	if (mentions_anyone && mentions_achvmt && (mentions_coop || mentions_self)) return true;
	return false;
}

// Disabled this response because the server was being really immature about it
/*
function needsSussyResponse(input: string) {
	return input.match(/imposter/g);
}
*/

export function messageNeedsResponse(msg: Message<boolean>): string | undefined {
	if (msg.author.bot || msg.cleanContent.length <= 0) return undefined;

	const input = msg.cleanContent.toLowerCase();
	if (needsCoopResponse(input)) {
		return config.messages['coop'];
	}
	/*
	if (needsSussyResponse(input)) {
		return 'amogus sus';
	}
	*/

	return undefined;
}

export function priviledgedMessageNeedsResponse(msg: Message<boolean>): string | undefined {
	if (msg.author.bot || msg.cleanContent.length <= 0) return undefined;

	//const input = msg.cleanContent.toLowerCase();

	/*
	if (needsSussyResponse(input)) {
		return 'amogus sus';
	}
	*/

	return undefined;
}
