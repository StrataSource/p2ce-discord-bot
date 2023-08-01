import { CacheType, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { LogLevelColor } from '../../utils/log';
import { PermissionLevel } from '../../utils/permissions';

import * as persist from '../../utils/persist';

const StickyRole: Command = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('stickyrole')
		.setDescription('Give new guild members the given role or roles if they had them previously.')
		.addSubcommand(subcommand => subcommand
			.setName('add')
			.setDescription('Add a role to the stickyroles list.')
			.addRoleOption(option => option
				.setName('role')
				.setDescription('The role to add to the stickyroles list')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('list')
			.setDescription('List all current roles in the stickyroles list.'))
		.addSubcommand(subcommand => subcommand
			.setName('remove')
			.setDescription('Remove a role from the stickyroles list.')
			.addRoleOption(option => option
				.setName('role')
				.setDescription('The role to remove from the stickyroles list')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('clear')
			.setDescription('Remove all roles from the stickyroles list.')),

	async execute(interaction: CommandInteraction<CacheType>) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const data = persist.data(interaction.guild.id);

		switch (interaction.options.getSubcommand()) {
		case 'add': {
			const role = interaction.options.getRole('role', true);
			if (role.id in data.stickyroles) {
				return interaction.reply({ content: `${role} is already a stickyrole.`, ephemeral: true });
			}

			data.stickyroles[role.id] = [];
			const members = (await interaction.guild.roles.fetch()).get(role.id)?.members.keys();
			if (members) {
				for (const member of members) {
					data.stickyroles[role.id].push(member);
				}
			}
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: `Added stickyrole ${role}`, ephemeral: true });
		}

		case 'list': {
			const out: string[] = [];
			for (const roleID of data.stickyroles.roles) {
				out.push(`- <@&${roleID}>`);
			}
			const desc = out.join('\n');
			const embed = new EmbedBuilder()
				.setColor(LogLevelColor.INFO)
				.setTitle('STICKYROLE LIST')
				.setDescription(desc.length > 0 ? desc : 'There are no stickyroles currently configured.');

			return interaction.reply({ embeds: [embed] });
		}

		case 'remove': {
			const role = interaction.options.getRole('role', true);

			if (!data.stickyroles.roles.includes(role.id)) {
				return interaction.reply({ content: `${role} is not a stickyrole.`, ephemeral: true });
			}

			delete data.stickyroles[role.id];
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: `Removed stickyrole ${role}`, ephemeral: true });
		}

		case 'clear': {
			data.stickyroles.roles = [];
			persist.saveData(interaction.guild.id);

			return interaction.reply({ content: 'Cleared stickyroles.', ephemeral: true });
		}
		}
	}
};
export default StickyRole;
