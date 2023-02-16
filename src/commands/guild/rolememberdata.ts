import { AttachmentBuilder, CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';
import { formatUserRaw } from '../../utils/utils';
import fetch from 'node-fetch';
import AdmZip from 'adm-zip';

type AvatarSize = 64 | 128 | 256 | 1024 | 4096;

const RoleMemberData: Command = {
	permissionLevel: PermissionLevel.MODERATOR,
	isP2CEOnly: true,

	data: new SlashCommandBuilder()
		.setName('rolememberdata')
		.setDescription('Exports a zip file of role members\' data and avatars')
		.addRoleOption(option => option
			.setName('role')
			.setDescription('The role to grab members\' info from')
			.setRequired(true))
		.addStringOption(option => option
			.setName('avatar_size')
			.setDescription('What size the downloaded avatars are')
			.addChoices(
				// change AvatarSize if these change
				{ name: '64 x 64',     value: '64' },
				{ name: '128 x 128',   value: '128' },
				{ name: '256 x 256',   value: '256' },
				{ name: '1024 x 1024', value: '1024' },
				{ name: '4096 x 4096', value: '4096' },
			))
		.addBooleanOption(option => option
			.setName('use_nicknames')
			.setDescription('When creating files for a given member, use their nickname instead of their account name')),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.inGuild() || !interaction.guild) {
			return interaction.reply({ content: 'This command must be ran in a guild.', ephemeral: true });
		}

		const role = interaction.options.getRole('role', true);
		const avatarSize = parseInt(interaction.options.getString('avatar_size') ?? '1024') as AvatarSize;
		const useNicknames = interaction.options.getBoolean('use_nicknames') ?? false;

		const guildMembers = await interaction.guild.members.fetch();
		const roleMembers = guildMembers.filter(member => member.roles.cache.has(role.id));

		await interaction.deferReply();

		const zip = new AdmZip();
		const memberDataList: {[user: string]: {nickname: string}} = {};
		for (const [, member] of roleMembers) {
			const avatar = await fetch(member.displayAvatarURL({ size: avatarSize }));
			const buffer = await avatar.buffer();
			if (useNicknames) {
				zip.addFile(`avatars/${member.nickname ?? member.displayName}.webp`, buffer);
			} else {
				zip.addFile(`avatars/${formatUserRaw(member.user)}.webp`, buffer);
			}
			memberDataList[formatUserRaw(member.user)] = { nickname: member.nickname ?? member.displayName };
		}
		zip.addFile('members.json', Buffer.from(JSON.stringify(memberDataList, null, 2), 'utf-8'));

		const attachment = new AttachmentBuilder(zip.toBuffer(), { name: `member_data_${role.id}.zip` });
		return interaction.editReply({ files: [attachment] });
	},
};
export default RoleMemberData;
