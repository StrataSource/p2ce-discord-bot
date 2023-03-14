import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, CommandInteraction, GuildMember, PermissionsBitField, SlashCommandBuilder, TextChannel, ThreadChannel } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';

const Portal: Command = {
	permissionLevel: PermissionLevel.EVERYONE,

	data: new SlashCommandBuilder()
		.setName('portal')
		.setDescription('Move to a different channel.')
		.addChannelOption(option => option
			.setName('channel')
			.setDescription('The name of the channel to move to')
			.addChannelTypes(
				ChannelType.GuildText,
				ChannelType.PublicThread,
			)
			.setRequired(true)),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const channel = await interaction.guild.channels.fetch(interaction.options.getChannel('channel', true).id);
		if (!interaction.channel || !channel) {
			return interaction.reply({ content: `Channel ${channel} does not appear to exist.`, ephemeral: true });
		}
		if (interaction.channel.id === channel.id) {
			return interaction.reply({ content: 'Cannot portal to an identical channel.', ephemeral: true });
		}
		if (!(channel instanceof TextChannel || channel instanceof ThreadChannel)) {
			return interaction.reply({ content: `Channel ${channel} is not a text channel or public thread.`, ephemeral: true });
		}

		let perms: Readonly<PermissionsBitField>;
		if (!(interaction.member instanceof GuildMember)) {
			perms = channel.permissionsFor(await interaction.guild.members.fetch(interaction.user));
		} else {
			perms = channel.permissionsFor(interaction.member);
		}
		if (!perms.has('SendMessages')) {
			return interaction.reply({ content: `You are lacking the right permissions to create messages in channel ${channel}.`, ephemeral: true });
		}

		const buttonToInitial = new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setEmoji('🔗')
			.setLabel('from #' + interaction.channel.name)
			.setURL(interaction.channel.url);
		const buttonBarToInitial = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(buttonToInitial);
		const messageTo = await channel.send({ components: [buttonBarToInitial] });

		const buttonFrom = new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setEmoji('🔗')
			.setLabel('to #' + channel.name)
			.setURL(messageTo.url);
		const buttonBarFrom = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(buttonFrom);
		const messageFrom = await interaction.channel.send({ components: [buttonBarFrom] });

		const buttonTo = new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setEmoji('🔗')
			.setLabel('from #' + interaction.channel.name)
			.setURL(messageFrom.url);
		const buttonBarTo = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(buttonTo);
		await messageTo.edit({ components: [buttonBarTo] });

		return interaction.reply({ content: `Created portal to channel ${channel}!`, ephemeral: true });
	}
};
export default Portal;
