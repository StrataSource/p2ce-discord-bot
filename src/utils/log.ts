import { Client, ColorResolvable, GuildTextBasedChannel, Message, MessageEmbed, PartialUser, User } from 'discord.js';

import * as config from '../config.json';

export function getLogChannel(client: Client): GuildTextBasedChannel | null {
	const channel = client.guilds.resolve(config.guild)?.channels.resolve(config.channels.log);
	if (!channel || !(channel.isText() || channel.isThread())) return null;
	return channel;
}

export function message(client: Client, title: string, color: ColorResolvable, msg: string): Promise<Message<boolean>> | undefined {
	const embed = new MessageEmbed()
		.setColor(color)
		.setTitle(title)
		.setDescription(msg)
		.setTimestamp();
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

export function debug(msg: string): void {
	console.log(`[DEBUG] ${msg}`);
}

/*
export function userUpdate(client: Client, user1: User | PartialUser, user2: User | PartialUser): Promise<Message<boolean>> | undefined {
	if (user1.username !== user2.username) {
		return message(client, 'USER', '#2f3136', `${user1.username} changed their username to ${user2.username}`);
	} else if (user1.discriminator !== user2.discriminator) {
		return message(client, 'USER', '#2f3136', `${user1.username} changed their discriminator to ${user2.discriminator}`);
	} else if (user1.avatar !== user2.avatar) {
		return message(client, 'USER', '#2f3136', `${user1.username} changed their avatar`);
	} else {
		return undefined;
	}
}
*/

// logUserBanned
// logUserUnbanned
// serverMemberUpdated
// messageDeleted
// messageUpdated
// channelDeleted
// channelUpdated
