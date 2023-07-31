import { Client, GuildBan, GuildTextBasedChannel, Message, EmbedBuilder, PartialMessage, PartialUser, User, GuildMember, PartialGuildMember } from 'discord.js';
import fs from 'fs';
import { formatUserRaw } from './utils';

import * as config from '../config.json';
import * as persist from '../utils/persist';

export enum LogLevelColor {
	INFO      = '#2f3136',
	IMPORTANT = '#ff3333',
	WARNING   = '#ffd700',
	ERROR     = '#ff0000',
}

function getLogChannel(client: Client, guildID: string): GuildTextBasedChannel | undefined {
	const channel = client.guilds.resolve(guildID)?.channels.resolve(persist.data(guildID).config.log.channel);
	if (!channel || !(channel.isTextBased() || channel.isThread())) {
		return undefined;
	}
	return channel;
}

function getPublicLogChannel(client: Client, guildID: string): GuildTextBasedChannel | undefined {
	const channelID = persist.data(guildID).config.log.public_channel;
	if (!channelID) {
		return undefined;
	}
	const channel = client.guilds.resolve(guildID)?.channels.resolve(channelID);
	if (!channel || !(channel.isTextBased() || channel.isThread())) {
		return undefined;
	}
	return channel;
}

export function getLogFilepath(guildID: string | undefined) {
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
		const logGuildPath = getLogFilepath(guildID);
		if (!fs.existsSync(logGuildPath)) {
			fs.writeFileSync(logGuildPath, '');
		}
		fs.appendFileSync(logGuildPath, message + '\n');
	}

	// Write all messages to the main log too
	const logAllPath = getLogFilepath(undefined);
	if (!fs.existsSync(logAllPath)) {
		fs.writeFileSync(logAllPath, '');
	}
	fs.appendFileSync(logAllPath, `${guildID ? `{${guildID}} ` : ''}${message}\n`);
}

export function message(client: Client, guildID: string, title: string, color: LogLevelColor, msg: string, publicMsg?: string | undefined, thumb?: string | undefined | null) {
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
	if (publicMsg) {
		getPublicLogChannel(client, guildID)?.send(publicMsg);
	}
}

export async function error(client: Client, msg: Error) {
	const channelID = config.log.errors_and_warnings_channel;
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
	const channelID = config.log.errors_and_warnings_channel;
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

export function userBoosted(client: Client, guildID: string, user1: GuildMember | PartialGuildMember, user2: GuildMember) {
	if (user1.premiumSince != user2.premiumSince) {
		message(client, guildID, 'USER', LogLevelColor.INFO, `<@${user2.id}> boosted the server`, `🥳 <@${user2.id}> just boosted the server!`);
	}
}

export function userUpdate(client: Client, guildID: string, user1: User | PartialUser, user2: User) {
	if (user1.username !== user2.username) {
		message(client, guildID, 'USER', LogLevelColor.INFO, `**${formatUserRaw(user1)}** changed their username to **${formatUserRaw(user2)}**`);
	}
}

export function userAvatarUpdate(client: Client, guildID: string, user1: User | PartialUser, user2: User) {
	if (user1.avatar !== user2.avatar) {
		message(client, guildID, 'USER', LogLevelColor.INFO, `<@${user2.id}> changed their avatar`, undefined, user2.avatarURL({size: 1024}));
	}
}

export function userBanned(client: Client, guildID: string, ban: GuildBan) {
	message(client, guildID, 'BAN', LogLevelColor.IMPORTANT, `<@${ban.user.id}> (${formatUserRaw(ban.user)}) was banned 😈`, undefined, ban.user.avatarURL({ size: 1024 }));
}

export function userJoined(client: Client, guildID: string, member: GuildMember | PartialGuildMember) {
	message(client, guildID, 'USER', LogLevelColor.INFO, `<@${member.id}> (${formatUserRaw(member.user)}) joined the server 😊`, undefined, member.avatarURL({ size: 1024 }));
}

export function userLeft(client: Client, guildID: string, member: GuildMember | PartialGuildMember) {
	if (member.id === client.user?.id) return;
	message(client, guildID, 'USER', LogLevelColor.INFO, `<@${member.id}> (${formatUserRaw(member.user)}) left the server 😭`, undefined, member.avatarURL({ size: 1024 }));
}

export function messageDeleted(client: Client, guildID: string, msg: Message | PartialMessage) {
	if (msg.author?.bot || !msg.author?.username) return;

	// Create an empty string, so we don't need to do several other message calls
	let attachString = '';
	if (msg.attachments.size > 0) {
		// Get all attachment urls into an array and join it to the main string
		const attachArray: string[] = [];
		msg.attachments.each(attach => attachArray.push(attach.url));
		attachString = `\n\nAttachments:\n${attachArray.join('\n')}`;
	}

	if (msg.content) {
		message(client, guildID, 'MESSAGE', LogLevelColor.INFO, `A message from <@${msg.author?.id}> was deleted in ${msg.channel.toString()}.\n\nContents:\n${msg.content}${attachString}`, undefined, msg.author?.avatarURL({ size: 1024 }));
	} else {
		message(client, guildID, 'MESSAGE', LogLevelColor.INFO, `A message from <@${msg.author?.id}> was deleted in ${msg.channel.toString()}.\n\nThe message did not contain any text.${attachString}`, undefined, msg.author?.avatarURL({ size: 1024 }));
	}
}

export function messageUpdated(client: Client, guildID: string, oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
	if (oldMessage.author?.bot || !oldMessage.author?.username) return;
	if (oldMessage.content !== newMessage.content) {
		message(client, guildID, 'MESSAGE', LogLevelColor.INFO, `[A message](${newMessage.url}) from <@${newMessage.author?.id}> was edited in ${oldMessage.channel.toString()}.\n\nBefore:\n${oldMessage.content}\n\nAfter:\n${newMessage.content}`, undefined, newMessage.author?.avatarURL({ size: 1024 }));
	}
}
