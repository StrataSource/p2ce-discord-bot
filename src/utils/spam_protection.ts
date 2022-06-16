import { Client, Message } from 'discord.js';
import { LogLevelColor, message } from './log';
import { checkMessage } from 'stop-discord-phishing';

export async function containsPhishing(msg: string) {
	return checkMessage(msg, true);
}

export async function checkMessageForPhishing(client: Client, msg: Message<boolean>) {
	if (msg.author.bot || msg.cleanContent.length <= 0) return;
	const isScam = await containsPhishing(msg.cleanContent);
	if (isScam) {
		msg.delete();
		message(client, 'PHISHING', LogLevelColor.IMPORTANT, `Suspected phishing link from **${msg.author.username}#${msg.author.discriminator}** was deleted in ${msg.channel.toString()}\n\nContents: \`\`\`${msg.cleanContent}\`\`\``, msg.author.avatarURL());
	}
}
