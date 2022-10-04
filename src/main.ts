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

interface P2CEClient extends Client {
	commands?: Collection<string, CommandBase>,
}

async function main() {
	// You need a token, duh
	if (!config.token) {
		log.writeToLog(undefined, 'Error: no token found in config.json!');
		return;
	}

	const date = new Date();
	log.writeToLog(undefined, `--- START AT ${date.toDateString()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ---`);

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
		log.writeToLog(undefined, `Logged in as ${client.user?.tag}`);
	});

	// Listen for errors
	if (config.options.log.errors) {
		client.on('error', async error => {
			//todo log.error(client, error);
		});
	}

	// Listen for warnings
	if (config.options.log.warnings) {
		client.on('warn', async warn => {
			//todo log.warning(client, warn);
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
				log.writeToLog(interaction.guild?.id, `Context menu "${interaction.commandName}" clicked by ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id})`);
			} else {
				log.writeToLog(interaction.guild?.id, `Command "${interaction.commandName}" ran by ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id})`);
			}

			try {
				await command.execute(interaction);
			} catch (err) {
				log.writeToLog(undefined, (err as Error).toString());
				if (interaction.deferred) {
					await interaction.followUp(`There was an error while executing this command: ${err}`);
				} else {
					await interaction.reply(`There was an error while executing this command: ${err}`);
				}
				return;
			}
		} else if (interaction.isButton()) {
			if (interaction.user !== interaction.message.interaction?.user) {
				await interaction.reply({ content: `You cannot touch someone else's buttons! These buttons are owned by ${interaction.message.interaction?.user}`, ephemeral: true });
				return;
			}

			// Cut the command name off at the first space, since that is the top-level name
			const commandNameFull = interaction.message.interaction.commandName;
			const spaceIndex = commandNameFull.indexOf(' ');
			const commandName = commandNameFull.substring(0, spaceIndex < 0 ? commandNameFull.length : spaceIndex);
			const command = client.commands?.get(commandName);
			if (!command) return;

			log.writeToLog(interaction.guild?.id, `Button with ID "${interaction.customId}" clicked by ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id})`);

			try {
				command.onButtonPressed?.(interaction);
			} catch (err) {
				log.writeToLog(undefined, (err as Error).toString());
				if (interaction.deferred) {
					await interaction.followUp(`There was an error while pressing this button: ${err}`);
				} else {
					await interaction.reply(`There was an error while pressing this button: ${err}`);
				}
				return;
			}
		}
	});

	// Listen for added reactions
	client.on('messageReactionAdd', async (reaction, user) => {
		// If we are reacting, or this is not a guild, bail
		if (user.id === config.client_id || !reaction.message.guild) return;

		// When a reaction is received, check if the structure is partial
		if (reaction.partial) {
			// If the message this reaction belongs to was removed, the fetching might result in an API error
			try {
				await reaction.fetch();
			} catch (err) {
				log.writeToLog(undefined, (err as Error).toString());
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
				reaction.message.guild?.members.cache.get(user.id)?.roles.add(roles.role);
			});
		}
	});

	// Listen for removed reactions
	client.on('messageReactionRemove', async (reaction, user) => {
		// If we are reacting, or this is not a guild, bail
		if (user.id === config.client_id || !reaction.message.guild) return;

		// When a reaction is received, check if the structure is partial
		if (reaction.partial) {
			// If the message this reaction belongs to was removed, the fetching might result in an API error
			try {
				await reaction.fetch();
			} catch (err) {
				log.writeToLog(undefined, (err as Error).toString());
			}
		}

		// If persistent storage has the reaction message ID, remove requested role from the user
		const data = persist.data(reaction.message.guild.id);
		if (Object.hasOwn(data.reaction_roles, reaction.message.id)) {
			data.reaction_roles[reaction.message.id].roles.filter(e => {
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
	if (config.options.log.user_updates) {
		client.on('userUpdate', async (oldUser, newUser) => {
			//todo log.userUpdate(client, oldUser, newUser);
		});
	}

	// Listen for banned members
	if (config.options.log.user_bans) {
		client.on('guildBanAdd', async ban => {
			log.userBanned(client, ban.guild.id, ban);
		});
	}

	// Listen for deleted messages
	if (config.options.log.message_deletes) {
		client.on('messageDelete', async message => {
			// Only responds to trusted users and members
			if (!hasPermissionLevel(message.member, PermissionLevel.TEAM_MEMBER) && message.cleanContent && message.guild) {
				log.messageDeleted(client, message.guild.id, message);
			}
		});
	}

	// Listen for edited messages
	if (config.options.log.message_edits) {
		client.on('messageUpdate', async (oldMessage, newMessage) => {
			// Only responds to trusted users and members
			if (!hasPermissionLevel(newMessage.member, PermissionLevel.TEAM_MEMBER) && newMessage.guild) {
				log.messageUpdated(client, newMessage.guild.id, oldMessage, newMessage);
			}
		});
	}

	// Listen for messages to respond to
	if (config.options.misc.autorespond) {
		client.on('messageCreate', async message => {
			// Only respond to messages in guilds
			if (message.channel.isDMBased() || !message.guild) return;

			// Only responds to members
			if (!hasPermissionLevel(message.member, PermissionLevel.TRUSTED)) {
				// Check for spam
				if (config.options.spam.enabled) {
					const spam = await messageIsSpam(message);
					if (spam && message.deletable) {
						message.delete();
						message.member?.timeout(config.options.spam.timeout_duration_minutes * 1000 * 60, 'Spamming @mentions');
						log.userSpamResponse(client, message.guild.id, message);
					}
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
		const data = persist.data(member.guild.id);
		if (config.options.log.user_joins_and_leaves) {
			data.statistics.joins++;
			persist.saveData(member.guild.id);

			log.userJoined(client, member.guild.id, member);
		}

		// Add the member role to the user so they can use the server
		await member.roles.add(config.roles.member);
	});

	// Listen for members leaving
	client.on('guildMemberRemove', async member => {
		const data = persist.data(member.guild.id);
		if (config.options.log.user_joins_and_leaves) {
			data.statistics.leaves++;
			persist.saveData(member.guild.id);

			log.userLeft(client, member.guild.id, member);
		}
	});

	// Log in
	await client.login(config.token);

	process.on('SIGINT', () => {
		const date = new Date();
		log.writeToLog(undefined, `--- STOP AT ${date.toDateString()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ---`);
		client.destroy();
		persist.saveAll();
		process.exit();
	});
}

async function updateCommands() {
	// You need a token, duh
	if (!config.token) {
		console.log('Error: no token found in config.json!');
		return;
	}

	console.log('Logging on...');

	const client = new Client({
		intents: [
			IntentsBitField.Flags.Guilds
		]
	});
	await client.login(config.token);

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
	for (const guild of (await client.guilds.fetch()).values()) {
		await rest.put(Routes.applicationGuildCommands(config.client_id, guild.id), { body: guildCommands });
		console.log(`Registered ${guildCommands.length} guild commands for ${guild.id}`);
	}

	// And register global commands
	await rest.put(Routes.applicationCommands(config.client_id), { body: globalCommands });
	console.log(`Registered ${globalCommands.length} global commands`);

	client.destroy();
}

if (process.argv.includes('--update-commands')) {
	updateCommands();
} else {
	main();
}
