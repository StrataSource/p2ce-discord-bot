import { CacheType, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { LogLevelColor } from '../../utils/log';
import { PermissionLevel } from '../../utils/permissions';

import * as persist from '../../utils/persist';

const AutoRole: Command = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('autorole')
		.setDescription('Give new guild members the given role or roles immediately.')
		.addSubcommand(subcommand => subcommand
			.setName('add')
			.setDescription('Add a role to the autoroles list.')
			.addRoleOption(option => option
				.setName('role')
				.setDescription('The role to add to the autoroles list')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('list')
			.setDescription('List all current roles in the autoroles list.'))
		.addSubcommand(subcommand => subcommand
			.setName('remove')
			.setDescription('Remove a role from the autoroles list.')
			.addRoleOption(option => option
				.setName('role')
				.setDescription('The role to remove from the autoroles list')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('clear')
			.setDescription('Remove all roles from the autoroles list.')),

	async execute(interaction: CommandInteraction<CacheType>) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const data = persist.data(interaction.guild.id);

		switch (interaction.options.getSubcommand()) {
		case 'add': {
			const role = interaction.options.getRole('role', true);
			if (data.autoroles.includes(role.id)) {
				return interaction.reply({ content: `${role} is already an autorole.`, ephemeral: true });
			}

			data.autoroles.push(role.id);
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: `Added autorole ${role}`, ephemeral: true });
		}

		case 'list': {
			const out: string[] = [];
			for (const roleID of data.autoroles) {
				out.push(`- <@&${roleID}>`);
			}
			const desc = out.join('\n\n');
			const embed = new EmbedBuilder()
				.setColor(LogLevelColor.INFO)
				.setTitle('AUTOROLE LIST')
				.setDescription(desc.length > 0 ? desc : 'There are no autoroles currently configured.');

			return interaction.reply({ embeds: [embed] });
		}

		case 'remove': {
			const role = interaction.options.getRole('role', true);

			if (!data.autoroles.includes(role.id)) {
				return interaction.reply({ content: `${role} is not an autorole.`, ephemeral: true });
			}
			data.autoroles = data.autoroles.filter(roleID => roleID !== role.id);
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: `Removed autorole ${role}`, ephemeral: true });
		}

		case 'clear': {
			data.autoroles = [];
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: 'Cleared autoroles.', ephemeral: true });
		}
		}
	}
};
export default AutoRole;
