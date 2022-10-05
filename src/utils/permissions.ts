/* eslint-disable no-fallthrough */
// noinspection FallThroughInSwitchStatementJS

import { GuildMember } from 'discord.js';

import * as config from '../config.json';

export enum PermissionLevel {
	MEMBER      = 0,
	TEAM_MEMBER = 1,
	MODERATOR   = 2,
}

export function hasPermissionLevel(member: GuildMember | null, permissionLevel: PermissionLevel) {
	// Switch uses fallthrough, because lower permissions are always a subset of higher permissions
	const roleId: Array<string> = [];
	switch (permissionLevel) {
	case PermissionLevel.MEMBER:
		roleId.push(config.roles.member);
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
