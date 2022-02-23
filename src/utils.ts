/* eslint-disable no-fallthrough */

import { GuildMember } from 'discord.js';

import * as config from './config.json';

export enum PermissionLevel {
	MEMBER      = 0,
	BETA_TESTER = 1,
	TEAM_MEMBER = 2,
	MODERATOR   = 3,
}

export function hasToken(): boolean {
	return config.token !== null && config.token !== undefined && config.token !== '';
}

export async function hasPermissionLevel(member: GuildMember | null, permissionLevel: PermissionLevel): Promise<boolean> {
	// Switch uses fallthrough, because lower permissions are always a subset of higher permissions
	const roleId: Array<string> = [];
	switch (permissionLevel) {
	case PermissionLevel.MEMBER:
		roleId.push(config.role_ids.member);
	case PermissionLevel.BETA_TESTER:
		roleId.push(config.role_ids.beta_tester);
	case PermissionLevel.TEAM_MEMBER:
		roleId.push(config.role_ids.team_member);
	case PermissionLevel.MODERATOR:
		roleId.push(config.role_ids.moderator);
	}
	for (const id of roleId) {
		if (member?.roles.cache.some(role => role.id === id)) {
			return true;
		}
	}
	return false;
}
