// noinspection JSIgnoredPromiseFromCall

import fs from 'fs';
import { ActivityType, Collection, GuildMember, IntentsBitField, MessageReaction, Partials, User } from 'discord.js';
import { Callbacks, MoralityCoreClient } from './types/client';
import { Command, ContextMenu } from './types/interaction';
import { hasPermissionLevel, PermissionLevel } from './utils/permissions';
import { updateCommands, updateCommandsForGuild } from './utils/update_commands';
import { formatUserRaw } from './utils/utils';

import * as config from './config.json';
import * as log from './utils/log';
import * as persist from './utils/persist';
import * as pluralkit from './utils/pluralkit';
//import * as ipc from './utils/ipc';

// Make console output better
import consoleStamp from 'console-stamp';
consoleStamp(console);

async function main() {
	// Important: need to make sure this dir exists for logging!
	if (!fs.existsSync('./log')) {
		fs.mkdirSync('./log');
	}

	// You need a token, duh
	if (!config.token) {
		log.writeToLog(undefined, 'Error: no token found in config.json!', true);
		return;
	}

	const date = new Date();
	log.writeToLog(undefined, `--- BOT START AT ${date.toDateString()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ---`, true);

	// Create client
	const client = new MoralityCoreClient({
		intents: new IntentsBitField([
			IntentsBitField.Flags.Guilds,
			IntentsBitField.Flags.GuildEmojisAndStickers,
			IntentsBitField.Flags.GuildInvites,
			IntentsBitField.Flags.GuildMembers,
			IntentsBitField.Flags.GuildMessages,
			IntentsBitField.Flags.GuildMessageReactions,
			IntentsBitField.Flags.GuildModeration,
			IntentsBitField.Flags.GuildVoiceStates,
			IntentsBitField.Flags.MessageContent,
		]),
		partials: [
			Partials.Channel,
			Partials.Message,
			Partials.Reaction,
			Partials.User,
			Partials.GuildMember,
		]
	});

	// Register commands
	client.commands = new Collection();
	for (const file of fs.readdirSync('./build/commands/global').filter(file => file.endsWith('.js'))) {
		const command: Command = (await import(`./commands/global/${file}`)).default;
		client.commands.set(command.data.name, command);
	}
	for (const file of fs.readdirSync('./build/commands/guild').filter(file => file.endsWith('.js'))) {
		const command: Command = (await import(`./commands/guild/${file}`)).default;
		client.commands.set(command.data.name, command);
	}

	// Register context menus
	//for (const file of fs.readdirSync('./build/commands/context_menus/message').filter(file => file.endsWith('.js'))) {
	//	const contextMenu: ContextMenu = (await import(`./commands/context_menus/message/${file}`)).default;
	//	client.commands.set(contextMenu.data.name, contextMenu);
	//}
	for (const file of fs.readdirSync('./build/commands/context_menus/user').filter(file => file.endsWith('.js'))) {
		const contextMenu: ContextMenu = (await import(`./commands/context_menus/user/${file}`)).default;
		client.commands.set(contextMenu.data.name, contextMenu);
	}

	// Add callback holders
	client.callbacks = new Callbacks();

	// Run this when the client is ready
	client.on('ready', async () => {
		if (!client.user) {
			log.writeToLog(undefined, 'Client user is missing? Very strange, investigate!', true);
			return;
		}

		const statusSetter = () => {
			const guildCount = client.application?.approximateGuildCount ?? client.guilds.cache.size;
			client.user?.setActivity(`${guildCount} servers`, { type: ActivityType.Watching });
		};
		statusSetter();
		setInterval(statusSetter, 120e3);

		log.writeToLog(undefined, `Logged in as ${client.user.tag}`, true);
	});

	// Listen for errors
	client.on('error', async error => {
		await log.error(client, error);
	});

	// Listen for warnings
	client.on('warn', async warn => {
		log.writeToLog(undefined, warn, true);
	});

	// Listen for joined guilds
	client.on('guildCreate', async guild => {
		await updateCommandsForGuild(guild.id);

		log.writeToLog(undefined, `Joined guild ${guild.id}`, true);
	});

	// Listen for left guilds
	client.on('guildDelete', async guild => {
		log.writeToLog(undefined, `Left guild ${guild.id}`, true);
	});

	// Listen for commands
	client.on('interactionCreate', async interaction => {
		if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
			const command = client.commands?.get(interaction.commandName);
			if (!command) return;

			// Check if the user has the required permission level
			// This is a backup to Discord's own permissions stuff in case that breaks
			if (!interaction.channel?.isDMBased() && interaction.guild) {
				if (!persist.data(interaction.guild.id).config.first_time_setup && !command.canBeExecutedWithoutPriorGuildSetup) {
					if (interaction.deferred) {
						await interaction.followUp('Command could not be executed! Please ask a server administrator to run </setup:0>.');
						return;
					} else {
						await interaction.reply('Command could not be executed! Please ask a server administrator to run </setup:0>.');
						return;
					}
				}

				if (!hasPermissionLevel(interaction.member as GuildMember, command.permissionLevel)) {
					if (interaction.deferred) {
						await interaction.followUp('You do not have permission to execute this command!');
						return;
					} else {
						await interaction.reply({ content: 'You do not have permission to execute this command!', ephemeral: true });
						return;
					}
				}
			}

			if (interaction.isContextMenuCommand()) {
				log.writeToLog(interaction.guild?.id, `Context menu "${interaction.commandName}" clicked by ${formatUserRaw(interaction.user)} (${interaction.user.id})`);
			} else {
				log.writeToLog(interaction.guild?.id, `Command "${interaction.commandName}" ran by ${formatUserRaw(interaction.user)} (${interaction.user.id})`);
			}

			try {
				await command.execute(interaction, client.callbacks);
			} catch (err) {
				await log.error(client, err as Error, interaction.guild?.id);
				if (interaction.deferred) {
					await interaction.followUp(`There was an error while executing this command: ${err}`);
				} else {
					await interaction.reply(`There was an error while executing this command: ${err}`);
				}
				return;
			}
		} else if (interaction.isButton() || interaction.isStringSelectMenu()) {
			if (interaction.message.interaction && interaction.user !== interaction.message.interaction.user) {
				await interaction.reply({ content: `You cannot touch someone else's buttons! These buttons are owned by ${interaction.message.interaction.user}`, ephemeral: true });
				return;
			}

			log.writeToLog(interaction.guild?.id, `Action row item with ID "${interaction.customId}" clicked by ${formatUserRaw(interaction.user)} (${interaction.user.id})`);

			try {
				if (interaction.isButton()) {
					await client.callbacks.runButtonCallback(interaction.customId, interaction);
				} else if (interaction.isStringSelectMenu()) {
					await client.callbacks.runSelectMenuCallback(interaction.customId, interaction);
				}
			} catch (err) {
				await log.error(client, err as Error, interaction.guild?.id);
				if (interaction.deferred) {
					await interaction.followUp(`There was an error while pressing this button: ${err}`);
				} else {
					await interaction.reply(`There was an error while pressing this button: ${err}`);
				}
				return;
			}
		} else if (interaction.isModalSubmit()) {
			try {
				await client.callbacks.runModalCallback(interaction.customId, interaction);
			} catch (err) {
				await log.error(client, err as Error, interaction.guild?.id);
				if (interaction.deferred) {
					await interaction.followUp(`There was an error while submitting this modal: ${err}`);
				} else {
					await interaction.reply(`There was an error while submitting this modal: ${err}`);
				}
				return;
			}
		} else if (interaction.isAutocomplete()) {
			const command = client.commands?.get(interaction.commandName);
			if (!command) {
				await interaction.respond([]);
				return;
			}

			let options = (command as Command).getAutocompleteOptions?.(interaction);
			if (!options) {
				await interaction.respond([]);
				return;
			}

			// Only display options that correspond to what has been typed already
			options = options.filter(option => option.name.startsWith(interaction.options.getFocused()));

			// Max number of choices is 25
			if (options.length > 25) {
				await interaction.respond(options.slice(0, 25));
			} else {
				await interaction.respond(options);
			}
		}
	});

	// Helper since this code is basically the same
	const messageReactionUpdate = async (reaction: MessageReaction, user: User, add: boolean) => {
		// If we are reacting, or this is not a guild, bail
		if (user.id === config.client_id || !reaction.message.guild) return;

		// When a reaction is received, check if the structure is partial
		if (reaction.partial) {
			// If the message this reaction belongs to was removed, the fetching might result in an API error
			try {
				await reaction.fetch();
			} catch (err) {
				log.writeToLog(undefined, (err as Error).toString(), true);
			}
		}

		// If persistent storage has the reaction message ID, add requested role to the user
		const data = persist.data(reaction.message.guild.id);
		if (Object.hasOwn(data.reaction_roles, reaction.message.id)) {
			data.reaction_roles[reaction.message.id].roles.filter(e => {
				let name = e.emoji_name;
				if (name.startsWith('<:') && name.endsWith('>')) {
					name = name.substring(name.indexOf(':') + 1, name.lastIndexOf(':'));
				}
				return name === reaction.emoji.name;
			}).forEach(roles => {
				if (add) {
					reaction.message.guild?.members.cache.get(user.id)?.roles.add(roles.role);
				} else {
					reaction.message.guild?.members.cache.get(user.id)?.roles.remove(roles.role);
				}
			});
		}
	};

	// Listen for added reactions
	client.on('messageReactionAdd', async (reaction, user) => {
		await messageReactionUpdate(await reaction.fetch(), await user.fetch(), true);
	});

	// Listen for removed reactions
	client.on('messageReactionRemove', async (reaction, user) => {
		await messageReactionUpdate(await reaction.fetch(), await user.fetch(), false);
	});

	// Listen for thread changes
	client.on('threadUpdate', async (oldThread, newThread) => {
		const data = persist.data(newThread.guild.id);
		if (data.watched_threads.includes(newThread.id) && !oldThread.archived && newThread.archived) {
			await newThread.setArchived(false);
		}
	});

	// Listen for thread deletions
	client.on('threadDelete', async thread => {
		// Remove deleted threads from watchlist
		const data = persist.data(thread.guild.id);
		if (data.watched_threads.includes(thread.id)) {
			data.watched_threads = data.watched_threads.filter((e: string) => e !== thread.id);
			persist.saveData(thread.guild.id);
		}
	});

	// Listen for presence updates
	client.on('userUpdate', async (oldUser, newUser) => {
		for (const guild of (await client.guilds.fetch()).values()) {
			const member = (await (await guild.fetch()).members.fetch()).get(newUser.id);
			if (!member)
				continue;

			const data = persist.data(guild.id);
			if (data.config.log.options.user_updates) {
				await log.userUpdate(client, guild.id, oldUser, newUser);
			}
			if (data.config.log.options.user_avatar_updates) {
				await log.userAvatarUpdate(client, guild.id, oldUser, newUser);
			}
		}
	});

	// Listen for guild member updates
	client.on('guildMemberUpdate', async (oldMember, newMember) => {
		const data = persist.data(newMember.guild.id);

		// Check for stickyroles
		for (const roleID of Object.keys(data.stickyroles)) {
			const hadRole = oldMember.roles.cache.has(roleID);
			const hasRole = newMember.roles.cache.has(roleID);
			if (hadRole && !hasRole) {
				// role was removed
				data.stickyroles[roleID] = data.stickyroles[roleID].filter(memberID => memberID !== newMember.id);
				persist.saveData(newMember.guild.id);
			} else if (!hadRole && hasRole && !data.stickyroles[roleID].includes(newMember.id)) {
				// role was added
				data.stickyroles[roleID].push(newMember.id);
				persist.saveData(newMember.guild.id);
			}
		}

		if (data.config.log.options.user_boosts) {
			await log.userBoosted(client, newMember.guild.id, oldMember, newMember);
		}
	});

	// Listen for banned members
	client.on('guildBanAdd', async ban => {
		if (persist.data(ban.guild.id).config.log.options.user_bans) {
			await log.userBanned(client, ban.guild.id, ban);
		}
	});

	// Listen for created messages
	client.on('messageCreate', async message => {
		// Only responds to members
		if (!message.guild || !message.member)
			return;

		if (message.content.startsWith('pk;a')) {
			// might be a system enabling autoproxy, remove from normal user cache if they were in it
			pluralkit.purgeCacheEntry(message.author.id);
		}

		if (message.inGuild() && persist.data(message.guild.id).moderation.watchlist?.users.includes(message.author.id)) {
			await log.messageSent(client, message.guild.id, message);
		}
	});

	// Listen for edited messages
	client.on('messageUpdate', async (oldMessage, newMessage) => {
		// Only responds to members
		if (!newMessage.guild || !newMessage.member)
			return;

		const data = persist.data(newMessage.guild.id);
		if (!data.config.log.options.message_edits || !(await pluralkit.shouldLog(newMessage)))
			return;

		// Don't log moderator or team member events if disabled
		if (hasPermissionLevel(newMessage.member, PermissionLevel.MODERATOR) && !data.config.log.options.moderator_events)
			return;
		if (data.config.roles.team_member && hasPermissionLevel(newMessage.member, PermissionLevel.TEAM_MEMBER) && !data.config.log.options.team_member_events)
			return;

		await log.messageUpdated(client, newMessage.guild.id, oldMessage, newMessage);
	});

	// Listen for deleted messages
	client.on('messageDelete', async message => {
		// Only responds to members
		if (!message.guild || !message.member)
			return;

		const data = persist.data(message.guild.id);
		if (!data.config.log.options.message_deletes || !(await pluralkit.shouldLog(message)))
			return;

		// Don't log moderator or team member events if disabled
		if (hasPermissionLevel(message.member, PermissionLevel.MODERATOR) && !data.config.log.options.moderator_events)
			return;
		if (data.config.roles.team_member && hasPermissionLevel(message.member, PermissionLevel.TEAM_MEMBER) && !data.config.log.options.team_member_events)
			return;

		await log.messageDeleted(client, message.guild.id, message);
	});

	// Listen for members joining or leaving voice chats
	client.on('voiceStateUpdate', async (oldState, newState) => {
		if (!newState.member) return;
		if (oldState.channel && !newState.channel) {
			await log.voiceChannelUserLeft(client, newState.guild.id, oldState.channel, newState.member);
		} else if (!oldState.channel && newState.channel) {
			await log.voiceChannelUserJoined(client, newState.guild.id, newState.channel, newState.member);
		} else if (oldState.channel && newState.channel) {
			// Moved between two channels
			await log.voiceChannelUserLeft(client, newState.guild.id, oldState.channel, newState.member);
			await log.voiceChannelUserJoined(client, newState.guild.id, newState.channel, newState.member);
		}
	});

	// Listen for members joining
	client.on('guildMemberAdd', async member => {
		const data = persist.data(member.guild.id);
		data.statistics.joins++;
		persist.saveData(member.guild.id);

		// Check for autobans
		if (data.moderation.autoban && data.moderation.autoban.enabled && member.bannable) {
			// New account ban
			if (data.moderation.autoban.new_accounts > 0) {
				const hoursOld = ((Date.now() - member.user.createdTimestamp) / 1000 / 60 / 60);
				if (hoursOld <= data.moderation.autoban.new_accounts) {
					await member.ban({ reason: `Automatically banned: Account is too new! (${hoursOld} <= ${data.moderation.autoban.new_accounts})` });
					return;
				}
			}
		}

		// Add autoroles
		for (const roleID of data.autoroles) {
			await member.roles.add(roleID);
		}

		// Add stickyroles
		for (const [roleID, members] of Object.entries(data.stickyroles)) {
			if (members.includes(member.id)) {
				await member.roles.add(roleID);
			}
		}

		if (data.config.log.options.user_joins_and_leaves) {
			await log.userJoined(client, member.guild.id, member);
		}
	});

	// Listen for members leaving
	client.on('guildMemberRemove', async member => {
		const data = persist.data(member.guild.id);
		data.statistics.leaves++;
		persist.saveData(member.guild.id);

		if (data.config.log.options.user_joins_and_leaves) {
			await log.userLeft(client, member.guild.id, member);
		}
	});

	// Log in
	await client.login(config.token);

	async function shutdown() {
		const date = new Date();
		log.writeToLog(undefined, `--- BOT END AT ${date.toDateString()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ---`, true);
		await client.destroy();
		persist.saveAll();
		process.exit();
	}

	process.on('SIGINT', shutdown);
	//ipc.on('stop', shutdown);

	//await ipc.listen();
}

if (process.argv.includes('--update-commands')) {
	updateCommands();
} else if (process.argv.includes('--stop')) {
	log.writeToLog(undefined, '--stop called but it is unimplemented!', true);
	//ipc.send('stop');
} else {
	main();
}
