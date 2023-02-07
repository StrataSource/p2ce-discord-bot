import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, SlashCommandBuilder, TextChannel, ThreadChannel } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';

const Portal: Command = {
	permissionLevel: PermissionLevel.TEAM_MEMBER,

	data: new SlashCommandBuilder()
		.setName('portal')
		.setDescription('Move to a different channel.')
		.addChannelOption(option => option
			.setName('channel')
			.setDescription('The name of the channel to move to')
			.setRequired(true)),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const channel = await interaction.guild.channels.fetch(interaction.options.getChannel('channel', true).id);
		if (!interaction.channel || !channel) {
			return interaction.reply({ content: `Channel ${channel} does not appear to exist.` });
		}

		if (channel instanceof TextChannel || channel instanceof ThreadChannel) {
			const buttonTo = new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setEmoji('🔗')
				.setLabel('from #' + interaction.channel.name)
				.setURL(interaction.channel.url);
			const buttonBarTo = new ActionRowBuilder<ButtonBuilder>()
				.addComponents(buttonTo);
			await channel.send({ components: [buttonBarTo] });
		}

		const buttonFrom = new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setEmoji('🔗')
			.setLabel('to #' + channel.name)
			.setURL(channel.url);
		const buttonBarFrom = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(buttonFrom);

		return interaction.reply({ components: [buttonBarFrom] });
	}
};
export default Portal;
