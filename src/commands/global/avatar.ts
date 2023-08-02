import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';
import { AvatarSize } from '../../utils/utils';
import { getMemberAvatar } from '../shared/avatar';

const Avatar: Command = {
	permissionLevel: PermissionLevel.EVERYONE,
	canBeExecutedWithoutPriorGuildSetup: true,

	data: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription('Prints the full avatar of the selected user.')
		.addUserOption(option => option
			.setName('user')
			.setDescription('The name of the user'))
		.addStringOption(option => option
			.setName('avatar_size')
			.setDescription('What size the downloaded avatars are (default 2048x)')
			.addChoices(
				{ name: '16x',     value: '16' },
				{ name: '32x',     value: '32' },
				{ name: '64x',     value: '64' },
				{ name: '128x',   value: '128' },
				{ name: '256x',   value: '256' },
				{ name: '512x',   value: '512' },
				{ name: '1024x', value: '1024' },
				{ name: '2048x', value: '2048' },
				{ name: '4096x', value: '4096' },
			)),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;

		const user = interaction.options.getUser('user') ?? interaction.user;
		const avatarSize = parseInt(interaction.options.getString('avatar_size') ?? '2048') as AvatarSize;

		return getMemberAvatar(interaction, user, avatarSize, false);
	}
};
export default Avatar;
