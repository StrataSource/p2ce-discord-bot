import { Client, IntentsBitField } from 'discord.js';
import fs from 'fs';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

import * as config from '../config.json';
import * as log from './log';
import * as persist from './persist';

export async function updateCommands() {
	// You need a token, duh
	if (!config.token) {
		log.writeToLog(undefined, 'Error updating commands: no token found in config.json!');
		return;
	}

	const dateStart = new Date();
	log.writeToLog(undefined, `--- UPDATE COMMANDS FOR ALL GUILDS START AT ${dateStart.toDateString()} ${dateStart.getHours()}:${dateStart.getMinutes()}:${dateStart.getSeconds()} ---`);

	const client = new Client({
		intents: [
			IntentsBitField.Flags.Guilds,
		],
	});
	await client.login(config.token);

	const guildCommands = [];
	for (const file of fs.readdirSync('./build/commands/guild').filter(file => file.endsWith('.js'))) {
		guildCommands.push((await import(`../commands/guild/${file}`)).default);
	}
	const globalCommands = [];
	for (const file of fs.readdirSync('./build/commands/global').filter(file => file.endsWith('.js'))) {
		globalCommands.push((await import(`../commands/global/${file}`)).default);
	}

	// Context menus are assumed to be guild-based
	//for (const file of fs.readdirSync('./build/commands/context_menus/message').filter(file => file.endsWith('.js'))) {
	//	guildCommands.push((await import(`../commands/context_menus/message/${file}`)).default);
	//}
	for (const file of fs.readdirSync('./build/commands/context_menus/user').filter(file => file.endsWith('.js'))) {
		guildCommands.push((await import(`../commands/context_menus/user/${file}`)).default);
	}

	// Update commands for every guild
	const rest = new REST({ version: '10' }).setToken(config.token);
	for (const guild of (await client.guilds.fetch()).values()) {
		const data = persist.data(guild.id);
		let filteredCommands = guildCommands;
		if (!config.p2ce_command_guilds.includes(guild.id)) {
			filteredCommands = filteredCommands.filter(cmd => !Object.hasOwn(cmd, 'isP2CEOnly') || !cmd.isP2CEOnly);
		}
		if (!data.config.first_time_setup) {
			filteredCommands = filteredCommands.filter(cmd => Object.hasOwn(cmd, 'canBeExecutedWithoutPriorGuildSetup') && cmd.canBeExecutedWithoutPriorGuildSetup);
		}
		filteredCommands = filteredCommands.map(cmd => cmd.data.toJSON());
		await rest.put(Routes.applicationGuildCommands(config.client_id, guild.id), { body: filteredCommands });
		log.writeToLog(undefined, `Registered ${filteredCommands.length} guild commands for ${guild.id}`);
	}

	// And register global commands
	await rest.put(Routes.applicationCommands(config.client_id), { body: globalCommands.map(cmd => cmd.data.toJSON()) });
	log.writeToLog(undefined, `Registered ${globalCommands.length} global commands`);

	const dateEnd = new Date();
	log.writeToLog(undefined, `--- UPDATE COMMANDS FOR ALL GUILDS END AT ${dateEnd.toDateString()} ${dateEnd.getHours()}:${dateEnd.getMinutes()}:${dateEnd.getSeconds()} ---`);
	client.destroy();
}

export async function updateCommandsForGuild(guildID: string) {
	const guildCommands = [];
	for (const file of fs.readdirSync('./build/commands/guild').filter(file => file.endsWith('.js'))) {
		guildCommands.push((await import(`../commands/guild/${file}`)).default);
	}

	// Context menus are assumed to be guild-based
	//for (const file of fs.readdirSync('./build/commands/context_menus/message').filter(file => file.endsWith('.js'))) {
	//	guildCommands.push((await import(`../commands/context_menus/message/${file}`)).default);
	//}
	for (const file of fs.readdirSync('./build/commands/context_menus/user').filter(file => file.endsWith('.js'))) {
		guildCommands.push((await import(`../commands/context_menus/user/${file}`)).default);
	}

	const data = persist.data(guildID);
	let filteredCommands = guildCommands;
	if (!config.p2ce_command_guilds.includes(guildID)) {
		filteredCommands = filteredCommands.filter(cmd => !Object.hasOwn(cmd, 'isP2CEOnly') || !cmd.isP2CEOnly);
	}
	if (!data.config.first_time_setup) {
		filteredCommands = filteredCommands.filter(cmd => Object.hasOwn(cmd, 'canBeExecutedWithoutPriorGuildSetup') && cmd.canBeExecutedWithoutPriorGuildSetup);
	}
	filteredCommands = filteredCommands.map(cmd => cmd.data.toJSON());

	// Update commands for this guild
	const rest = new REST({ version: '10' }).setToken(config.token);
	await rest.put(Routes.applicationGuildCommands(config.client_id, guildID), { body: filteredCommands });
	log.writeToLog(undefined, `Registered ${filteredCommands.length} guild commands for ${guildID}`);
}
