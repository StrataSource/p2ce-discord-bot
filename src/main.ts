// noinspection JSIgnoredPromiseFromCall

import { ActivityType, Client, Collection, GuildMember, IntentsBitField, Partials } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import fs from 'fs';
import { Command, CommandBase, ContextMenu } from './types/interaction';
import { messageNeedsResponse, priviledgedMessageNeedsResponse } from './utils/autorespond';
import * as log from './utils/log';
import { hasPermissionLevel, PermissionLevel } from './utils/permissions';
import * as persist from './utils/persist';
import { messageIsSpam } from './utils/spamprevent';

import * as config from './config.json';

// Make console output better
import consoleStamp from 'console-stamp';
consoleStamp(console);

// Load persistent storage
persist.loadData();

interface P2CEClient extends Client {
	commands?: Collection<string, CommandBase>,
}

async function main() {
	// You need a token, duh
	if (!config.token) {
		log.writeToLog('[ERROR] No token found in config.json!');
		return;
	}

	const date = new Date();
	log.writeToLog(`--- START AT ${date.toDateString()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ---`);

	// Create client
	const client: P2CEClient = new Client({
		intents: new IntentsBitField([
			IntentsBitField.Flags.Guilds,
			IntentsBitField.Flags.GuildEmojisAndStickers,
			IntentsBitField.Flags.GuildInvites,
			IntentsBitField.Flags.GuildBans,
			IntentsBitField.Flags.GuildMembers,
			IntentsBitField.Flags.GuildMessages,
			IntentsBitField.Flags.GuildMessageReactions,
			IntentsBitField.Flags.MessageContent,
		]),
		partials: [
			Partials.Channel,
			Partials.Message,
			Partials.GuildMember,
			Partials.Reaction,
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
	//	const context_menu: ContextMenu = (await import(`./commands/context_menus/message/${file}`)).default;
	//	client.commands.set(context_menu.data.name, context_menu);
	//}
	for (const file of fs.readdirSync('./build/commands/context_menus/user').filter(file => file.endsWith('.js'))) {
		const context_menu: ContextMenu = (await import(`./commands/context_menus/user/${file}`)).default;
		client.commands.set(context_menu.data.name, context_menu);
	}

	// Run this when the client is ready
	client.on('ready', async () => {
		client.user?.setActivity('this server', { type: ActivityType.Watching });
		setTimeout(() => client.user?.setActivity('this server', { type: ActivityType.Watching }), 30e3);
		log.writeToLog(`[INFO] Logged in as ${client.user?.tag}`);
	});

	// Listen for errors
	if (config.options.log.errors) {
		client.on('error', async error => {
			log.error(client, error);
		});
	}

	// Listen for warnings
	if (config.options.log.warnings) {
		client.on('warn', async warn => {
			log.warning(client, warn);
		});
	}

	// Listen for commands
	client.on('interactionCreate', async interaction => {
		if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
			const command = client.commands?.get(interaction.commandName);
			if (!command) return;

			// Check if the user has the required permission level
			// This is a backup to Discord's own permissions stuff in case that breaks
			if (!interaction.channel?.isDMBased() && !hasPermissionLevel(interaction.member as GuildMember, command.permissionLevel)) {
				if (interaction.deferred) {
					await interaction.followUp('You do not have permission to execute this command!');
					return;
				} else {
					await interaction.reply({ content: 'You do not have permission to execute this command!', ephemeral: true });
					return;
				}
			}

			if (interaction.isContextMenuCommand()) {
				log.writeToLog(`Context menu "${interaction.commandName}" run by ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id})`);
			} else {
				log.writeToLog(`Command "${interaction.commandName}" run by ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id})`);
			}

			command.execute(interaction).catch(err => {
				log.writeToLog((err as Error).toString());
				if (interaction.deferred) {
					interaction.followUp(`There was an error while executing this command: ${err}`);
				} else {
					interaction.reply(`There was an error while executing this command: ${err}`);
				}
			});
		}
	});

	// Listen for added reactions
	client.on('messageReactionAdd', async (reaction, user) => {
		if (user.id === config.client_id) return;

		// When a reaction is received, check if the structure is partial
		if (reaction.partial) {
			// If the message this reaction belongs to was removed, the fetching might result in an API error
			try {
				await reaction.fetch();
			} catch (err) {
				log.writeToLog((err as Error).toString());
			}
		}

		// If persistent storage has the reaction message ID, add requested role to the user
		if (Object.hasOwn(persist.data.reaction_roles, reaction.message.id)) {
			persist.data.reaction_roles[reaction.message.id].roles.filter(e => {
				let name = e.emoji_name;
				if (name.startsWith('<:') && name.endsWith('>')) {
					name = name.substring(name.indexOf(':') + 1, name.lastIndexOf(':'));
				}
				return name === reaction.emoji.name;
			}).forEach(roles => {
				reaction.message.guild?.members.cache.get(user.id)?.roles.add(roles.role);
			});
		}
	});

	// Listen for removed reactions
	client.on('messageReactionRemove', async (reaction, user) => {
		if (user.id === config.client_id) return;

		// When a reaction is received, check if the structure is partial
		if (reaction.partial) {
			// If the message this reaction belongs to was removed, the fetching might result in an API error
			try {
				await reaction.fetch();
			} catch (err) {
				log.writeToLog((err as Error).toString());
			}
		}

		// If persistent storage has the reaction message ID, remove requested role from the user
		if (Object.hasOwn(persist.data.reaction_roles, reaction.message.id)) {
			persist.data.reaction_roles[reaction.message.id].roles.filter(e => {
				let name = e.emoji_name;
				if (name.startsWith('<:') && name.endsWith('>')) {
					name = name.substring(name.indexOf(':') + 1, name.lastIndexOf(':'));
				}
				return name === reaction.emoji.name;
			}).forEach(roles => {
				reaction.message.guild?.members.cache.get(user.id)?.roles.remove(roles.role);
			});
		}
	});

	// Listen for thread changes
	client.on('threadUpdate', async (oldThread, newThread) => {
		if (persist.data.watched_threads.includes(newThread.id) && !oldThread.archived && newThread.archived) {
			await newThread.setArchived(false);
		}
	});

	// Listen for thread deletions
	client.on('threadDelete', async thread => {
		// Remove deleted threads from watchlist
		if (persist.data.watched_threads.includes(thread.id)) {
			persist.data.watched_threads = persist.data.watched_threads.filter((e: string) => e !== thread.id);
			persist.saveData();
		}
	});

	// Listen for presence updates
	if (config.options.log.user_updates) {
		client.on('userUpdate', async (oldUser, newUser) => {
			log.userUpdate(client, oldUser, newUser);
		});
	}

	// Listen for banned members
	if (config.options.log.user_bans) {
		client.on('guildBanAdd', async ban => {
			log.userBanned(client, ban);
		});
	}

	// Listen for deleted messages
	if (config.options.log.message_deletes) {
		client.on('messageDelete', async message => {
			// Only responds to beta testers and members
			if (!hasPermissionLevel(message.member, PermissionLevel.TEAM_MEMBER) && message.cleanContent) {
				log.messageDeleted(client, message);
			}
		});
	}

	// Listen for edited messages
	if (config.options.log.message_edits) {
		client.on('messageUpdate', async (oldMessage, newMessage) => {
			// Only responds to beta testers and members
			if (!hasPermissionLevel(newMessage.member, PermissionLevel.TEAM_MEMBER)) {
				log.messageUpdated(client, oldMessage, newMessage);
			}
		});
	}

	// Listen for messages to respond to
	if (config.options.misc.autorespond) {
		client.on('messageCreate', async message => {
			// Only respond to messages in guilds
			if (message.channel.isDMBased()) return;

			// Only responds to members
			if (!hasPermissionLevel(message.member, PermissionLevel.BETA_TESTER)) {
				// Check for spam
				if (config.options.spam.enabled) {
					messageIsSpam(message).then(spam => {
						if (spam && message.deletable) {
							message.delete();
							message.member?.timeout(config.options.spam.timeout_duration_minutes * 1000 * 60, 'Spamming @mentions');
							log.userSpamResponse(client, message);
						}
					});
				}

				// Check for response
				const response = messageNeedsResponse(message);
				if (response) {
					await message.reply(response);
				}
			} else {
				// This bit will respond to ANY USER
				const response = priviledgedMessageNeedsResponse(message);
				if (response) {
					await message.reply(response);
				}
			}
		});
	}

	// Listen for members joining
	client.on('guildMemberAdd', async member => {
		if (config.options.log.user_joins_and_leaves) {
			persist.data.statistics.joins++;
			persist.saveData();

			log.userJoined(client, member);
		}

		// Add the member role to the user so they can use the server
		await member.roles.add(config.roles.member);
	});

	if (config.options.log.user_joins_and_leaves) {
		// Listen for members leaving
		client.on('guildMemberRemove', async member => {
			persist.data.statistics.leaves++;
			persist.saveData();

			log.userLeft(client, member);
		});
	}

	// Log in
	await client.login(config.token);

	process.on('SIGINT', () => {
		const date = new Date();
		log.writeToLog(`--- STOP AT ${date.toDateString()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ---`);
		client.destroy();
		persist.saveData();
		process.exit();
	});
}

async function updateCommands() {
	// You need a token, duh
	if (!config.token) {
		console.log('Error: No token found in config.json!');
		return;
	}

	console.log('Registering commands...');

	const guildCommands = [];
	for (const file of fs.readdirSync('./build/commands/guild').filter(file => file.endsWith('.js'))) {
		guildCommands.push((await import(`./commands/guild/${file}`)).default.data.toJSON());
	}
	const globalCommands = [];
	for (const file of fs.readdirSync('./build/commands/global').filter(file => file.endsWith('.js'))) {
		globalCommands.push((await import(`./commands/global/${file}`)).default.data.toJSON());
	}

	// Context menus are assumed to be guild-based
	//for (const file of fs.readdirSync('./build/commands/context_menus/message').filter(file => file.endsWith('.js'))) {
	//	guildCommands.push((await import(`./commands/context_menus/message/${file}`)).default.data.toJSON());
	//}
	for (const file of fs.readdirSync('./build/commands/context_menus/user').filter(file => file.endsWith('.js'))) {
		guildCommands.push((await import(`./commands/context_menus/user/${file}`)).default.data.toJSON());
	}

	const rest = new REST({ version: '10' }).setToken(config.token);

	// Update commands for every guild
	await rest.put(Routes.applicationGuildCommands(config.client_id, config.guild), { body: guildCommands });
	console.log(`Registered ${guildCommands.length} guild commands for ${config.guild}`);

	// And register global commands
	await rest.put(Routes.applicationCommands(config.client_id), { body: globalCommands });
	console.log(`Registered ${globalCommands.length} application commands`);
}

if (process.argv.includes('--update-commands')) {
	updateCommands();
} else {
	main();
}
