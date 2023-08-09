import {ChannelType, CommandInteraction, SlashCommandBuilder} from 'discord.js';
import {Command} from '../../types/interaction';
import {PermissionLevel} from '../../utils/permissions';

const Say: Command = {
	permissionLevel: PermissionLevel.TEAM_MEMBER,

	data: new SlashCommandBuilder()
		.setName('say')
		.setDescription('Sends a message in the given channel.')
		.addStringOption(option => option
			.setName('message')
			.setDescription('The message to send')
			.setRequired(true))
		.addChannelOption(option => option
			.setName('channel')
			.setDescription('The channel to send the message to')
			.addChannelTypes(
				ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread,
			)),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;

		const message = interaction.options.getString('message', true);
		const channel = interaction.options.getChannel('channel', false, [
			ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread,
		]) ?? interaction.channel;
		try {
			await channel?.send(message);
		} catch (ignored) {
			return interaction.reply({ content: `Error encountered when sending message "${message}" to ${channel}. Check channel permissions are correct!`, ephemeral: true });
		}
		return interaction.reply({ content: `Echoed "${message}" to ${channel}.`, ephemeral: true });
	}
};
export default Say;
