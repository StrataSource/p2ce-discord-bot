import { CacheType, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { LogLevelColor } from '../../utils/log';
import { PermissionLevel } from '../../utils/permissions';

import * as persist from '../../utils/persist';

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
				.setDescription('The link to the message to add the reaction to')
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
			.setName('remove')
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
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const data = persist.data(interaction.guild.id);

		switch (interaction.options.getSubcommand()) {
		case 'add': {
			const messageLink = interaction.options.getString('message', true);
			const emoji = interaction.options.getString('emoji', true);
			const role = interaction.options.getRole('role', true);

			const messageLinkRegex = /(?:https?:\/\/)?(?:(?:www\.)|(?:canary\.))?(?:(?:discord\.(?:gg|io|me|li|com))|(?:discordapp\.com\/))\/channels\/(\d+)\/(\d+)\/(\d+)\/?/;
			const messageLinkData = messageLink.match(messageLinkRegex);
			if (!messageLinkData || messageLinkData.length < 4) {
				return interaction.reply({ content: 'Message link provided is malformed.', ephemeral: true });
			}
			if (messageLinkData[1] !== interaction.guild.id) {
				return interaction.reply({ content: 'The message link provided leads to a different guild!', ephemeral: true });
			}
			const channelID = messageLinkData[2];
			const messageID = messageLinkData[3];

			const discordChannel = interaction.guild.channels.resolve(channelID);
			if (discordChannel?.isTextBased()) {
				try {
					await discordChannel.messages.react(messageID, emoji);
				} catch (err) {
					return interaction.reply({ content: 'Could not react to message with given emoji. The emoji may not be valid, or the message may not exist.', ephemeral: true });
				}
			}

			// Add message if it's not a reaction role message
			if (!Object.hasOwn(data.reaction_roles, messageID)) {
				data.reaction_roles[messageID] = {
					channel: channelID,
					roles: [
						{
							emoji_name: emoji,
							role: role.id
						}
					]
				};
			} else {
				data.reaction_roles[messageID]['roles'].push({
					emoji_name: emoji,
					role: role.id
				});
			}
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: 'Added reaction role to message.', ephemeral: true });
		}

		case 'list': {
			const out: string[] = [];
			for (const [message, reactElement] of Object.entries(data.reaction_roles)) {
				const emojis: string[] = [];
				for (const role of reactElement.roles) {
					emojis.push(role.emoji_name);
				}
				out.push(`https://discord.com/channels/${interaction.guild.id}/${reactElement.channel}/${message}\n${emojis.join(' ')}`);
			}
			const desc = out.join('\n\n');
			const embed = new EmbedBuilder()
				.setColor(LogLevelColor.INFO)
				.setTitle('REACTION ROLE MESSAGES')
				.setDescription(desc.length > 0 ? desc : 'There are no reaction role messages currently.');

			return interaction.reply({ embeds: [embed] });
		}

		case 'remove': {
			const message = interaction.options.getString('message', true);
			if (!Object.hasOwn(data.reaction_roles, message)) {
				return interaction.reply({ content: 'Message given does not have any reaction roles!', ephemeral: true });
			}

			const channel = interaction.guild.channels.resolve(data.reaction_roles[message].channel);
			if (channel?.isTextBased()) {
				await channel.messages.resolve(message)?.reactions.removeAll();
				if (interaction.options.getBoolean('delete', false)) {
					channel.messages.delete(message);
				}
			}
			delete data.reaction_roles[message];
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: 'Cleared reaction roles from message.', ephemeral: true });
		}
		}
	}
};
export default ReactionRole;
