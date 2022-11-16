import { ApplicationCommandType, ContextMenuCommandBuilder, UserContextMenuCommandInteraction } from 'discord.js';
import { ContextMenu } from '../../../types/interaction';
import { PermissionLevel } from '../../../utils/permissions';
import { getWarnList } from '../../shared/warnlist';

const WarnList: ContextMenu = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new ContextMenuCommandBuilder()
		.setName('Warn List')
		.setType(ApplicationCommandType.User),

	async execute(interaction: UserContextMenuCommandInteraction) {
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}
		return getWarnList(interaction, interaction.guild, interaction.targetUser, true);
	}
};
export default WarnList;
