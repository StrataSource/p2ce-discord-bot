import { ActivityType, Client, Collection, GuildMember, IntentsBitField, Partials } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import fs from 'fs';
import { Command } from './types/command';
import { messageNeedsResponse } from './utils/autorespond';
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
	commands?: Collection<string, Command>;
}

async function main() {
	// You need a token, duh
	if (!config.token) {
		console.log('Error: No token found in config.json!');
		return;
	}

	console.log('Starting...');

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

	// Run this when the client is ready
	client.on('ready', async () => {
		client.user?.setActivity('this server', { type: ActivityType.Watching });
		setTimeout(() => client.user?.setActivity('this server', { type: ActivityType.Watching }), 30e3);
		console.log(`Logged in as ${client.user?.tag}`);
	});

	// Listen for errors
	if (config.options.log_errors) {
		client.on('error', async error => {
			log.error(client, error);
		});
	}

	// Listen for warnings
	if (config.options.log_warnings) {
		client.on('warn', async warn => {
			log.warning(client, warn);
		});
	}

	// Listen for commands
	client.on('interactionCreate', async interaction => {
		if (!interaction.isChatInputCommand()) return;

		const command = client.commands?.get(interaction.commandName);
		if (!command) return;

		// Check if the user has the required permission level
		// This is a backup to Discord's own permissions stuff in case that breaks
		if (!interaction.channel?.isDMBased() && !hasPermissionLevel(interaction.member as GuildMember, command.permissionLevel)) {
			if (interaction.deferred) {
				interaction.followUp('You do not have permission to execute this command!');
				return;
			} else {
				interaction.reply({ content: 'You do not have permission to execute this command!', ephemeral: true });
				return;
			}
		}

		console.log(`/${interaction.commandName} run by ${interaction.user.username}#${interaction.user.discriminator}`);

		command.execute(interaction).catch(err => {
			console.error(err);
			if (interaction.deferred) {
				interaction.followUp(`There was an error while executing this command: ${err}`);
			} else {
				interaction.reply(`There was an error while executing this command: ${err}`);
			}
		});
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
				console.error(err);
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
				console.error(err);
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
			newThread.setArchived(false);
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
	if (config.options.log_user_updates) {
		client.on('userUpdate', async (oldUser, newUser) => {
			log.userUpdate(client, oldUser, newUser);
		});
	}

	// Listen for banned members
	if (config.options.log_user_bans) {
		client.on('guildBanAdd', async ban => {
			log.userBanned(client, ban);
		});
	}

	// Listen for deleted messages
	if (config.options.log_message_deletes) {
		client.on('messageDelete', async message => {
			if (message.cleanContent) {
				log.messageDeleted(client, message);
			}
		});
	}

	// Listen for edited messages
	if (config.options.log_message_edits) {
		client.on('messageUpdate', async (oldMessage, newMessage) => {
			log.messageUpdated(client, oldMessage, newMessage);
		});
	}

	// Listen for messages to respond to
	if (config.options.autorespond) {
		client.on('messageCreate', async message => {
			// Only respond to messages in guilds
			if (message.channel.isDMBased()) return;

			// Only responds to members, any users with higher permissions are safe
			if (!hasPermissionLevel(message.member, PermissionLevel.BETA_TESTER)) {
				// Check for spam
				const spamPrevention = await messageIsSpam(message);
				if (spamPrevention && message.deletable) {
					message.delete();
					message.member?.timeout(config.options.spam_timeout_duration_minutes * 1000 * 60, 'Spamming @mentions');
					log.userSpamResponse(client, message);
				}

				// Check for coop query
				const response = await messageNeedsResponse(message);
				if (response) {
					message.reply(response);
				}
			}
		});
	}

	// Log in
	client.login(config.token);

	process.on('SIGINT', () => {
		console.log('Exiting...');
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
