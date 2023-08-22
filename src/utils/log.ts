import fs from 'fs';
import { Client, ColorResolvable, EmbedBuilder, GuildBan, GuildMember, Message, PartialGuildMember, PartialMessage, PartialUser, User } from 'discord.js';
import { getUserOrMemberAvatarAttachment, formatUserRaw } from './utils';

import * as config from '../config.json';
import * as persist from '../utils/persist';

export enum LogLevelColor {
	INFO      = '#2f3136',
	IMPORTANT = '#ff3333',
	WARNING   = '#ffd700',
	ERROR     = '#ff0000',
}

enum MessageLocations {
	PRIVATE,
	PUBLIC,
	WATCHLIST,
}

function getChannel(client: Client, guildID: string, channelID: string | undefined | null) {
	if (!channelID) {
		return undefined;
	}
	const channel = client.guilds.resolve(guildID)?.channels.resolve(channelID);
	if (!channel || !(channel.isTextBased() || channel.isThread())) {
		return undefined;
	}
	return channel;
}

function getLogChannel(client: Client, guildID: string) {
	const channelID = persist.data(guildID).config.log.channel;
	return getChannel(client, guildID, channelID);
}

function getPublicLogChannel(client: Client, guildID: string) {
	const channelID = persist.data(guildID).config.log.public_channel;
	return getChannel(client, guildID, channelID);
}

function getWatchListChannel(client: Client, guildID: string) {
	const channelID = persist.data(guildID).moderation.watchlist?.channel;
	return getChannel(client, guildID, channelID);
}

export function getLogFilepath(guildID: string | undefined) {
	return `./log/${guildID ? `guild_${guildID}` : 'all'}.txt`;
}

export function writeToLog(guildID: string | undefined, message: string, sendToConsole = false) {
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

async function message(client: Client, guildID: string, title: string, color: LogLevelColor | ColorResolvable, msg: string, thumbnail?: User | PartialUser | GuildMember | PartialGuildMember | undefined | null, msgLocations?: MessageLocations[]) {
	writeToLog(guildID, `[${title}] ${msg}`);

	let msgLocationPrivate = true;
	let msgLocationPublic = false;
	let msgLocationWatchList = true;
	if (msgLocations !== undefined) {
		msgLocationPrivate = msgLocations.includes(MessageLocations.PRIVATE);
		msgLocationPublic = msgLocations.includes(MessageLocations.PUBLIC);
		msgLocationWatchList = msgLocations.includes(MessageLocations.WATCHLIST);
	}
	if (!msgLocationPrivate && !msgLocationPublic && !msgLocationWatchList) {
		return;
	}

	const embed = new EmbedBuilder()
		.setColor(color)
		.setTitle(title)
		.setDescription(msg)
		.setTimestamp();

	if (thumbnail) {
		const [attachment, path] = await getUserOrMemberAvatarAttachment(thumbnail);
		embed.setThumbnail(path);

		if (msgLocationPrivate) {
			await getLogChannel(client, guildID)?.send({embeds: [embed], files: [attachment]});
		}

		// HACK HACK HACK: use the thumbnail user ID to check if they are on the watchlist
		if (msgLocationWatchList && persist.data(guildID).moderation.watchlist?.users.includes(thumbnail.id)) {
			await getWatchListChannel(client, guildID)?.send({ embeds: [embed], files: [attachment] });
		}
	} else {
		if (msgLocationPrivate) {
			await getLogChannel(client, guildID)?.send({embeds: [embed]});
		}
	}

	if (msgLocationPublic) {
		await getPublicLogChannel(client, guildID)?.send(msg);
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
		await channel.send({ embeds: [embed] });
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
		await channel.send({ embeds: [embed] });
	}
}

export async function userBoosted(client: Client, guildID: string, user1: GuildMember | PartialGuildMember, user2: GuildMember) {
	if (user1.premiumSince != user2.premiumSince) {
		await message(client, guildID, 'USER', 'Green', `🥳 ${user2} just boosted the server!`, user2);
	}
}

export async function userUpdate(client: Client, guildID: string, user1: User | PartialUser, user2: User) {
	if (user1.username !== user2.username && user1.username !== null) {
		await message(client, guildID, 'USER', 'DarkGreen', `**${formatUserRaw(user1)}** changed their username to **${formatUserRaw(user2)}**`, user2);
	}
}

export async function userAvatarUpdate(client: Client, guildID: string, user1: User | PartialUser, user2: User) {
	if (user1.avatar !== user2.avatar && user1.username !== null) {
		await message(client, guildID, 'USER', 'DarkGreen', `<@${user2.id}> changed their avatar`, user2);
	}
}

export async function userBanned(client: Client, guildID: string, ban: GuildBan) {
	await message(client, guildID, 'BAN', LogLevelColor.IMPORTANT, `<@${ban.user.id}> (${formatUserRaw(ban.user)}) was banned 😈`, ban.user);
}

export async function userJoined(client: Client, guildID: string, member: GuildMember | PartialGuildMember) {
	await message(client, guildID, 'USER', 'Blue', `<@${member.id}> (${formatUserRaw(member.user)}) joined the server 😊`, member);
}

export async function userLeft(client: Client, guildID: string, member: GuildMember | PartialGuildMember) {
	if (member.id === client.user?.id) return;
	await message(client, guildID, 'USER', 'DarkBlue', `<@${member.id}> (${formatUserRaw(member.user)}) left the server 😭`, member);
}

function getMessageAttachmentsString(msg: Message | PartialMessage, attachPrefix?: string | undefined) {
	// Create an empty string, so we don't need to do several other message calls
	let attachString = '';
	if (msg.attachments.size > 0) {
		// Get all attachment urls into an array and join it to the main string
		const attachArray: string[] = [];
		msg.attachments.each(attach => attachArray.push(attach.url));
		attachString = `\n\n${attachPrefix ? attachPrefix : ''}Attachments:\n${attachArray.join('\n')}`;
	}
	return attachString;
}

export async function messageSent(client: Client, guildID: string, msg: Message | PartialMessage) {
	if (msg.author?.bot || !msg.author?.username) return;
	const attachString = getMessageAttachmentsString(msg);
	await message(client, guildID, 'MESSAGE', '#deab82', `[A new message](${msg.url}) from <@${msg.author?.id}> was created in ${msg.channel}.\n\nContents:\n${msg.content}${attachString}`, msg.author, [MessageLocations.WATCHLIST]);
}

export async function messageUpdated(client: Client, guildID: string, oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
	if (oldMessage.author?.bot || !oldMessage.author?.username) return;
	if (oldMessage.content !== newMessage.content) {
		const attachStringOld = getMessageAttachmentsString(oldMessage, 'Before ');
		const attachStringNew = getMessageAttachmentsString(newMessage, 'After ');
		await message(client, guildID, 'MESSAGE', 'Orange', `[A message](${newMessage.url}) from <@${newMessage.author?.id}> was edited in ${oldMessage.channel}.\n\nBefore:\n${oldMessage.content}${attachStringOld}\n\nAfter:\n${newMessage.content}${attachStringNew}`, newMessage.author);
	}
}

export async function messageDeleted(client: Client, guildID: string, msg: Message | PartialMessage) {
	if (msg.author?.bot || !msg.author?.username) return;

	const attachString = getMessageAttachmentsString(msg);
	const contentString = msg.content ? `Contents:\n${msg.content}` : 'The message did not contain any text.';
	const msgString = `A message from <@${msg.author?.id}> was deleted in ${msg.channel.toString()}.\n\n${contentString}${attachString}`;

	await message(client, guildID, 'MESSAGE', 'DarkOrange', msgString, msg.author);
}
