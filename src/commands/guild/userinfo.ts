import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';
import { getUserInfo } from '../shared/userinfo';

const UserInfo: Command = {
	permissionLevel: PermissionLevel.MEMBER,

	data: new SlashCommandBuilder()
		.setName('userinfo')
		.setDescription('Displays some information about the given user.')
		.addUserOption(option => option
			.setName('user')
			.setDescription('The name of the user')),

	async execute(interaction: CommandInteraction) {
		const user = interaction.options.getUser('user') ?? interaction.user;
		return getUserInfo(interaction, user, false);
	},
};
export default UserInfo;
