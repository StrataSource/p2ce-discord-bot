/* eslint-disable @typescript-eslint/no-explicit-any */

import { SlashCommandBuilder } from '@discordjs/builders';
import { CacheType, CommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/command';
import { LogLevelColor } from '../../utils/log';
import { PermissionLevel } from '../../utils/permissions';
import * as persist from '../../utils/persist';

import * as config from '../../config.json';

const ReactionRole: Command = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('reactionrole')
		.setDescription('Reaction role utilities.')
		.addSubcommand(subcommand => subcommand
			.setName('add')
			.setDescription('Add a reaction role to a message. Will turn it into a reaction role message if it isn\'t already.')
			.addStringOption(option => option
				.setName('message')
				.setDescription('The ID of the message to add the reaction to')
				.setRequired(true))
			.addChannelOption(option => option
				.setName('channel')
				.setDescription('The channel the message is in')
				.setRequired(true))
			.addStringOption(option => option
				.setName('emoji')
				.setDescription('The reaction')
				.setRequired(true))
			.addRoleOption(option => option
				.setName('role')
				.setDescription('The role to give or take when reacting')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('list')
			.setDescription('List all current reaction role messages.'))
		.addSubcommand(subcommand => subcommand
			.setName('clear')
			.setDescription('Remove all reaction roles from the given message.')
			.addStringOption(option => option
				.setName('message')
				.setDescription('The ID of the message to remove reactions from')
				.setRequired(true))
			.addBooleanOption(option => option
				.setName('delete')
				.setDescription('Delete the message as well'))),

	async execute(interaction: CommandInteraction<CacheType>) {
		if (!interaction.isChatInputCommand()) return;

		switch (interaction.options.getSubcommand()) {
		case 'add': {
			const message = interaction.options.getString('message', true);
			const channel = interaction.options.getChannel('channel', true);
			const emoji = interaction.options.getString('emoji', true);
			const role = interaction.options.getRole('role', true);

			const discordChannel = interaction.guild?.channels.resolve(channel.id);
			if (discordChannel?.isTextBased()) {
				discordChannel.messages.react(message, emoji);
			}

			// Add message if it's not a reaction role message
			if (!Object.hasOwn(persist.data.reaction_roles, message)) {
				persist.data.reaction_roles[message] = {
					channel: channel.id,
					roles: [
						{
							emoji_name: emoji,
							role: role.id
						}
					]
				};
			} else {
				persist.data.reaction_roles[message]['roles'].push({
					emoji_name: emoji,
					role: role.id
				});
			}
			persist.saveData();

			return interaction.reply({ content: 'Added reaction role to message.', ephemeral: true });
		}

		case 'list': {
			const out: string[] = [];
			for (const [message, reactElement] of Object.entries(persist.data.reaction_roles)) {
				const emojis: string[] = [];
				for (const role of (reactElement as any).roles) {
					emojis.push(role.emoji_name);
				}
				out.push(`https://discord.com/channels/${config.guild}/${(reactElement as any).channel}/${message}\n${emojis.join(' ')}`);
			}
			const desc = out.join('\n\n');
			const embed = new EmbedBuilder()
				.setColor(LogLevelColor.INFO)
				.setTitle('REACTION ROLE - LIST')
				.setDescription(desc.length > 0 ? desc : 'There are no reaction role messages currently.');

			return interaction.reply({ embeds: [embed] });
		}

		case 'clear': {
			const message = interaction.options.getString('message', true);
			if (!Object.hasOwn(persist.data.reaction_roles, message)) {
				return interaction.reply({ content: 'Message given does not have any reaction roles!', ephemeral: true });
			}

			const channel = interaction.guild?.channels.resolve(persist.data.reaction_roles[message].channel);
			if (channel?.isTextBased()) {
				await channel.messages.resolve(message)?.reactions.removeAll();
				if (interaction.options.getBoolean('delete', false)) {
					channel.messages.delete(message);
				}
			}
			delete persist.data.reaction_roles[message];
			persist.saveData();

			return interaction.reply({ content: 'Cleared reaction roles from message.', ephemeral: true });
		}
		}
	}
};
export default ReactionRole;
