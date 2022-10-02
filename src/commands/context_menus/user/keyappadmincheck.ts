import { ApplicationCommandType, CommandInteraction, ContextMenuCommandBuilder } from 'discord.js';
import { ContextMenu } from '../../../types/interaction';
import { PermissionLevel } from '../../../utils/permissions';
import { isSheetLoaded } from '../../../utils/sheet';
import { checkUserKeyStatus } from '../../../utils/sheet-check';

const KeyAppAdminCheck: ContextMenu = {
	permissionLevel: PermissionLevel.TEAM_MEMBER,

	data: new ContextMenuCommandBuilder()
		.setName('Check Key App')
		.setType(ApplicationCommandType.User),

	async execute(interaction: CommandInteraction) {
		if (!isSheetLoaded()) {
			return interaction.reply({ content: 'Sheet has not finished loading, please try again later.', ephemeral: true });
		}
		return checkUserKeyStatus(interaction, interaction.options.getUser('user', true), false);
	}
};
export default KeyAppAdminCheck;
