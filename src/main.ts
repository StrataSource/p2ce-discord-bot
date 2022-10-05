// noinspection JSIgnoredPromiseFromCall

import { ActivityType, Client, Collection, GuildMember, IntentsBitField, Partials } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import fs from 'fs';
import { Callbacks, MoralityCoreClient } from './types/client';
import { Command, ContextMenu } from './types/interaction';
import { hasPermissionLevel, PermissionLevel } from './utils/permissions';

import * as config from './config.json';
import * as log from './utils/log';
import * as persist from './utils/persist';

// Make console output better
import consoleStamp from 'console-stamp';
consoleStamp(console);

async function updateCommands() {
	// You need a token, duh
	if (!config.token) {
		log.writeToLog(undefined, 'Error updating commands: no token found in config.json!');
		return;
	}

	const dateStart = new Date();
	log.writeToLog(undefined, `--- UPDATE COMMANDS FOR ALL GUILDS START AT ${dateStart.toDateString()} ${dateStart.getHours()}:${dateStart.getMinutes()}:${dateStart.getSeconds()} ---`);

	const client = new Client({
		intents: [
			IntentsBitField.Flags.Guilds
		]
	});
	await client.login(config.token);

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
		log.writeToLog(undefined, `Registered ${guildCommands.length} guild commands for ${guild.id}`);
	}

	// And register global commands
	await rest.put(Routes.applicationCommands(config.client_id), { body: globalCommands });
	log.writeToLog(undefined, `Registered ${globalCommands.length} global commands`);

	const dateEnd = new Date();
	log.writeToLog(undefined, `--- UPDATE COMMANDS FOR ALL GUILDS END AT ${dateEnd.toDateString()} ${dateEnd.getHours()}:${dateEnd.getMinutes()}:${dateEnd.getSeconds()} ---`);
	client.destroy();
}

async function updateCommandsForGuild(guildID: string) {
	const guildCommands = [];
	for (const file of fs.readdirSync('./build/commands/guild').filter(file => file.endsWith('.js'))) {
		guildCommands.push((await import(`./commands/guild/${file}`)).default.data.toJSON());
	}

	// Context menus are assumed to be guild-based
	//for (const file of fs.readdirSync('./build/commands/context_menus/message').filter(file => file.endsWith('.js'))) {
	//	guildCommands.push((await import(`./commands/context_menus/message/${file}`)).default.data.toJSON());
	//}
	for (const file of fs.readdirSync('./build/commands/context_menus/user').filter(file => file.endsWith('.js'))) {
		guildCommands.push((await import(`./commands/context_menus/user/${file}`)).default.data.toJSON());
	}

	const rest = new REST({ version: '10' }).setToken(config.token);

	// Update commands for this guild
	await rest.put(Routes.applicationGuildCommands(config.client_id, guildID), { body: guildCommands });
	log.writeToLog(undefined, `Registered ${guildCommands.length} guild commands for ${guildID}`);
}

async function main() {
	// You need a token, duh
	if (!config.token) {
		log.writeToLog(undefined, 'Error: no token found in config.json!');
		return;
	}

	const date = new Date();
	log.writeToLog(undefined, `--- BOT START AT ${date.toDateString()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ---`);

	// Create client
	const client = new MoralityCoreClient({
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
		client.user?.setActivity('this server', { type: ActivityType.Watching });
		setTimeout(() => client.user?.setActivity('this server', { type: ActivityType.Watching }), 30e3);
		log.writeToLog(undefined, `Logged in as ${client.user?.tag}`);
	});

	// Listen for errors
	client.on('error', async error => {
		await log.error(client, error);
	});

	// Listen for warnings
	client.on('warn', async warn => {
		await log.warning(client, warn);
	});

	// Listen for joined guilds
	client.on('guildCreate', async guild => {
		await updateCommandsForGuild(guild.id);

		log.writeToLog(guild.id, `Joined guild ${guild.id}`);
	});

	// Listen for left guilds
	client.on('guildDelete', async guild => {
		log.writeToLog(guild.id, `Left guild ${guild.id}`);

		// Delete log and database files
		fs.rmSync(log.getLogFilepath(guild.id));
		fs.rmSync(persist.getDataFilepath(guild.id));
	});

	// Listen for commands
	client.on('interactionCreate', async interaction => {
		if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
			const command = client.commands?.get(interaction.commandName);
			if (!command) return;

			// Check if the user has the required permission level
			// This is a backup to Discord's own permissions stuff in case that breaks
			if (!interaction.channel?.isDMBased() && interaction.guild) {
				if (!persist.data(interaction.guild.id).first_time_setup && !command.canBeExecutedWithoutPriorGuildSetup) {
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
				log.writeToLog(interaction.guild?.id, `Context menu "${interaction.commandName}" clicked by ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id})`);
			} else {
				log.writeToLog(interaction.guild?.id, `Command "${interaction.commandName}" ran by ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id})`);
			}

			try {
				await command.execute(interaction, client.callbacks);
			} catch (err) {
				log.writeToLog(undefined, (err as Error).toString());
				if (interaction.deferred) {
					await interaction.followUp(`There was an error while executing this command: ${err}`);
				} else {
					await interaction.reply(`There was an error while executing this command: ${err}`);
				}
				return;
			}
		} else if (interaction.isButton() || interaction.isSelectMenu()) {
			if (interaction.user !== interaction.message.interaction?.user) {
				await interaction.reply({ content: `You cannot touch someone else's buttons! These buttons are owned by ${interaction.message.interaction?.user}`, ephemeral: true });
				return;
			}

			log.writeToLog(interaction.guild?.id, `Action row item with ID "${interaction.customId}" clicked by ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id})`);

			try {
				if (interaction.isButton()) {
					await client.callbacks.runButtonCallback(interaction.customId, interaction);
				} else if (interaction.isSelectMenu()) {
					await client.callbacks.runSelectMenuCallback(interaction.customId, interaction);
				}
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
	client.on('userUpdate', async (oldUser, newUser) => {
		for (const guild of (await client.guilds.fetch()).values()) {
			const member = (await (await guild.fetch()).members.fetch()).get(newUser.id);
			if (member) {
				const data = persist.data(guild.id);
				if (data.config.log.options.user_updates) {
					log.userUpdate(client, guild.id, oldUser, newUser);
				}
			}
		}
	});

	// Listen for banned members
	client.on('guildBanAdd', async ban => {
		if (persist.data(ban.guild.id).config.log.options.user_bans) {
			log.userBanned(client, ban.guild.id, ban);
		}
	});

	// Listen for deleted messages
	client.on('messageDelete', async message => {
		// Only responds to members
		if (message.member && !hasPermissionLevel(message.member, PermissionLevel.TEAM_MEMBER) && message.cleanContent && message.guild) {
			const data = persist.data(message.guild.id);
			if (data.config.log.options.message_deletes && message.author && !data.config.log.user_exceptions.includes(message.author.id)) {
				log.messageDeleted(client, message.guild.id, message);
			}
		}
	});

	// Listen for edited messages
	client.on('messageUpdate', async (oldMessage, newMessage) => {
		// Only responds to members
		if (newMessage.member && !hasPermissionLevel(newMessage.member, PermissionLevel.TEAM_MEMBER) && newMessage.guild) {
			const data = persist.data(newMessage.guild.id);
			if (data.config.log.options.message_edits && newMessage.author && !data.config.log.user_exceptions.includes(newMessage.author.id)) {
				log.messageUpdated(client, newMessage.guild.id, oldMessage, newMessage);
			}
		}
	});

	// Listen for members joining
	client.on('guildMemberAdd', async member => {
		const data = persist.data(member.guild.id);
		data.statistics.joins++;
		persist.saveData(member.guild.id);

		// Add autoroles
		for (const roleID of data.autoroles) {
			await member.roles.add(roleID);
		}

		if (data.config.log.options.user_joins_and_leaves) {
			log.userJoined(client, member.guild.id, member);
		}
	});

	// Listen for members leaving
	client.on('guildMemberRemove', async member => {
		const data = persist.data(member.guild.id);
		data.statistics.leaves++;
		persist.saveData(member.guild.id);

		if (data.config.log.options.user_joins_and_leaves) {
			log.userLeft(client, member.guild.id, member);
		}
	});

	// Log in
	await client.login(config.token);

	process.on('SIGINT', () => {
		const date = new Date();
		log.writeToLog(undefined, `--- BOT END AT ${date.toDateString()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ---`);
		client.destroy();
		persist.saveAll();
		process.exit();
	});
}

if (process.argv.includes('--update-commands')) {
	updateCommands();
} else {
	main();
}
