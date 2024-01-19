// noinspection JSUnusedGlobalSymbols

import { ApplicationCommandType, CommandInteraction, ContextMenuCommandBuilder } from 'discord.js';
import { ContextMenu } from '../../../types/interaction';
import { PermissionLevel } from '../../../utils/permissions';
import { checkUserKeyStatus } from '../../shared/keyapp';

const KeyAppAdminCheck: ContextMenu = {
	permissionLevel: PermissionLevel.TEAM_MEMBER,
	isP2CEOnly: true,

	data: new ContextMenuCommandBuilder()
		.setName('Check Key App')
		.setType(ApplicationCommandType.User),

	async execute(interaction: CommandInteraction) {
		return checkUserKeyStatus(interaction, interaction.options.getUser('user', true), false);
	}
};
export default KeyAppAdminCheck;
