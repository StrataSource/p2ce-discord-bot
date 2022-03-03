/* eslint-disable no-fallthrough */

import { GuildMember } from 'discord.js';

import * as config from '../config.json';

export enum PermissionLevel {
	MEMBER      = 0,
	BETA_TESTER = 1,
	TEAM_MEMBER = 2,
	MODERATOR   = 3,
}

export async function hasPermissionLevel(member: GuildMember | null, permissionLevel: PermissionLevel): Promise<boolean> {
	// Switch uses fallthrough, because lower permissions are always a subset of higher permissions
	const roleId: Array<string> = [];
	switch (permissionLevel) {
	case PermissionLevel.MEMBER:
		roleId.push(config.roles.member);
	case PermissionLevel.BETA_TESTER:
		roleId.push(config.roles.beta_tester);
	case PermissionLevel.TEAM_MEMBER:
		roleId.push(config.roles.team_member);
	case PermissionLevel.MODERATOR:
		roleId.push(config.roles.moderator);
	}
	for (const id of roleId) {
		if (member?.roles.cache.some(role => role.id === id)) {
			return true;
		}
	}
	return false;
}
