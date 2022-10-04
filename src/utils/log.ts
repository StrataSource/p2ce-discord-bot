import { Client, GuildBan, GuildTextBasedChannel, Message, EmbedBuilder, PartialMessage, PartialUser, User, GuildMember, PartialGuildMember } from 'discord.js';
import fs from 'fs';

import * as config from '../config.json';

export enum LogLevelColor {
	INFO      = '#2f3136',
	IMPORTANT = '#ff3333',
	WARNING   = '#ffd700',
	ERROR     = '#ff0000',
}

export function getLogPath(guildID: string | undefined) {
	return `./log/${guildID ? `guild_${guildID}` : 'all'}.txt`;
}

export function writeToLog(guildID: string | undefined, message: string, sendToConsole = true) {
	// Important: need to make sure this dir exists
	if (!fs.existsSync('./log')) {
		fs.mkdirSync('./log');
	}

	// Print it to the console
	if (sendToConsole) {
		console.log(`{${guildID ? guildID : 'ALL'}} ${message}`);
	}

	// Write it to the guild log
	if (guildID) {
		const logGuildPath = getLogPath(guildID);
		if (!fs.existsSync(logGuildPath)) {
			fs.writeFileSync(logGuildPath, '');
		}
		fs.appendFileSync(logGuildPath, message + '\n');
	}

	// Write all messages to the main log too
	const logAllPath = getLogPath(undefined);
	if (!fs.existsSync(logAllPath)) {
		fs.writeFileSync(logAllPath, '');
	}
	fs.appendFileSync(logAllPath, `${guildID ? `{${guildID}} ` : ''}${message}\n`);
}

export function getLogChannel(client: Client, guildID: string): GuildTextBasedChannel | undefined {
	const channel = client.guilds.resolve(guildID)?.channels.resolve(config.channels.log);
	if (!channel || !(channel.isTextBased() || channel.isThread())) {
		return undefined;
	}
	return channel;
}

export function message(client: Client, guildID: string, title: string, color: LogLevelColor, msg: string, thumb: string | null = null) {
	writeToLog(guildID, `[${title}] ${msg}`);

	const embed = new EmbedBuilder()
		.setColor(color)
		.setTitle(title)
		.setDescription(msg)
		.setTimestamp();
	if (thumb) {
		embed.setThumbnail(thumb);
	}
	getLogChannel(client, guildID)?.send({ embeds: [embed] });
}

export async function error(client: Client, msg: Error) {
	const channelID = config.options.log.errors_and_warnings_channel;
	if (channelID.length === 0) return;
	const channel = await client.channels.fetch(channelID);
	const embed = new EmbedBuilder()
		.setColor(LogLevelColor.ERROR)
		.setTitle('ERROR')
		.setDescription(msg.toString())
		.setTimestamp();
	if (channel?.isTextBased()) {
		channel.send({ embeds: [embed] });
	}
}

export async function warning(client: Client, msg: string) {
	const channelID = config.options.log.errors_and_warnings_channel;
	if (channelID.length === 0) return;
	const channel = await client.channels.fetch(channelID);
	const embed = new EmbedBuilder()
		.setColor(LogLevelColor.WARNING)
		.setTitle('WARNING')
		.setDescription(msg)
		.setTimestamp();
	if (channel?.isTextBased()) {
		channel.send({ embeds: [embed] });
	}
}

export function userUpdate(client: Client, guildID: string, user1: User | PartialUser, user2: User) {
	if (user1.username !== user2.username) {
		message(client, guildID, 'USER', LogLevelColor.INFO, `**${user1.username}#${user1.discriminator}** changed their username to **${user2.username}#${user2.discriminator}**`);
	}
	if (user1.avatar !== user2.avatar) {
		message(client, guildID, 'USER', LogLevelColor.INFO, `<@${user1.id}> changed their avatar`, user2.avatarURL({ size: 1024 }));
	}
}

export function userBanned(client: Client, guildID: string, ban: GuildBan) {
	message(client, guildID, 'BAN', LogLevelColor.IMPORTANT, `<@${ban.user.id}> (${ban.user.username}#${ban.user.discriminator}) was banned 😈`, ban.user.avatarURL({ size: 1024 }));
}

export function userJoined(client: Client, guildID: string, member: GuildMember | PartialGuildMember) {
	message(client, guildID, 'USER', LogLevelColor.INFO, `<@${member.id}> (${member.user.username}#${member.user.discriminator}) joined the server 😊`, member.avatarURL({ size: 1024 }));
}

export function userLeft(client: Client, guildID: string, member: GuildMember | PartialGuildMember) {
	message(client, guildID, 'USER', LogLevelColor.INFO, `<@${member.id}> (${member.user.username}#${member.user.discriminator}) left the server 😭`, member.avatarURL({ size: 1024 }));
}

export function messageDeleted(client: Client, guildID: string, msg: Message<boolean> | PartialMessage) {
	if (msg.author?.bot || !msg.author?.username) return;
	if (msg.cleanContent) {
		message(client, guildID, 'MESSAGE', LogLevelColor.INFO, `A message from <@${msg.author?.id}> was deleted in ${msg.channel.toString()}\n\nContents: \`\`\`${msg.cleanContent}\`\`\``, msg.author?.avatarURL({ size: 1024 }));
	} else {
		message(client, guildID, 'MESSAGE', LogLevelColor.INFO, `A message from <@${msg.author?.id}> was deleted in ${msg.channel.toString()}\n\nThe message did not contain any text.`, msg.author?.avatarURL({ size: 1024 }));
	}
}

export function messageUpdated(client: Client, guildID: string, oldMessage: Message<boolean> | PartialMessage, newMessage: Message<boolean> | PartialMessage) {
	if (oldMessage.author?.bot || !oldMessage.author?.username) return;
	if (oldMessage.cleanContent !== newMessage.cleanContent) {
		message(client, guildID, 'MESSAGE', LogLevelColor.INFO, `[A message](${newMessage.url}) from <@${newMessage.author?.id}> was edited in ${oldMessage.channel.toString()}\n\nBefore: \`\`\`${oldMessage.cleanContent}\`\`\`\nAfter: \`\`\`${newMessage.cleanContent}\`\`\``, newMessage.author?.avatarURL({ size: 1024 }));
	}
}
