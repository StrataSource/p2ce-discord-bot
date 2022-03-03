import { Client, Collection, GuildMember, Intents } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import fs from 'fs';
import * as log from './utils/log';
import { hasPermissionLevel } from './utils/permissions';

import * as config from './config.json';

// Make console output better
import consoleStamp from 'console-stamp';
consoleStamp(console);

interface P2CEClient extends Client {
	// Using any is bad, but it's necessary here
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	commands?: Collection<string, any>;
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
		intents: [
			Intents.FLAGS.GUILDS,
			Intents.FLAGS.GUILD_BANS,
			Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
			Intents.FLAGS.GUILD_INVITES,
			Intents.FLAGS.GUILD_MEMBERS,
			Intents.FLAGS.GUILD_MESSAGES,
			Intents.FLAGS.GUILD_MESSAGE_REACTIONS
		],
		partials: [
			'CHANNEL',
			'MESSAGE',
			'GUILD_MEMBER'
		]
	});

	// Register commands
	client.commands = new Collection();
	for (const file of fs.readdirSync('./build/commands').filter(file => file.endsWith('.js'))) {
		const command = await import(`./commands/${file}`);
		client.commands.set(command.data.name, command);
	}

	// Run this when the client is ready
	client.on('ready', async () => {
		client.user?.setActivity('this server', { type: 'WATCHING' });
		setTimeout(() => client.user?.setActivity('this server', { type: 'WATCHING' }), 30e3);
		console.log(`[INFO] Logged in as ${client.user?.tag}!`);
	});

	// Listen for commands
	client.on('interactionCreate', async interaction => {
		if (!interaction.isCommand()) return;
	
		const command = client.commands?.get(interaction.commandName);
		if (!command) return;

		// Check if the user has the required permission level
		if (!await hasPermissionLevel(interaction.member as GuildMember, command.permissionLevel)) {
			return interaction.reply({ content: 'You do not have permission to execute this command!', ephemeral: true });
		}

		try {
			return command.execute(interaction);
		} catch (error) {
			console.error(error);
			return interaction.reply({ content: `There was an error while executing this command: ${error}`, ephemeral: true });
		}
	});

	// Listen for errors
	client.on('error', async error => {
		log.error(client, error);
	});

	// Listen for warnings
	client.on('warn', async warn => {
		log.warning(client, warn);
	});

	// Listen for debug messages
	client.on('debug', async debug => {
		log.debug(debug);
	});

	/*
	// Listen for presence updates
	client.on('userUpdate', async (oldUser, newUser) => {
		log.userUpdate(client, oldUser, newUser);
	});
	*/

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
	const rest = new REST({ version: '9' }).setToken(config.token);
	await rest.put(Routes.applicationGuildCommands(config.client_id, config.guild), { body: commands })
		.then(() => console.log(`[INFO] Registered ${commands.length} application commands for guild ${config.guild}.`))
		.catch(console.error);

	console.log('[INFO] Done!');
}

if (process.argv.includes('--update-commands')) {
	updateCommands();
} else {
	main();
}
