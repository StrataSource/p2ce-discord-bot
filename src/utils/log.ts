import { Client, ColorResolvable, GuildBan, GuildTextBasedChannel, Message, MessageEmbed, PartialMessage, PartialUser, User } from 'discord.js';

import * as config from '../config.json';

export function getLogChannel(client: Client): GuildTextBasedChannel | null {
	const channel = client.guilds.resolve(config.guild)?.channels.resolve(config.channels.log);
	if (!channel || !(channel.isText() || channel.isThread())) return null;
	return channel;
}

export function message(client: Client, title: string, color: ColorResolvable, msg: string, thumb: string | null = null): Promise<Message<boolean>> | undefined {
	const embed = new MessageEmbed()
		.setColor(color)
		.setTitle(title)
		.setDescription(msg)
		.setTimestamp();
	if (thumb) embed.setThumbnail(thumb);
	return getLogChannel(client)?.send({ embeds: [embed] });
}

export function error(client: Client, msg: Error): Promise<Message<boolean>> | undefined {
	console.log(`[ERROR] ${message}`);
	return message(client, 'ERROR', '#ff0000', `${msg.name}: ${msg.message}`);
}

export function warning(client: Client, msg: string): Promise<Message<boolean>> | undefined {
	console.log(`[WARNING] ${message}`);
	return message(client, 'WARNING', '#ffd700', msg);
}

export function userUpdate(client: Client, user1: User | PartialUser, user2: User): Promise<Message<boolean>> | undefined {
	if (user1.username !== user2.username) {
		return message(client, 'USER', '#2f3136', `**${user1.username}#${user1.discriminator}** changed their username to **${user2.username}#${user2.discriminator}**`);
	} else if (user1.avatar !== user2.avatar) {
		return message(client, 'USER', '#2f3136', `**${user1.username}#${user1.discriminator}** changed their avatar`);
	} else {
		return undefined;
	}
}

export function userBanned(client: Client, ban: GuildBan): Promise<Message<boolean>> | undefined {
	return message(client, 'BAN', '#2f3136', `**${ban.user.username}#${ban.user.discriminator}** was banned`, ban.user.avatarURL());
}

export function messageDeleted(client: Client, msg: Message<boolean> | PartialMessage): Promise<Message<boolean>> | undefined {
	if (msg.author?.bot) return undefined;
	if (msg.cleanContent) {
		return message(client, 'MESSAGE', '#2f3136', `A message from **${msg.author?.username}#${msg.author?.discriminator}** was deleted in ${msg.channel.toString()}\n\nContents: \`\`\`${msg.cleanContent}\`\`\``, msg.author?.avatarURL());
	} else {
		return message(client, 'MESSAGE', '#2f3136', `A message from **${msg.author?.username}#${msg.author?.discriminator}** was deleted in ${msg.channel.toString()}\n\nThe message did not contain any text.`, msg.author?.avatarURL());
	}
}

export function messageUpdated(client: Client, oldMessage: Message<boolean> | PartialMessage, newMessage: Message<boolean> | PartialMessage): Promise<Message<boolean>> | undefined {
	if (oldMessage.author?.bot) return;
	if (oldMessage.cleanContent !== newMessage.cleanContent) {
		return message(client, 'MESSAGE', '#2f3136', `A message from **${oldMessage.author?.username}#${oldMessage.author?.discriminator}** was edited in ${oldMessage.channel.toString()}\n\nBefore: \`\`\`${oldMessage.cleanContent}\`\`\`\nAfter: \`\`\`${newMessage.cleanContent}\`\`\``, oldMessage.author?.avatarURL());
	} else {
		return undefined;
	}
}
