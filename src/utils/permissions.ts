import { GuildMember } from 'discord.js';

import * as persist from '../utils/persist';

export enum PermissionLevel {
	EVERYONE    = 0,
	TEAM_MEMBER = 1,
	MODERATOR   = 2,
}

export function hasPermissionLevel(member: GuildMember, permissionLevel: PermissionLevel) {
	if (permissionLevel === PermissionLevel.EVERYONE) {
		return true;
	}

	const data = persist.data(member.guild.id);

	// team member role can be undefined
	const isTeamMember = data.config.roles.team_member && member.roles.cache.some(role => role.id === data.config.roles.team_member);
	const isModerator = member.roles.cache.some(role => role.id === data.config.roles.moderator);
	if (permissionLevel === PermissionLevel.TEAM_MEMBER) {
		return isTeamMember || isModerator;
	} else if (permissionLevel === PermissionLevel.MODERATOR) {
		return isModerator;
	}
	return false;
}
