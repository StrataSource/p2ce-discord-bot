import { Client, GuildBan, GuildTextBasedChannel, Message, EmbedBuilder, PartialMessage, PartialUser, User } from 'discord.js';

import * as config from '../config.json';

export enum LogLevelColor {
	INFO = '#2f3136',
	IMPORTANT = '#ff3333',
	WARNING = '#ffd700',
	ERROR = '#ff0000',
}

export function getLogChannel(client: Client): GuildTextBasedChannel | undefined {
	const channel = client.guilds.resolve(config.guild)?.channels.resolve(config.channels.log);
	if (!channel || !(channel.isTextBased() || channel.isThread())) return undefined;
	return channel;
}

export function message(client: Client, title: string, color: LogLevelColor, msg: string, thumb: string | null = null) {
	const embed = new EmbedBuilder()
		.setColor(color)
		.setTitle(title)
		.setDescription(msg)
		.setTimestamp();
	if (thumb) embed.setThumbnail(thumb);
	getLogChannel(client)?.send({ embeds: [embed] });
}

export function error(client: Client, msg: Error) {
	console.log(`Error: ${message}`);
	message(client, 'ERROR', LogLevelColor.ERROR, `${msg.name}: ${msg.message}`);
}

export function warning(client: Client, msg: string) {
	console.log(`Warning: ${message}`);
	message(client, 'WARNING', LogLevelColor.WARNING, msg);
}

export function userUpdate(client: Client, user1: User | PartialUser, user2: User) {
	if (user1.username !== user2.username) {
		message(client, 'USER', LogLevelColor.INFO, `**${user1.username}#${user1.discriminator}** changed their username to **${user2.username}#${user2.discriminator}**`);
	}
	if (user1.avatar !== user2.avatar) {
		message(client, 'USER', LogLevelColor.INFO, `<@${user1.id}> changed their avatar`, user2.avatarURL());
	}
}

export function userBanned(client: Client, ban: GuildBan) {
	message(client, 'BAN', LogLevelColor.IMPORTANT, `<@${ban.user.id}> was banned`, ban.user.avatarURL());
}

export function userSpamResponse(client: Client, msg: Message<boolean> | PartialMessage){
	message(client, 'SPAM', LogLevelColor.IMPORTANT, `User <@${msg.author?.id}> sent more than ${config.options.spam_max_mentions} mentions and has been timed out for ${config.options.spam_timeout_duration_minutes} minutes.`);
}

export function messageDeleted(client: Client, msg: Message<boolean> | PartialMessage) {
	if (msg.author?.bot || !msg.author?.username) return undefined;
	if (msg.cleanContent) {
		message(client, 'MESSAGE', LogLevelColor.INFO, `A message from <@${msg.author?.id}> was deleted in ${msg.channel.toString()}\n\nContents: \`\`\`${msg.cleanContent}\`\`\``, msg.author?.avatarURL());
	} else {
		message(client, 'MESSAGE', LogLevelColor.INFO, `A message from <@${msg.author?.id}> was deleted in ${msg.channel.toString()}\n\nThe message did not contain any text.`, msg.author?.avatarURL());
	}
}

export function messageUpdated(client: Client, oldMessage: Message<boolean> | PartialMessage, newMessage: Message<boolean> | PartialMessage) {
	if (oldMessage.author?.bot || !oldMessage.author?.username) return;
	if (oldMessage.content !== newMessage.content) {
		message(client, 'MESSAGE', LogLevelColor.INFO, `A message from <@${newMessage.author?.id}> was edited in ${oldMessage.channel.toString()}\n\nBefore: \`\`\`${oldMessage.cleanContent}\`\`\`\nAfter: \`\`\`${newMessage.cleanContent}\`\`\``, newMessage.author?.avatarURL());
	}
}
