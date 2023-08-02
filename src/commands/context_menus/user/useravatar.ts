import { ApplicationCommandType, ContextMenuCommandBuilder, UserContextMenuCommandInteraction } from 'discord.js';
import { ContextMenu } from '../../../types/interaction';
import { PermissionLevel } from '../../../utils/permissions';
import { getMemberAvatar } from '../../shared/avatar';

const UserAvatar: ContextMenu = {
	permissionLevel: PermissionLevel.EVERYONE,

	data: new ContextMenuCommandBuilder()
		.setName('User Avatar')
		.setType(ApplicationCommandType.User),

	async execute(interaction: UserContextMenuCommandInteraction) {
		const user = interaction.targetUser;
		return getMemberAvatar(interaction, user, 2048, true);
	}
};
export default UserAvatar;
