import { ApplicationCommandType, ContextMenuCommandBuilder, UserContextMenuCommandInteraction } from 'discord.js';
import { ContextMenu } from '../../../types/interaction';
import { PermissionLevel } from '../../../utils/permissions';
import { getUserInfo } from '../../shared/userinfo';

const UserInfo: ContextMenu = {
	permissionLevel: PermissionLevel.EVERYONE,

	data: new ContextMenuCommandBuilder()
		.setName('User Info')
		.setType(ApplicationCommandType.User),

	async execute(interaction: UserContextMenuCommandInteraction) {
		const user = interaction.targetUser;
		return getUserInfo(interaction, user, true);
	}
};
export default UserInfo;
