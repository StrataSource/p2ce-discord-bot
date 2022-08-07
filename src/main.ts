import { ActivityType, Client, Collection, GuildMember, IntentsBitField, Partials, TextChannel } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import fs from 'fs';
import * as log from './utils/log';
import { hasPermissionLevel, PermissionLevel } from './utils/permissions';
import { messageNeedsResponse } from './utils/autorespond';
import { messageIsSpam } from './utils/spamprevent';
import { Command } from './types/command';

import * as config from './config.json';

// Make console output better
import consoleStamp from 'console-stamp';
consoleStamp(console);

interface P2CEClient extends Client {
	commands?: Collection<string, Command>;
}

async function main() {
	// You need a token, duh
	if (!config.token) {
		console.log('[ERROR] No token found in config.json!');
		return;
	}

	console.log('[INFO] Starting...');

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
		]
	});

	// Register commands
	client.commands = new Collection();
	for (const file of fs.readdirSync('./build/commands').filter(file => file.endsWith('.js'))) {
		const command: Command = (await import(`./commands/${file}`)).default;
		client.commands.set(command.data.name, command);
	}

	// Run this when the client is ready
	client.on('ready', async () => {
		client.user?.setActivity('this server', { type: ActivityType.Watching });
		setTimeout(() => client.user?.setActivity('this server', { type: ActivityType.Watching }), 30e3);
		console.log(`[INFO] Logged in as ${client.user?.tag}`);
	});

	// Listen for commands
	client.on('interactionCreate', async interaction => {
		if (!interaction.isCommand()) return;

		const command = client.commands?.get(interaction.commandName);
		if (!command) return;

		// Check if the user has the required permission level
		if (!await hasPermissionLevel(interaction.member as GuildMember, command.permissionLevel)) {
			if (interaction.deferred) {
				interaction.followUp('You do not have permission to execute this command!');
				return;
			} else {
				interaction.reply({ content: 'You do not have permission to execute this command!', ephemeral: true });
				return;
			}
		}

		try {
			command.execute(interaction);
			return;
		} catch (error) {
			console.error(error);
			interaction.reply({ content: `There was an error while executing this command: ${error}`, ephemeral: true });
			return;
		}
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
			// Only responds to members, any users with higher permissions are safe
			if (!await hasPermissionLevel(message.member as GuildMember, PermissionLevel.BETA_TESTER)) {
				const response = await messageNeedsResponse(message);
				if (response) {
					message.reply(response);
				}

				const spam_prevention = await messageIsSpam(message);
				if (spam_prevention){
					message.delete();
					message.member?.timeout(config.options.timeoutTime, config.messages.timeoutSpamReason);
					log.userSpamResponse(client, message);
				}
			}
		});
	}

	// Log in
	client.login(config.token);
}

async function updateCommands() {
	// You need a token, duh
	if (!config.token) {
		console.log('[ERROR] No token found in config.json!');
		return;
	}

	console.log('[INFO] Registering commands...');

	const commands = [];
	for (const file of fs.readdirSync('./build/commands').filter(file => file.endsWith('.js'))) {
		commands.push((await import(`./commands/${file}`)).data.toJSON());
	}

	// Update commands for every guild
	const rest = new REST({ version: '10' }).setToken(config.token);
	await rest.put(Routes.applicationGuildCommands(config.client_id, config.guild), { body: commands })
		.then(() => console.log(`[INFO] Registered ${commands.length} application commands for guild ${config.guild}`))
		.catch(console.error);

	console.log('[INFO] Done!');
}

if (process.argv.includes('--update-commands')) {
	updateCommands();
} else {
	main();
}
