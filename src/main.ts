import { Client, Collection, GuildMember, Intents } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import fs from 'fs';

import { hasToken, hasPermissionLevel } from './utils';
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
	if (!hasToken()) {
		console.log('No token found in config.json!');
		return;
	}

	console.log('Starting...');

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

	// Run this when the client is ready
	client.on('ready', async () => {
		client.user?.setActivity('this server', { type: 'WATCHING' });
		setTimeout(() => client.user?.setActivity('this server', { type: 'WATCHING' }), 30e3);
		console.log(`Logged in as ${client.user?.tag}!`);
	});

	// Register commands
	client.commands = new Collection();
	for (const file of fs.readdirSync('./build/commands').filter(file => file.endsWith('.js'))) {
		const command = await import(`./commands/${file}`);
		client.commands.set(command.data.name, command);
	}

	// Listen for commands
	client.on('interactionCreate', async interaction => {
		if (!interaction.isCommand()) return;
	
		const command = client.commands?.get(interaction.commandName);
		if (!command) return;

		// Check if the user has the required permission level
		if (!await hasPermissionLevel(interaction.member as GuildMember, command.permissionLevel)) {
			await interaction.reply({ content: 'You do not have permission to execute this command!', ephemeral: true });
			return;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: `There was an error while executing this command: ${error}`, ephemeral: true });
		}
	});

	// Login
	client.login(config.token);
}

async function updateCommands() {
	// You need a token, duh
	if (!hasToken()) {
		console.log('No token found in config.json!');
		return;
	}

	console.log('Registering commands...');

	const commands = [];
	for (const file of fs.readdirSync('./build/commands').filter(file => file.endsWith('.js'))) {
		commands.push((await import(`./commands/${file}`)).data.toJSON());
	}

	// Update commands for every guild
	const rest = new REST({ version: '9' }).setToken(config.token);
	for (const guild of config.guilds) {
		await rest.put(Routes.applicationGuildCommands(config.client_id, guild), { body: commands })
			.then(() => console.log(`Registered ${commands.length} application commands for guild ${guild}.`))
			.catch(console.error);
	}

	console.log('Done!');
}

if (process.argv.includes('--update-commands')) {
	updateCommands();
} else {
	main();
}
