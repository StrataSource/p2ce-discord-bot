import { ApplicationCommandType, CommandInteraction, ContextMenuCommandBuilder } from 'discord.js';
import { ContextMenu } from '../../../types/interaction';
import { PermissionLevel } from '../../../utils/permissions';
import { isSheetLoaded } from '../../../utils/sheet';
import { readUserApplication } from '../../shared/keyapp';

const KeyAppAdminRead: ContextMenu = {
	permissionLevel: PermissionLevel.TEAM_MEMBER,
	isP2CEOnly: true,

	data: new ContextMenuCommandBuilder()
		.setName('Read Key App')
		.setType(ApplicationCommandType.User),

	async execute(interaction: CommandInteraction) {
		if (!isSheetLoaded()) {
			return interaction.reply({ content: 'Sheet has not finished loading, please try again later.', ephemeral: true });
		}
		return readUserApplication(interaction, interaction.options.getUser('user', true), false);
	}
};
export default KeyAppAdminRead;
