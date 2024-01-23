import { KeyStatus } from './keyapp';

// Modify this interface when adding new data things, or don't if you hate TypeScript and everything it stands for
export interface PersistentData {
	autoroles: string[],
	compat: {
		pluralkit: {
			accounts: string[];
		}
	},
	config: {
		first_time_setup: boolean,
		log: {
			options: {
				user_updates: boolean,
				user_avatar_updates: boolean,
				user_bans: boolean,
				user_joins_and_leaves: boolean,
				user_boosts?: boolean | undefined,
				message_deletes: boolean,
				message_edits: boolean,
				moderator_events: boolean | undefined,
				team_member_events: boolean | undefined,
			},
			channel: string,
			public_channel?: string | undefined,
			user_exceptions: string[],
		},
		roles: {
			moderator: string,
			team_member?: string | undefined,
		}
	},
	github_repos: {
		[id: string]: {
			owner: string,
			name: string,
		},
	},
	keyapps: {
		[user: string]: {
			rationale: string,
			role: string,
			mod: string,
			report: string,
			experience: string,
			notes: string,
			accept_state: KeyStatus,
			key_given: string,
		},
	},
	linked_accounts: {
		config: {
			steam: {
				required_appids: string[],
			},
		},
		steam: {
			[user: string]: {
				verified: boolean,
				owns_required_appids: boolean,
				account_id: string,
			},
		},
	},
	moderation: {
		autoban: {
			enabled: boolean,
			new_accounts: number,
		},
		warns: {
			[user: string]: {
				date: number,
				reason: string,
				issuer: string,
			}[],
		},
		watchlist: {
			channel: string | null,
			users: string[],
		},
	},
	reaction_roles: {
		[message: string]: {
			channel: string,
			roles: {
				emoji_name: string,
				role: string,
			}[],
		},
	},
	responses: {
		[response_id: string]: string,
	},
	watched_threads: string[],
	statistics: {
		joins: number,
		leaves: number,
	},
	stickyroles: {
		[role_id: string]: string[],
	},
}
