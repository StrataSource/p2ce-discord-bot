import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { PermissionLevel } from '../utils/permissions';
import fetch from 'node-fetch';

module.exports = {
	permissionLevel: PermissionLevel.MODERATOR,

	data: new SlashCommandBuilder()
		.setName('banall')
		.setDescription('Bans all users in the given JSON file.')
		.addAttachmentOption(option => option
			.setName('file')
			.setDescription('The JSON file with the users to ban')
			.setRequired(true)),

	async execute(interaction: CommandInteraction) {
		const url = interaction.options.get('file', true).attachment?.url;
		if (!url) return;

		await interaction.deferReply({ ephemeral: true });

		const contents = await fetch(url);
		const contentJSON = JSON.parse(await contents.text());
		let banCount = 0;
		for (const item of contentJSON) {
			interaction.client.users.fetch(item[1])
				.then(clientUser => interaction.guild?.bans.create(clientUser));
			banCount++;
		}
		await interaction.editReply({ content: `Banned ${banCount} users!` });
	}
};
